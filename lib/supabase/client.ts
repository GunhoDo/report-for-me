import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

/**
 * 브라우저용 Supabase 클라이언트.
 * 클라이언트 컴포넌트에서만 사용 가능 ("use client").
 * 쿠키를 자동으로 관리합니다.
 */
export function createClient() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    throw new Error(
      "Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
