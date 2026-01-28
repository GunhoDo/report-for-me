import {
  FileText,
  GitBranch,
  Layers,
  Shield,
  Star,
  Zap,
} from "lucide-react";
import { SectionHeader } from "./SectionHeader";

const FEATURES = [
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
] as const;

export function FeaturesSection() {
  return (
    <section
      id="features"
      className="border-t border-neutral-200 py-24 dark:border-neutral-800"
      aria-labelledby="features-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeader
          id="features-heading"
          title="Everything you need for deep research"
          description="Powerful features to help you understand any topic in minutes, not hours."
        />

        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description }, index) => (
            <article
              key={index}
              className="group rounded-xl border border-neutral-200 bg-white p-6 shadow-sm transition-colors hover:border-neutral-300 hover:bg-neutral-50/50 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-neutral-700 dark:hover:bg-neutral-900/50"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                <Icon className="h-6 w-6" aria-hidden />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                {title}
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400">
                {description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
