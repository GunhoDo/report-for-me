import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionHeader } from "./SectionHeader";

export function CtaSection() {
  return (
    <section
      id="pricing"
      className="border-t border-neutral-200 py-24 dark:border-neutral-800"
      aria-labelledby="cta-heading"
    >
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <SectionHeader
          id="cta-heading"
          title="Ready to streamline your research?"
          description="Join thousands of researchers, analysts, and curious minds using Report-For-Me."
        />
        <div className="mt-8 flex justify-center">
          <Link
            href="/signup"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-neutral-900 px-6 text-base font-medium text-white transition-colors hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            Start for Free
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
