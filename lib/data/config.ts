/**
 * 사용자 설정 데이터 페칭 (서버).
 */
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/supabase/auth";
import type { Tables } from "@/types/database";

export interface UserConfigWithSources {
  config: Tables<"user_configs">;
  sources: Tables<"sources">[];
}

export async function getUserConfig(): Promise<UserConfigWithSources | null> {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: config, error: configError } = await supabase
    .from("user_configs")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (configError || !config) return null;

  const { data: sources, error: sourcesError } = await supabase
    .from("sources")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (sourcesError) return { config, sources: [] };

  return { config, sources: sources ?? [] };
}
