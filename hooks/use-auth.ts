"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

/**
 * 인증 상태를 관리하는 커스텀 훅
 * 로그인/로그아웃 상태를 실시간으로 추적합니다.
 */
export function useAuth() {
  const router = useRouter();
  // 클라이언트 인스턴스를 메모이제이션하여 무한 루프 방지
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 초기 사용자 상태 확인
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setIsLoading(false);
    });

    // 인증 상태 변경 감지
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      // subscription이 존재할 때만 unsubscribe
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [supabase]);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return { user, isLoading, signOut };
}

