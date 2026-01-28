import Link from "next/link";
import { FileText } from "lucide-react";

const LOGO_TEXT = "Report-For-Me";

/**
 * PRD §1.3 Value Proposition 반영:
 * "설정은 1분, 리포트는 매일 아침. 나만의 관점으로 분석된 3줄의 결론."
 */
const TAGLINE = "설정은 1분, 리포트는 매일 아침. 나만의 관점으로 분석된 3줄의 결론.";

export function Footer() {
  return (
    <footer className="border-t border-neutral-200 py-12 dark:border-neutral-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <Link
            href="/"
            className="flex items-center gap-2 text-neutral-900 dark:text-neutral-50"
            aria-label={`${LOGO_TEXT} 홈`}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900 dark:bg-neutral-100">
              <FileText className="h-4 w-4 text-white dark:text-neutral-900" />
            </div>
            <span className="font-semibold">{LOGO_TEXT}</span>
          </Link>
          <p className="text-center text-sm text-neutral-500 dark:text-neutral-400 md:text-left">
            {TAGLINE}
          </p>
        </div>
      </div>
    </footer>
  );
}
