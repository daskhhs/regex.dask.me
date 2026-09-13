"use client";

import { useMemo, type ReactNode } from "react";
import { compileRegex, findMatches } from "@/lib/regex-validator";
import type { MatchSpan } from "@/types/regex";

interface MatchResultsProps {
  pattern: string;
  flags: string;
  testText: string;
}

function highlightSegments(text: string, matches: MatchSpan[]) {
  if (!text) return null;
  if (!matches.length) {
    return <span className="text-[var(--muted)]">{text}</span>;
  }

  const nodes: ReactNode[] = [];
  let cursor = 0;

  for (let i = 0; i < matches.length; i += 1) {
    const m = matches[i];
    if (m.start > cursor) {
      nodes.push(
        <span key={`g-${cursor}`} className="text-[var(--muted)]">
          {text.slice(cursor, m.start)}
        </span>,
      );
    }
    nodes.push(
      <mark
        key={`m-${m.start}-${i}`}
        className="rounded-sm bg-[var(--accent-soft)] px-0.5 text-[var(--text)]"
      >
        {text.slice(m.start, m.end) || "∅"}
      </mark>,
    );
    cursor = m.end;
  }

  if (cursor < text.length) {
    nodes.push(
      <span key={`g-${cursor}-end`} className="text-[var(--muted)]">
        {text.slice(cursor)}
      </span>,
    );
  }

  return nodes;
}

export function MatchResults({ pattern, flags, testText }: MatchResultsProps) {
  const result = useMemo(() => {
    const compiled = compileRegex(pattern, flags);
    if (!compiled.ok || !compiled.regex) {
      return {
        ok: false as const,
        error: compiled.error ?? "Invalid regex",
        matches: [] as MatchSpan[],
        lines: [] as { line: string; matched: boolean; spans: MatchSpan[] }[],
      };
    }

    const lines = testText.split("\n");
    const lineResults = lines.map((line) => {
      const found = findMatches(compiled.regex!, line);
      return {
        line,
        matched: found.matches.length > 0,
        spans: found.matches,
      };
    });

    const all = findMatches(compiled.regex, testText);
    return {
      ok: true as const,
      error: undefined as string | undefined,
      matches: all.matches,
      lines: lineResults,
    };
  }, [pattern, flags, testText]);

  if (!testText.trim()) {
    return (
      <section className="rounded-md border border-dashed border-[var(--border)] px-3 py-4 text-sm text-[var(--muted)]">
        Add test text above to see matches and non-matches.
      </section>
    );
  }

  if (!result.ok) {
    return (
      <section className="rounded-md border border-[var(--danger-border)] bg-[var(--danger-bg)] px-3 py-3 text-sm text-[var(--danger)]">
        Cannot test: {result.error}
      </section>
    );
  }

  const matchLines = result.lines.filter((l) => l.matched).length;
  const missLines = result.lines.length - matchLines;

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--muted)]">
        <span>
          <span className="text-[var(--accent)]">{result.matches.length}</span>{" "}
          match{result.matches.length === 1 ? "" : "es"}
        </span>
        <span aria-hidden>·</span>
        <span>
          <span className="text-[var(--text-soft)]">{matchLines}</span> matching
          line{matchLines === 1 ? "" : "s"}
        </span>
        <span aria-hidden>·</span>
        <span>
          <span className="text-[var(--muted)]">{missLines}</span> non-match
          line{missLines === 1 ? "" : "s"}
        </span>
      </div>

      <div className="overflow-hidden rounded-md border border-[var(--border)] bg-[var(--surface-raised)]">
        <pre className="overflow-x-auto whitespace-pre-wrap break-words px-3 py-3 font-mono text-sm leading-relaxed">
          {highlightSegments(testText, result.matches)}
        </pre>
      </div>

      {result.lines.length > 1 && (
        <ul className="space-y-1.5">
          {result.lines.map((row, idx) => (
            <li
              key={idx}
              className={`flex items-start gap-2 rounded border px-2.5 py-1.5 font-mono text-xs ${
                row.matched
                  ? "border-[var(--accent-soft)] bg-[var(--accent-tint)] text-[var(--text)]"
                  : "border-[var(--border)] text-[var(--muted)]"
              }`}
            >
              <span className="mt-0.5 shrink-0 text-[10px] uppercase tracking-wide">
                {row.matched ? "match" : "miss"}
              </span>
              <span className="break-all">
                {row.line || <em className="opacity-50">(empty line)</em>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
