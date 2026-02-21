"use client";

import Link from "next/link";
import { ReportView } from "@/components/domain/report/report-view";
import { ReportProgress } from "@/components/domain/report/report-progress";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import type { ReportDetail } from "@/lib/data/reports";

const IN_PROGRESS_STATUSES = [
  "pending",
  "collecting",
  "analyzing",
  "synthesizing",
] as const;

interface ReportDetailClientProps {
  report: ReportDetail;
}

export function ReportDetailClient({ report }: ReportDetailClientProps) {
  const isInProgress = IN_PROGRESS_STATUSES.includes(
    report.status as (typeof IN_PROGRESS_STATUSES)[number]
  );

  return (
    <div className="space-y-6 p-4 lg:p-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            리포트 상세
          </h1>
          <p className="text-sm text-muted-foreground">
            {new Date(report.created_at).toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>

      {isInProgress && <ReportProgress reportId={report.id} />}

      <ReportView initialReport={report} />
    </div>
  );
}
