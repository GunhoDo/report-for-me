"use client";

// TODO: Supabase Auth 상태, 리다이렉트 헬퍼

export function useAuth() {
  return { user: null, signOut: async () => {} };
}
