import type { ExplanationPart, RegexProposal } from "@/types/regex";

export type AiProviderName = "gemini" | "groq" | "openrouter";

export interface AiProvider {
  name: AiProviderName;
  isConfigured: () => boolean;
  generateRegex: (description: string) => Promise<RegexProposal>;
}

export class MissingApiKeyError extends Error {
  readonly code = "MISSING_API_KEY" as const;

  constructor(provider: AiProviderName, envVar: string) {
    super(
      `${provider} is selected but ${envVar} is not set. Add the key to your environment to generate regexes.`,
    );
    this.name = "MissingApiKeyError";
  }
}

export class AiProviderError extends Error {
  readonly code = "AI_ERROR" as const;

  constructor(message: string) {
    super(message);
    this.name = "AiProviderError";
  }
}

export const REGEX_SYSTEM_PROMPT = `You are a precise regular-expression expert.
Given a plain-language description of what to match, propose a JavaScript RegExp pattern.

Rules:
- Return ONLY valid JSON with this shape:
  {"pattern":"...","flags":"g","explanation":[{"part":"...","meaning":"..."}]}
- "pattern" must be a valid JavaScript RegExp source (no surrounding slashes).
- "flags" should be a string of JS flags (prefer including "g"; add "i"/"m"/"u" only when needed).
- "explanation" breaks the pattern into meaningful chunks with plain-English meanings.
- Prefer practical, readable patterns. Do not over-engineer.
- Do not wrap the JSON in markdown fences.`;

export function buildUserPrompt(description: string): string {
  return `Description of what to match:\n${description.trim()}`;
}

export function extractJsonObject(raw: string): unknown {
  const trimmed = raw.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const fence = /```(?:json)?\s*([\s\S]*?)```/i.exec(trimmed);
    if (fence?.[1]) {
      return JSON.parse(fence[1].trim());
    }
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw new AiProviderError("Model response was not valid JSON.");
  }
}

export function normalizeProposal(data: unknown): RegexProposal {
  if (!data || typeof data !== "object") {
    throw new AiProviderError("Model returned an unexpected payload.");
  }

  const obj = data as Record<string, unknown>;
  const pattern = typeof obj.pattern === "string" ? obj.pattern.trim() : "";
  if (!pattern) {
    throw new AiProviderError("Model did not return a pattern.");
  }

  const flags =
    typeof obj.flags === "string" && obj.flags.trim()
      ? obj.flags.trim()
      : "g";

  let explanation: ExplanationPart[] = [];
  if (Array.isArray(obj.explanation)) {
    explanation = obj.explanation
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const row = item as Record<string, unknown>;
        const part = typeof row.part === "string" ? row.part : "";
        const meaning = typeof row.meaning === "string" ? row.meaning : "";
        if (!part || !meaning) return null;
        return { part, meaning };
      })
      .filter((x): x is ExplanationPart => x !== null);
  }

  return { pattern, flags, explanation };
}
