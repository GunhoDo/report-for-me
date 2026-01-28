import Link from "next/link";
import { FileText } from "lucide-react";

const LOGO_TEXT = "Report-For-Me";

/**
 * GNB 메뉴 — PRD §3 User Flow, §4 Key Features 반영:
 * - Features: 설정·리포트·다중소스 등 핵심 기능 (F1~F4)
 * - How it Works: Phase 1~3 (설정 → 실행 → 배달)
 * - Pricing: 가입/요금 안내
 */
const NAV_ITEMS = [
  { href: "/#features", label: "Features" },
  { href: "/#how-it-works", label: "How it Works" },
  { href: "/#pricing", label: "Pricing" },
] as const;

export function Header() {
  return (
    <header className="sticky top-0 left-0 right-0 z-50 border-b border-neutral-200 bg-white/80 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-950/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 text-neutral-900 dark:text-neutral-50"
          aria-label={`${LOGO_TEXT} 홈`}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900 dark:bg-neutral-100">
            <FileText className="h-4 w-4 text-white dark:text-neutral-900" />
          </div>
          <span className="text-lg font-semibold">{LOGO_TEXT}</span>
        </Link>

        {/* Nav — PRD 기능/흐름 대응 */}
        <nav
          className="hidden items-center gap-8 md:flex"
          aria-label="메인 메뉴"
        >
          {NAV_ITEMS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-sm text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50"
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Actions — PRD Phase 1 Onboarding/Settings 진입 경로 */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="inline-flex h-9 items-center justify-center rounded-md bg-neutral-900 px-4 text-sm font-medium text-white transition-colors hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}
