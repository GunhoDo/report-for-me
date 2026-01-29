"use client";

import { useEffect } from "react";
import { ErrorDisplay } from "@/components/common/error-display";

/**
 * Dashboard 레벨 에러 바운더리
 * 대시보드 영역에서 발생하는 에러를 캐치합니다.
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error caught:", error);
  }, [error]);

  const getErrorMessage = (error: Error): string => {
    if (error.message.includes("auth") || error.message.includes("unauthorized")) {
      return "대시보드에 접근할 권한이 없습니다. 다시 로그인해주세요.";
    }

    if (error.message.includes("fetch") || error.message.includes("network")) {
      return "데이터를 불러오는 중 문제가 발생했습니다. 네트워크 연결을 확인해주세요.";
    }

    return error.message || "대시보드에서 문제가 발생했습니다. 잠시 후 다시 시도해주세요.";
  };

  return (
    <ErrorDisplay
      title="대시보드 오류"
      message={getErrorMessage(error)}
      reset={reset}
      showHomeButton={true}
      showRetryButton={true}
    />
  );
}
