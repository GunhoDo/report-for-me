"use client";

import { useEffect } from "react";
import { ErrorDisplay } from "@/components/common/error-display";

/**
 * Next.js App Router 루트 레이아웃 글로벌 에러 바운더리
 * 루트 레이아웃에서 발생하는 에러를 캐치합니다.
 * 이 컴포넌트는 루트 레이아웃을 대체하므로 <html>과 <body> 태그를 포함해야 합니다.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 심각한 에러 로깅
    console.error("Global layout error caught:", error);
  }, [error]);

  return (
    <html lang="ko">
      <body>
        <ErrorDisplay
          title="시스템 오류가 발생했습니다"
          message="애플리케이션에 심각한 문제가 발생했습니다. 페이지를 새로고침하거나 잠시 후 다시 시도해주세요."
          reset={reset}
          showHomeButton={true}
          showRetryButton={true}
        />
      </body>
    </html>
  );
}
