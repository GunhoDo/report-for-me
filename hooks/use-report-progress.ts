"use client";

// TODO: "수집 중 → 분석 중 → 도출 중" 상태 폴링 – PRD F4

export function useReportProgress(reportId: string | null) {
  return { stage: "idle" as const, message: "" };
}
