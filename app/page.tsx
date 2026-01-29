import { getAuthUser } from "@/lib/supabase/auth";
import { redirect } from "next/navigation";
import { HomeClient } from "./home-client";

/**
 * 랜딩 페이지
 * 이미 로그인한 사용자는 대시보드로 자동 리다이렉트됩니다.
 */
export default async function Home() {
  const user = await getAuthUser();

  // 이미 로그인한 사용자는 대시보드로 리다이렉트
  if (user) {
    redirect("/dashboard");
  }

  // 미인증 사용자에게 랜딩 페이지 표시
  return <HomeClient />;
}
