import { createClient } from "@/lib/supabase/route-handler";
import { NextResponse } from "next/server";

/**
 * OAuth 콜백 핸들러
 * Google OAuth 인증 후 리다이렉트된 코드를 세션으로 교환합니다.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  // 인증 성공 후 대시보드로 리다이렉트
  return NextResponse.redirect(new URL("/dashboard", requestUrl.origin));
}
