import { createClient } from "./server";
import { redirect } from "next/navigation";

/**
 * 서버 컴포넌트에서 인증된 사용자 확인
 * 미인증 시 로그인 페이지로 리다이렉트
 */
export async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  return user;
}

/**
 * 서버 컴포넌트에서 사용자 정보 가져오기 (리다이렉트 없음)
 * 선택적 인증 확인에 사용
 */
export async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    return null;
  }

  return user;
}
