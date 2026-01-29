"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Home, RefreshCw } from "lucide-react";

interface ErrorDisplayProps {
  title?: string;
  message?: string;
  reset?: () => void;
  showHomeButton?: boolean;
  showRetryButton?: boolean;
}

/**
 * 재사용 가능한 에러 표시 컴포넌트
 * 모든 오류 상황에서 일관된 UI를 제공합니다.
 */
export function ErrorDisplay({
  title = "오류가 발생했습니다",
  message = "예기치 못한 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
  reset,
  showHomeButton = true,
  showRetryButton = true,
}: ErrorDisplayProps) {
  const router = useRouter();

  const handleGoHome = () => {
    router.push("/");
  };

  const handleRetry = () => {
    if (reset) {
      reset();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription className="mt-2 text-base">
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {showRetryButton && (
            <Button onClick={handleRetry} variant="default" className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              다시 시도
            </Button>
          )}
          {showHomeButton && (
            <Button
              onClick={handleGoHome}
              variant="outline"
              className="w-full"
            >
              <Home className="mr-2 h-4 w-4" />
              메인 화면으로 돌아가기
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
