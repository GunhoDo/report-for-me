import { ErrorDisplay } from "@/components/common/error-display";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "페이지를 찾을 수 없습니다",
  description: "요청하신 페이지를 찾을 수 없습니다.",
};

/**
 * Next.js App Router 404 Not Found 페이지
 * 존재하지 않는 경로로 접근할 때 표시됩니다.
 */
export default function NotFound() {
  return (
    <ErrorDisplay
      title="페이지를 찾을 수 없습니다"
      message="요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다. URL을 확인해주세요."
      showHomeButton={true}
      showRetryButton={false}
    />
  );
}
