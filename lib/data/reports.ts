/**
 * 리포트 데이터 페칭 (서버).
 */
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/supabase/auth";
import type { ReportsRow, ReportSectionsRow, Tables } from "@/types/database";

export interface ReportDetail extends ReportsRow {
  sections: ReportSectionsRow[];
}

export async function getReportsList(
  limit = 20
): Promise<Tables<"reports">[]> {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Reports fetch error:", error);
    return [];
  }

  return data ?? [];
}

export async function getReportDetail(
  reportId: string
): Promise<ReportDetail | null> {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: report, error: reportError } = await supabase
    .from("reports")
    .select("*")
    .eq("id", reportId)
    .eq("user_id", user.id)
    .single();

  if (reportError || !report) return null;

  const { data: sections } = await supabase
    .from("report_sections")
    .select("*")
    .eq("report_id", reportId)
    .order("sort_order", { ascending: true });

  const reportRow = report as unknown as Tables<"reports">;
  return {
    ...reportRow,
    sections: sections ?? [],
  };
}
