"use client";

import { useEffect } from "react";
import { ErrorDisplay } from "@/components/common/error-display";

/**
 * Next.js App Router 전역 에러 바운더리
 * 모든 클라이언트 컴포넌트에서 발생하는 에러를 캐치합니다.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 에러 로깅 (프로덕션에서는 에러 리포팅 서비스로 전송)
    console.error("Global error caught:", error);
  }, [error]);

  // 사용자 친화적인 에러 메시지 생성
  const getErrorMessage = (error: Error): string => {
    // 네트워크 에러
    if (error.message.includes("fetch") || error.message.includes("network")) {
      return "네트워크 연결에 문제가 있습니다. 인터넷 연결을 확인해주세요.";
    }

    // 타임아웃 에러
    if (error.message.includes("timeout")) {
      return "요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.";
    }

    // 인증 에러
    if (error.message.includes("auth") || error.message.includes("unauthorized")) {
      return "인증에 실패했습니다. 다시 로그인해주세요.";
    }

    // 권한 에러
    if (error.message.includes("permission") || error.message.includes("403")) {
      return "접근 권한이 없습니다.";
    }

    // 일반적인 에러
    return error.message || "예기치 못한 문제가 발생했습니다. 잠시 후 다시 시도해주세요.";
  };

  return (
    <ErrorDisplay
      title="오류가 발생했습니다"
      message={getErrorMessage(error)}
      reset={reset}
      showHomeButton={true}
      showRetryButton={true}
    />
  );
}
