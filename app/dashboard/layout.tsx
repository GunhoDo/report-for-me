/**
 * Dashboard Layout
 * 
 * 대시보드 영역의 공통 레이아웃을 정의합니다.
 * 현재는 AppDashboard 컴포넌트가 자체적으로 사이드바와 레이아웃을 포함하고 있으므로
 * 최소한의 래퍼만 제공합니다.
 * 
 * 향후 사이드바나 헤더를 레이아웃으로 분리할 경우 이 파일을 확장할 수 있습니다.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
