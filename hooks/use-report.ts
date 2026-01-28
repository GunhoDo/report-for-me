"use client";

// TODO: TanStack Query 기반 리포트 조회/폴링/캐시

export function useReport(id: string | null) {
  return { data: null, isLoading: false, error: null };
}
