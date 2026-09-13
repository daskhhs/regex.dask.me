"use client";

import { useState } from "react";

interface RegexOutputProps {
  pattern: string;
  flags: string;
}

export function RegexOutput({ pattern, flags }: RegexOutputProps) {
  const [copied, setCopied] = useState(false);
  const display = `/${pattern}/${flags}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(display);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-[var(--muted)]">
          Regex
        </h2>
        <button
          type="button"
          onClick={handleCopy}
          className="rounded border border-[var(--border)] px-2.5 py-1 text-xs text-[var(--muted)] transition hover:border-[var(--accent-soft)] hover:text-[var(--text)]"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto rounded-md border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-3 font-mono text-sm leading-relaxed text-[var(--accent)]">
        {display}
      </pre>
    </section>
  );
}
