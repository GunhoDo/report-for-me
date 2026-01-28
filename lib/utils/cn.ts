import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * className 병합 (shadcn 표준).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
