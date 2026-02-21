"use client";

import Link from "next/link";
import { useReports } from "@/hooks/use-reports";
import { Skeleton } from "@/components/ui/skeleton";
import type { Tables } from "@/types/database";

interface HistoryListProps {
  initialReports: Tables<"reports">[];
}

export function HistoryList({ initialReports }: HistoryListProps) {
  const { data: reports = initialReports, isLoading } = useReports(50);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-12 text-center">
        <p className="text-sm text-muted-foreground">
          아직 생성된 리포트가 없습니다.
        </p>
        <Link
          href="/dashboard"
          className="mt-4 inline-block text-sm text-primary hover:underline"
        >
          대시보드로 이동
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {reports.map((report) => (
        <Link
          key={report.id}
          href={`/dashboard/reports/${report.id}`}
          className="block rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/50"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">
                리포트{" "}
                {new Date(report.created_at).toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              <p className="text-xs text-muted-foreground capitalize">
                {report.status}
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
