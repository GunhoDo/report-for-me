import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // TypeScript 빌드 에러 무시 (개발 중에만 사용 권장)
  // 프로덕션 빌드 전에는 제거하는 것을 권장합니다.
  // typescript: {
  //   ignoreBuildErrors: true,
  // },
  
  // 이미지 최적화 비활성화 (정적 호스팅 등 특수한 경우에만 사용)
  // Next.js의 기본 이미지 최적화를 사용하는 것을 권장합니다.
  // images: {
  //   unoptimized: true,
  // },
};

export default nextConfig;
