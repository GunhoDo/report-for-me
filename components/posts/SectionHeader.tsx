interface SectionHeaderProps {
  id: string;
  title: string;
  description: string;
  className?: string;
}

/**
 * 섹션 공통: 제목 + 설명. Features / How it Works / CTA에서 재사용.
 */
export function SectionHeader({
  id,
  title,
  description,
  className = "",
}: SectionHeaderProps) {
  return (
    <div className={`text-center ${className}`.trim()}>
      <h2
        id={id}
        className="text-3xl font-bold text-neutral-900 md:text-4xl dark:text-neutral-50"
      >
        {title}
      </h2>
      <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-400">
        {description}
      </p>
    </div>
  );
}
