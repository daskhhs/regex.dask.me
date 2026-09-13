import type { ExplanationPart } from "@/types/regex";

interface RegexExplanationProps {
  parts: ExplanationPart[];
}

export function RegexExplanation({ parts }: RegexExplanationProps) {
  if (!parts.length) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium uppercase tracking-wide text-[var(--muted)]">
        What each part means
      </h2>
      <ul className="flex flex-col gap-2">
        {parts.map((item, index) => (
          <li
            key={`${item.part}-${index}`}
            className="grid grid-cols-[minmax(4rem,auto)_1fr] gap-3 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5"
          >
            <code className="break-all font-mono text-sm text-[var(--accent)]">
              {item.part}
            </code>
            <span className="text-sm leading-snug text-[var(--text-soft)]">
              {item.meaning}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
