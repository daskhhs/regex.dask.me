import type { CompileResult, MatchSpan, MatchTestResult } from "@/types/regex";

const ALLOWED_FLAGS = new Set(["g", "i", "m", "s", "u", "y", "d", "v"]);

/** Normalize and filter flags to a safe unique set. */
export function sanitizeFlags(flags: string | undefined | null): string {
  if (!flags) return "g";
  const unique: string[] = [];
  for (const ch of flags) {
    if (ALLOWED_FLAGS.has(ch) && !unique.includes(ch)) {
      unique.push(ch);
    }
  }
  if (!unique.includes("g")) unique.push("g");
  return unique.join("");
}

/**
 * Safely compile a RegExp. Never throws to the caller.
 */
export function compileRegex(
  pattern: string,
  flags?: string | null,
): CompileResult {
  if (!pattern || !pattern.trim()) {
    return { ok: false, regex: null, error: "Pattern is empty." };
  }

  const safeFlags = sanitizeFlags(flags);

  try {
    const regex = new RegExp(pattern, safeFlags);
    return { ok: true, regex };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Invalid regular expression.";
    return { ok: false, regex: null, error: message };
  }
}

/**
 * Find all matches in `text` using a compiled RegExp.
 * Protects against runaway lastIndex / zero-width loops.
 */
export function findMatches(regex: RegExp, text: string): MatchTestResult {
  if (!text) {
    return { ok: true, matches: [], matchCount: 0 };
  }

  const matches: MatchSpan[] = [];
  const maxMatches = 500;

  try {
    const flags = regex.flags.includes("g")
      ? regex.flags
      : `${regex.flags}g`;
    const re = new RegExp(regex.source, flags);
    let match: RegExpExecArray | null;
    let guard = 0;

    while ((match = re.exec(text)) !== null) {
      guard += 1;
      if (guard > maxMatches) break;

      const start = match.index;
      const end = start + match[0].length;
      matches.push({ start, end, text: match[0] });

      // Zero-width match: advance to avoid infinite loop
      if (match[0].length === 0) {
        re.lastIndex = match.index + 1;
        if (re.lastIndex > text.length) break;
      }
    }

    return { ok: true, matches, matchCount: matches.length };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to run match.";
    return { ok: false, error: message, matches: [], matchCount: 0 };
  }
}

/**
 * Test whether the whole string matches (using sticky/full semantics via ^/$ if present,
 * otherwise `.test` with a non-global clone).
 */
export function testMatch(
  pattern: string,
  flags: string | undefined,
  sample: string,
): { ok: boolean; matched: boolean; error?: string } {
  const compiled = compileRegex(pattern, flags);
  if (!compiled.ok || !compiled.regex) {
    return { ok: false, matched: false, error: compiled.error };
  }

  try {
    const nonGlobal = new RegExp(
      compiled.regex.source,
      compiled.regex.flags.replace(/g/g, ""),
    );
    return { ok: true, matched: nonGlobal.test(sample) };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to test match.";
    return { ok: false, matched: false, error: message };
  }
}

export function isValidRegex(pattern: string, flags?: string): boolean {
  return compileRegex(pattern, flags).ok;
}
