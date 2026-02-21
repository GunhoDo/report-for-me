import { getReportDetail } from "@/lib/data/reports";
import { notFound } from "next/navigation";
import { ReportDetailClient } from "./report-detail-client";

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const report = await getReportDetail(id);

  if (!report) {
    notFound();
  }

  return <ReportDetailClient report={report} />;
}
