/**
 * className 병합. shadcn 도입 시 clsx + tailwind-merge로 교체 권장.
 * @see docs/tech-stack.md
 */
export function cn(...inputs: (string | undefined | null | false)[]) {
  return inputs.filter(Boolean).join(" ");
}
