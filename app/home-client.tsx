"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Zap,
  FileText,
  Layers,
  GitBranch,
  Star,
  Shield,
} from "lucide-react";

/**
 * 랜딩 페이지 클라이언트 컴포넌트
 * tmp-v0 `components/landing-page.tsx` 1:1 이식.
 */
export function HomeClient() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background dark">
      <div className="dark min-h-screen bg-background text-foreground">
        {/* Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <FileText className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold">RFM</span>
            </div>
            <div className="hidden items-center gap-8 md:flex">
              <a
                href="#features"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                How it Works
              </a>
              <a
                href="#pricing"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Pricing
              </a>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => router.push("/login")}
              >
                Sign In
              </Button>
              <Button
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => router.push("/login")}
              >
                Get Started
              </Button>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="relative overflow-hidden pt-32 pb-20">
          {/* Background Elements */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute top-20 left-1/4 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
            <div className="absolute bottom-20 right-1/4 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
            {/* Grid pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
          </div>

          <div className="relative mx-auto max-w-7xl px-6">
            <div className="flex flex-col items-center text-center">
              {/* Badge */}
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-1.5">
                <Star className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">
                  Now in Public Beta
                </span>
              </div>

              {/* Headline */}
              <h1 className="max-w-4xl text-balance text-5xl font-bold tracking-tight md:text-6xl lg:text-7xl">
                The AI Agent for Your{" "}
                <span className="text-primary">Information Diet</span>
              </h1>

              {/* Subheadline */}
              <p className="mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
                Stop drowning in tabs. RFM reads, analyzes, and synthesizes
                information from multiple sources to deliver concise, actionable
                insights.
              </p>

              {/* CTA Buttons */}
              <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
                <Button
                  size="lg"
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => router.push("/login")}
                >
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-border bg-transparent text-foreground hover:bg-secondary"
                >
                  Watch Demo
                </Button>
              </div>

              {/* Terminal Visual */}
              <div className="mt-16 w-full max-w-4xl">
                <div className="relative -rotate-1 transform rounded-xl border border-border bg-card p-1 shadow-2xl transition-transform hover:rotate-0">
                  {/* Window Controls */}
                  <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                    <div className="h-3 w-3 rounded-full bg-red-500/80" />
                    <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                    <div className="h-3 w-3 rounded-full bg-green-500/80" />
                    <span className="ml-4 text-sm text-muted-foreground">
                      rfm-agent
                    </span>
                  </div>
                  {/* Terminal Content */}
                  <div className="space-y-3 p-6 font-mono text-sm">
                    <div className="flex items-start gap-2">
                      <span className="text-primary">$</span>
                      <span className="text-foreground">
                        rfm analyze --sources 3 --topic &quot;AI Trends 2025&quot;
                      </span>
                    </div>
                    <div className="space-y-1 pl-4 text-muted-foreground">
                      <p>
                        <span className="text-primary">[1/3]</span> Reading
                        techcrunch.com/ai-predictions...
                      </p>
                      <p>
                        <span className="text-primary">[2/3]</span> Analyzing
                        arxiv.org/latest-papers...
                      </p>
                      <p>
                        <span className="text-primary">[3/3]</span> Synthesizing
                        insights from verge.com...
                      </p>
                    </div>
                    <div className="mt-4 rounded-lg border border-primary/30 bg-primary/10 p-4">
                      <p className="text-primary">{"✓"} Analysis Complete</p>
                      <p className="mt-2 text-foreground">
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

        {/* Features Section */}
        <section id="features" className="border-t border-border py-24">
          <div className="mx-auto max-w-7xl px-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold md:text-4xl">
                Everything you need for deep research
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Powerful features to help you understand any topic in minutes,
                not hours.
              </p>
            </div>

            <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: Layers,
                  title: "Multi-Source Analysis",
                  description:
                    "Configure up to 3 independent research modules, each targeting different URLs and viewpoints.",
                },
                {
                  icon: GitBranch,
                  title: "Integrated Synthesis",
                  description:
                    "Automatically combine insights from all sources into a unified, comprehensive perspective.",
                },
                {
                  icon: Zap,
                  title: "Instant Reports",
                  description:
                    "Get AI-generated summaries in seconds, not hours. Focus on what matters.",
                },
                {
                  icon: FileText,
                  title: "Custom Viewpoints",
                  description:
                    "Define specific angles for analysis - technical, business, consumer, or any perspective you need.",
                },
                {
                  icon: Shield,
                  title: "Source Verification",
                  description:
                    "Every insight is traceable back to its original source for full transparency.",
                },
                {
                  icon: Star,
                  title: "Save & Share",
                  description:
                    "Export your research reports or share them with your team instantly.",
                },
              ].map((feature, index) => (
                <div
                  key={index}
                  className="group rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/50 hover:bg-card/80"
                >
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section id="how-it-works" className="border-t border-border py-24">
          <div className="mx-auto max-w-7xl px-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold md:text-4xl">How it works</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Three simple steps to comprehensive research.
              </p>
            </div>

            <div className="mt-16 grid gap-8 md:grid-cols-3">
              {[
                {
                  step: "01",
                  title: "Configure Sources",
                  description:
                    "Add up to 3 URLs with keywords and viewpoints for analysis.",
                },
                {
                  step: "02",
                  title: "Generate Insights",
                  description:
                    "Our AI reads and analyzes each source independently.",
                },
                {
                  step: "03",
                  title: "Synthesize",
                  description:
                    "Get an integrated perspective combining all viewpoints.",
                },
              ].map((item, index) => (
                <div key={index} className="relative">
                  <div className="mb-4 text-6xl font-bold text-primary/20">
                    {item.step}
                  </div>
                  <h3 className="mb-2 text-xl font-semibold">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section id="pricing" className="border-t border-border py-24">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <h2 className="text-3xl font-bold md:text-4xl">
              Ready to streamline your research?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Join thousands of researchers, analysts, and curious minds using
              RFM.
            </p>
            <Button
              size="lg"
              className="mt-8 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => router.push("/login")}
            >
              Start for Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border py-12">
          <div className="mx-auto max-w-7xl px-6">
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <FileText className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-semibold">RFM</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Report for Me. Your AI research assistant.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
