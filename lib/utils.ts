import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * tmp-v0 (shadcn) 호환: `@/lib/utils`에서 `cn`을 import 하는 컴포넌트 지원.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

