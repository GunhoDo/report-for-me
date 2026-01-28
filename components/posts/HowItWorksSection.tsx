import { SectionHeader } from "./SectionHeader";

const STEPS = [
  {
    step: "01",
    title: "Configure Sources",
    description:
      "Add up to 3 URLs with keywords and viewpoints for analysis.",
  },
  {
    step: "02",
    title: "Generate Insights",
    description: "Our AI reads and analyzes each source independently.",
  },
  {
    step: "03",
    title: "Synthesize",
    description:
      "Get an integrated perspective combining all viewpoints.",
  },
] as const;

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="border-t border-neutral-200 py-24 dark:border-neutral-800"
      aria-labelledby="how-it-works-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeader
          id="how-it-works-heading"
          title="How it works"
          description="Three simple steps to comprehensive research."
        />

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {STEPS.map(({ step, title, description }, index) => (
            <article key={index} className="relative">
              <div
                className="mb-4 text-6xl font-bold text-neutral-200 dark:text-neutral-700"
                aria-hidden
              >
                {step}
              </div>
              <h3 className="mb-2 text-xl font-semibold text-neutral-900 dark:text-neutral-50">
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
