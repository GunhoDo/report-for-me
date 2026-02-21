"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { ReportStatusEnum } from "@/types/database";

export type ProgressStage =
  | "idle"
  | "collecting"
  | "analyzing"
  | "synthesizing"
  | "completed"
  | "partial"
  | "failed";

const STATUS_TO_STAGE: Record<ReportStatusEnum, ProgressStage> = {
  pending: "idle",
  collecting: "collecting",
  analyzing: "analyzing",
  synthesizing: "synthesizing",
  completed: "completed",
  partial: "completed",
  failed: "failed",
};

const STAGE_MESSAGES: Record<ProgressStage, string> = {
  idle: "대기 중",
  collecting: "소스 데이터 수집 중...",
  analyzing: "개별 기사 분석 중...",
  synthesizing: "최종 인사이트 도출 중...",
  completed: "완료",
  partial: "일부 소스 실패 (완료)",
  failed: "실패",
};

export function useReportProgress(reportId: string | null) {
  const supabase = createClient();

  const { data, isLoading } = useQuery({
    queryKey: ["report-progress", reportId],
    queryFn: async (): Promise<{ stage: ProgressStage; message: string }> => {
      if (!reportId) return { stage: "idle", message: "" };

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return { stage: "idle", message: "" };

      const { data: reportData } = await supabase
        .from("reports")
        .select("status")
        .eq("id", reportId)
        .eq("user_id", user.id)
        .single();

      const report = reportData as { status: ReportStatusEnum } | null;
      if (!report) return { stage: "idle", message: "" };

      const stage = STATUS_TO_STAGE[report.status];
      return {
        stage,
        message: STAGE_MESSAGES[stage],
      };
    },
    enabled: !!reportId,
    refetchInterval: (query) => {
      const d = query.state.data;
      if (d?.stage === "completed" || d?.stage === "failed") return false;
      return 2000;
    },
  });

  return {
    stage: data?.stage ?? "idle",
    message: data?.message ?? "",
    isLoading,
  };
}
