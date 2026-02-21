"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/types/database";

export interface SourceInput {
  id?: string;
  url: string;
  keywords: string[] | string; // UI에서 콤마 구분 문자열로 올 수 있음
  viewpoint: string;
}

export interface UserConfigWithSources {
  config: Tables<"user_configs"> | null;
  sources: Tables<"sources">[];
}

export function useConfig() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["user-config"],
    queryFn: async (): Promise<UserConfigWithSources> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return { config: null, sources: [] };

      const [configResult, sourcesResult] = await Promise.all([
        supabase
          .from("user_configs")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("sources")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true }),
      ]);

      return {
        config: configResult.data ?? null,
        sources: sourcesResult.data ?? [],
      };
    },
    staleTime: 2 * 60 * 1000,
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: { sources: SourceInput[] }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const validSources = payload.sources.filter((s) => s.url.trim() !== "");

      // Ensure user_configs exists (required by generate API)
      const kw =
        validSources[0]?.keywords ?? [];
      const firstKeywords =
        Array.isArray(kw) && kw.filter(Boolean).length > 0
          ? kw.filter(Boolean)
          : ["general"];
      const firstViewpoint = validSources[0]?.viewpoint?.trim() ?? "";

      // @ts-expect-error - Supabase client 타입 추론 이슈 (generate route와 동일)
      await supabase.from("user_configs").upsert(
        {
          user_id: user.id,
          keywords: firstKeywords,
          viewpoint: firstViewpoint,
          schedule_cron: null,
        },
        { onConflict: "user_id" }
      );

      // Get existing source ids for this user
      const { data: existingSourcesData } = await supabase
        .from("sources")
        .select("id, url")
        .eq("user_id", user.id);

      const existingSources = (existingSourcesData ?? []) as Array<{
        id: string;
        url: string;
      }>;

      const existingById = new Map(
        existingSources.map((s) => [s.id, s.url])
      );
      const existingByUrl = new Map(
        existingSources.map((s) => [s.url, s.id])
      );

      const toInsert: Array<{
        user_id: string;
        url: string;
        keywords: string[];
        viewpoint: string;
        status: "pending";
      }> = [];
      const toUpdate: Array<{
        id: string;
        url: string;
        keywords: string[];
        viewpoint: string;
      }> = [];
      const toDelete: string[] = [];

      for (const src of validSources) {
        const kw = src.keywords;
        const keywords =
          Array.isArray(kw) ? kw.filter(Boolean)
          : typeof kw === "string" ? kw.split(",").map((s) => s.trim()).filter(Boolean)
          : [];
        const viewpoint = typeof src.viewpoint === "string" ? src.viewpoint : "";

        if (src.id && existingById.has(src.id)) {
          toUpdate.push({
            id: src.id,
            url: src.url.trim(),
            keywords: keywords.length > 0 ? keywords : [],
            viewpoint,
          });
        } else if (existingByUrl.has(src.url.trim())) {
          const id = existingByUrl.get(src.url.trim())!;
          toUpdate.push({
            id,
            url: src.url.trim(),
            keywords: keywords.length > 0 ? keywords : [],
            viewpoint,
          });
        } else {
          toInsert.push({
            user_id: user.id,
            url: src.url.trim(),
            keywords: keywords.length > 0 ? keywords : [],
            viewpoint,
            status: "pending",
          });
        }
      }

      const keptIds = new Set(
        [...toUpdate.map((t) => t.id)].filter(Boolean)
      );
      for (const [id] of existingById) {
        if (!keptIds.has(id)) toDelete.push(id);
      }

      if (toDelete.length > 0) {
        await supabase.from("sources").delete().in("id", toDelete);
      }

      for (const row of toUpdate) {
        await supabase
          .from("sources")
          .update({
            url: row.url,
            keywords: row.keywords,
            viewpoint: row.viewpoint,
          } as never)
          .eq("id", row.id)
          .eq("user_id", user.id);
      }

      for (const row of toInsert) {
        await supabase.from("sources").insert(row as never);
      }

      return { sources: validSources };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-config"] });
    },
  });

  return {
    config: data?.config ?? null,
    sources: data?.sources ?? [],
    isLoading,
    error,
    save: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
  };
}
