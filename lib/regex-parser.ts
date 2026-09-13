import type { ExplanationPart } from "@/types/regex";

const TOKEN_MEANINGS: Record<string, string> = {
  "^": "Start of the string (or line, with m flag)",
  $: "End of the string (or line, with m flag)",
  ".": "Any character except newline (unless s flag)",
  "\\d": "A digit (0–9)",
  "\\D": "A non-digit",
  "\\w": "A word character (letter, digit, or underscore)",
  "\\W": "A non-word character",
  "\\s": "A whitespace character",
  "\\S": "A non-whitespace character",
  "\\b": "A word boundary",
  "\\B": "A non-word boundary",
  "\\n": "A newline",
  "\\t": "A tab",
  "\\r": "A carriage return",
  "*": "Zero or more of the preceding token",
  "+": "One or more of the preceding token",
  "?": "Optional — zero or one of the preceding token",
  "|": "Alternation — match either side",
  "(": "Start of a capturing group",
  ")": "End of a capturing group",
  "[": "Start of a character class",
  "]": "End of a character class",
  "{": "Start of a quantifier",
  "}": "End of a quantifier",
};

function meaningForEscaped(ch: string): string {
  const key = `\\${ch}`;
  if (TOKEN_MEANINGS[key]) return TOKEN_MEANINGS[key];
  if (ch === "\\" || ch === "/" || ".+*?^$()[]{}|".includes(ch)) {
    return `Literal “${ch}”`;
  }
  return `Escaped “${ch}”`;
}

function meaningForCharClass(content: string): string {
  if (content.startsWith("^")) {
    return `Any character except: ${content.slice(1) || "(empty)"}`;
  }
  if (content === "0-9") return "A digit from 0 to 9";
  if (content === "a-z") return "A lowercase letter a–z";
  if (content === "A-Z") return "An uppercase letter A–Z";
  if (content === "a-zA-Z") return "A letter a–z or A–Z";
  if (content === "a-zA-Z0-9") return "A letter or digit";
  return `One of: ${content}`;
}

function meaningForQuantifier(q: string): string {
  if (q === "*") return TOKEN_MEANINGS["*"];
  if (q === "+") return TOKEN_MEANINGS["+"];
  if (q === "?") return TOKEN_MEANINGS["?"];
  const m = /^\{(\d+)(?:,(\d*)?)?\}$/.exec(q);
  if (!m) return `Quantifier ${q}`;
  const min = m[1];
  if (m[2] === undefined) return `Exactly ${min} of the preceding token`;
  if (m[2] === "") return `${min} or more of the preceding token`;
  return `Between ${min} and ${m[2]} of the preceding token`;
}

/**
 * Break a regex pattern into explained chunks locally when possible.
 * Falls back to a single opaque chunk for unparsed leftovers.
 */
export function parseRegexExplanation(pattern: string): ExplanationPart[] {
  if (!pattern) return [];

  const parts: ExplanationPart[] = [];
  let i = 0;

  while (i < pattern.length) {
    const ch = pattern[i];

    // Escapes
    if (ch === "\\" && i + 1 < pattern.length) {
      const next = pattern[i + 1];
      parts.push({ part: `\\${next}`, meaning: meaningForEscaped(next) });
      i += 2;
      continue;
    }

    // Character class
    if (ch === "[") {
      let j = i + 1;
      let content = "";
      while (j < pattern.length) {
        if (pattern[j] === "\\" && j + 1 < pattern.length) {
          content += pattern[j] + pattern[j + 1];
          j += 2;
          continue;
        }
        if (pattern[j] === "]") break;
        content += pattern[j];
        j += 1;
      }
      if (j < pattern.length && pattern[j] === "]") {
        const full = pattern.slice(i, j + 1);
        parts.push({ part: full, meaning: meaningForCharClass(content) });
        i = j + 1;
        continue;
      }
      parts.push({ part: ch, meaning: TOKEN_MEANINGS["["] });
      i += 1;
      continue;
    }

    // Quantifier {n}, {n,}, {n,m}
    if (ch === "{") {
      const rest = pattern.slice(i);
      const m = /^\{(\d+)(?:,(\d*)?)?\}/.exec(rest);
      if (m) {
        parts.push({ part: m[0], meaning: meaningForQuantifier(m[0]) });
        i += m[0].length;
        continue;
      }
      parts.push({ part: ch, meaning: TOKEN_MEANINGS["{"] });
      i += 1;
      continue;
    }

    // Groups / lookarounds (simple)
    if (ch === "(") {
      if (pattern.startsWith("(?:", i)) {
        parts.push({ part: "(?:", meaning: "Start of a non-capturing group" });
        i += 3;
        continue;
      }
      if (pattern.startsWith("(?=", i)) {
        parts.push({ part: "(?=", meaning: "Positive lookahead" });
        i += 3;
        continue;
      }
      if (pattern.startsWith("(?!", i)) {
        parts.push({ part: "(?!", meaning: "Negative lookahead" });
        i += 3;
        continue;
      }
      if (pattern.startsWith("(?<=", i)) {
        parts.push({ part: "(?<=", meaning: "Positive lookbehind" });
        i += 4;
        continue;
      }
      if (pattern.startsWith("(?<!", i)) {
        parts.push({ part: "(?<!", meaning: "Negative lookbehind" });
        i += 4;
        continue;
      }
      parts.push({ part: "(", meaning: TOKEN_MEANINGS["("] });
      i += 1;
      continue;
    }

    if (TOKEN_MEANINGS[ch]) {
      parts.push({ part: ch, meaning: TOKEN_MEANINGS[ch] });
      i += 1;
      continue;
    }

    // Literal run
    let literal = ch;
    i += 1;
    while (i < pattern.length) {
      const c = pattern[i];
      if (
        c === "\\" ||
        c === "[" ||
        c === "{" ||
        c === "(" ||
        TOKEN_MEANINGS[c]
      ) {
        break;
      }
      literal += c;
      i += 1;
    }
    parts.push({
      part: literal,
      meaning:
        literal.length === 1
          ? `Literal “${literal}”`
          : `Literal text “${literal}”`,
    });
  }

  return parts;
}

/**
 * Prefer AI explanation when present and non-empty; otherwise parse locally.
 */
export function resolveExplanation(
  pattern: string,
  aiParts?: ExplanationPart[] | null,
): ExplanationPart[] {
  if (aiParts && aiParts.length > 0) {
    return aiParts.filter((p) => p.part && p.meaning);
  }
  return parseRegexExplanation(pattern);
}
