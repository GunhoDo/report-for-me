"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/types/database";

export function useReports(limit = 20) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["reports", limit],
    queryFn: async (): Promise<Tables<"reports">[]> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) return [];
      return data ?? [];
    },
    staleTime: 30 * 1000,
  });
}
