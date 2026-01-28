import { cookies } from "next/headers";

/**
 * 서버용 Supabase 클라이언트 (Server Components, Route Handlers).
 * 설치: pnpm add @supabase/supabase-js @supabase/ssr
 * 구현: createServerClient(URL, ANON_KEY, { cookies }) from "@supabase/ssr"
 * @see docs/tech-stack.md
 */
export async function createClient() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    throw new Error(
      "Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }
  const cookieStore = await cookies();
  // TODO: import { createServerClient } from "@supabase/ssr"; 후 cookie 옵션으로 구현
  void cookieStore;
  return {} as unknown;
}
