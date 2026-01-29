import { requireAuth } from "@/lib/supabase/auth";

/**
 * Dashboard Layout
 * 
 * 대시보드 영역의 공통 레이아웃을 정의합니다.
 * 미인증 사용자는 자동으로 로그인 페이지로 리다이렉트됩니다.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 미인증 시 자동으로 /login으로 리다이렉트
  await requireAuth();

  return <>{children}</>;
}
