/**
 * 브라우저용 Supabase 클라이언트.
 * 설치: pnpm add @supabase/supabase-js @supabase/ssr
 * 구현: createBrowserClient(URL, ANON_KEY) from "@supabase/ssr"
 * @see docs/tech-stack.md
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
  // TODO: import { createBrowserClient } from "@supabase/ssr"; 후 구현
  return {} as unknown;
}
