"use client";

interface RegexTesterProps {
  value: string;
  onChange: (value: string) => void;
}

export function RegexTester({ value, onChange }: RegexTesterProps) {
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-medium uppercase tracking-wide text-[var(--muted)]">
        Test it
      </h2>
      <p className="text-sm text-[var(--muted)]">
        Paste sample text. Matching is done by the JavaScript RegExp engine in
        your browser — not by the AI.
      </p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={6}
        placeholder={"hello@example.com\nhttps://example.com\nnot-a-match"}
        className="w-full resize-y rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 font-mono text-base sm:text-sm text-[var(--text)] placeholder:text-[var(--muted)] outline-none transition focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
      />
    </section>
  );
}
