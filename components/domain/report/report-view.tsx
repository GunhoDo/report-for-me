"use client";

import { useReport } from "@/hooks/use-report";
import {
  parseExecutiveSummary,
  parseActionItem,
} from "@/lib/utils/report";
import type { ReportDetail } from "@/lib/data/reports";

interface ReportViewProps {
  initialReport: ReportDetail;
}

export function ReportView({ initialReport }: ReportViewProps) {
  const { data: report = initialReport, isLoading } = useReport(
    initialReport.id
  );

  if (isLoading || !report) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 rounded bg-muted" />
        <div className="h-32 rounded bg-muted" />
        <div className="h-24 rounded bg-muted" />
      </div>
    );
  }

  const summary = parseExecutiveSummary(report.executive_summary);
  const actionItem = parseActionItem(report.action_item);

  return (
    <div className="space-y-8">
      {summary && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            Executive Summary
          </h2>
          <ul className="list-inside list-disc space-y-2 text-sm text-muted-foreground">
            {summary.bullets.map((bullet, i) => (
              <li key={i}>{bullet}</li>
            ))}
          </ul>
        </section>
      )}

      {report.sections && report.sections.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            소스별 분석
          </h2>
          <div className="space-y-6">
            {report.sections.map((section) => (
              <div
                key={section.id}
                className="rounded-lg border border-border bg-card p-4"
              >
                <p className="mb-2 text-xs text-muted-foreground">
                  {section.url}
                </p>
                <p className="whitespace-pre-wrap text-sm text-foreground">
                  {section.content}
                </p>
                {section.status === "failed" && section.error_message && (
                  <p className="mt-2 text-sm text-destructive">
                    {section.error_message}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {actionItem && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            Action Item
          </h2>
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <p className="text-sm text-foreground">{actionItem.text}</p>
            {actionItem.perspective && (
              <p className="mt-2 text-xs text-muted-foreground">
                {actionItem.perspective}
              </p>
            )}
          </div>
        </section>
      )}

      {!summary && !actionItem && report.sections?.length === 0 && (
        <p className="text-sm text-muted-foreground">
          리포트가 아직 생성 중이거나 데이터가 없습니다.
        </p>
      )}
    </div>
  );
}
