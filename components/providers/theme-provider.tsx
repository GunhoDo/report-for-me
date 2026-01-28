"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * Theme Provider Props
 * 
 * next-themes 0.3.0에서는 ThemeProviderProps 타입이 export되지 않으므로
 * 직접 정의합니다.
 */
type ThemeProviderProps = {
  children: React.ReactNode;
  attribute?: string;
  defaultTheme?: string;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
  [key: string]: unknown;
};

/**
 * Theme Provider
 * 
 * next-themes를 사용한 다크모드 지원을 위한 Provider 컴포넌트.
 * app/layout.tsx에서 사용하여 전체 앱에 테마 기능을 제공합니다.
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
