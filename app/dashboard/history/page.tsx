import { getReportsList } from "@/lib/data/reports";
import { HistoryList } from "./history-list";

export default async function HistoryPage() {
  const reports = await getReportsList(50);

  return (
    <div className="space-y-6 p-4 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">리포트 히스토리</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          생성된 리포트 목록입니다.
        </p>
      </div>
      <HistoryList initialReports={reports} />
    </div>
  );
}
