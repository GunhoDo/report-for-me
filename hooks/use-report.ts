"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { ReportSectionsRow, Tables } from "@/types/database";

export interface ReportDetail extends Tables<"reports"> {
  sections: ReportSectionsRow[];
}

export function useReport(id: string | null) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["report", id],
    queryFn: async (): Promise<ReportDetail | null> => {
      if (!id) return null;

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      type ReportResponse = { data: Tables<"reports"> | null; error: unknown };
      type SectionsResponse = { data: ReportSectionsRow[] | null };

      const reportRes = (await supabase
        .from("reports")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single()) as ReportResponse;

      const sectionsRes = (await supabase
        .from("report_sections")
        .select("*")
        .eq("report_id", id)
        .order("sort_order", { ascending: true })) as SectionsResponse;

      if (reportRes.error || !reportRes.data) return null;

      const reportData = reportRes.data;
      const sectionsData = sectionsRes.data ?? [];

      return {
        ...reportData,
        sections: sectionsData,
      };
    },
    enabled: !!id,
    staleTime: 60 * 1000,
  });
}
