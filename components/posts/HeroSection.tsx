import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-24 pb-20 md:pt-32">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-1/4 h-96 w-96 rounded-full bg-neutral-200/50 blur-3xl dark:bg-neutral-800/30" />
        <div className="absolute bottom-20 right-1/4 h-96 w-96 rounded-full bg-neutral-300/30 blur-3xl dark:bg-neutral-700/20" />
        <div
          className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)`,
            backgroundSize: "64px 64px",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col items-center text-center">
          {/* Badge — ui 재사용: Badge 스타일 (outline/secondary) */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-100 px-4 py-1.5 dark:border-neutral-700 dark:bg-neutral-800/50">
            <Star className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
            <span className="text-sm text-neutral-600 dark:text-neutral-400">
              Now in Public Beta
            </span>
          </div>

          <h1 className="max-w-4xl text-balance text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl xl:text-7xl text-neutral-900 dark:text-neutral-50">
            The AI Agent for Your{" "}
            <span className="text-neutral-600 dark:text-neutral-300">
              Information Diet
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg text-neutral-600 md:text-xl dark:text-neutral-400">
            Stop drowning in tabs. Report-For-Me reads, analyzes, and synthesizes
            information from multiple sources to deliver concise, actionable
            insights.
          </p>

          {/* CTA — common Header와 동일 로직: /login, /signup */}
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
            <Link
              href="/signup"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-neutral-900 px-6 text-base font-medium text-white transition-colors hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/#how-it-works"
              className="inline-flex h-11 items-center justify-center rounded-md border border-neutral-200 bg-transparent px-6 text-base font-medium transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
            >
              Watch Demo
            </Link>
          </div>

          {/* Terminal Visual */}
          <div className="mt-16 w-full max-w-4xl">
            <div className="relative -rotate-1 rounded-xl border border-neutral-200 bg-white p-1 shadow-lg transition-transform hover:rotate-0 dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex items-center gap-2 border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
                <span className="h-3 w-3 rounded-full bg-red-500/80" />
                <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
                <span className="h-3 w-3 rounded-full bg-green-500/80" />
                <span className="ml-4 text-sm text-neutral-500 dark:text-neutral-400">
                  rfm-agent
                </span>
              </div>
              <div className="space-y-3 p-6 font-mono text-sm text-neutral-700 dark:text-neutral-300">
                <div className="flex items-start gap-2">
                  <span className="text-neutral-500 dark:text-neutral-400">$</span>
                  <span>
                    rfm analyze --sources 3 --topic &quot;AI Trends 2025&quot;
                  </span>
                </div>
                <div className="space-y-1 pl-4 text-neutral-600 dark:text-neutral-400">
                  <p>
                    <span className="text-neutral-500">[1/3]</span> Reading
                    techcrunch.com/ai-predictions...
                  </p>
                  <p>
                    <span className="text-neutral-500">[2/3]</span> Analyzing
                    arxiv.org/latest-papers...
                  </p>
                  <p>
                    <span className="text-neutral-500">[3/3]</span> Synthesizing
                    insights from verge.com...
                  </p>
                </div>
                <div className="mt-4 rounded-lg border border-neutral-300 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800/50">
                  <p className="text-neutral-700 dark:text-neutral-300">
                    ✓ Analysis Complete
                  </p>
                  <p className="mt-2 text-neutral-600 dark:text-neutral-400">
                    Generated comprehensive report with 3 perspectives and
                    integrated synthesis.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
