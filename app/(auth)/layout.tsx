export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // tmp-v0 화면이 자체적으로 full-screen 레이아웃을 구성하므로 감싸지 않음
  return children;
}
