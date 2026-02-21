"use client";

import { useReportProgress } from "@/hooks/use-report-progress";
import { Progress } from "@/components/ui/progress";

export function ReportProgress({ reportId }: { reportId: string | null }) {
  const { stage, message, isLoading } = useReportProgress(reportId);

  const progressValue: Record<string, number> = {
    idle: 0,
    collecting: 25,
    analyzing: 50,
    synthesizing: 75,
    completed: 100,
    partial: 100,
    failed: 0,
  };

  const value = progressValue[stage] ?? 0;

  if (isLoading || stage === "idle") {
    return null;
  }

  return (
    <div className="space-y-2 rounded-lg border border-border bg-card p-4">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{message}</span>
        {stage !== "failed" && <span className="text-muted-foreground">{value}%</span>}
      </div>
      <Progress value={value} />
    </div>
  );
}
