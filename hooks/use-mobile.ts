"use client";

import * as React from "react";

const MOBILE_BREAKPOINT = 768;

/**
 * useIsMobile Hook
 * 
 * 현재 화면 크기가 모바일인지 확인하는 훅입니다.
 * 768px 미만을 모바일로 간주합니다.
 * 
 * @returns {boolean} 모바일 화면이면 true, 아니면 false
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(
    undefined
  );

  React.useEffect(() => {
    const mql = window.matchMedia(
      `(max-width: ${MOBILE_BREAKPOINT - 1}px)`
    );
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}
