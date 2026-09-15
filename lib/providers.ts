import type { ExplanationPart, RegexProposal } from "@/types/regex";
import {
  AiProviderError,
  MissingApiKeyError,
  callAiWithFallback,
  type AiProviderName,
  type ChatMessage,
} from "@/lib/ai/provider";

export { MissingApiKeyError, AiProviderError } from "@/lib/ai/provider";

export function describeMissingKeys(): string {
  return "This tool isn't fully set up yet — please check back soon.";
}

const REGEX_SYSTEM_PROMPT = `You are a precise regular-expression expert.
Given a plain-language description of what to match, propose a JavaScript RegExp pattern.

Rules:
- Return ONLY valid JSON with this shape:
  {"pattern":"...","flags":"g","explanation":[{"part":"...","meaning":"..."}]}
- "pattern" must be a valid JavaScript RegExp source (no surrounding slashes).
- "flags" should be a string of JS flags (prefer including "g"; add "i"/"m"/"u" only when needed).
- "explanation" breaks the pattern into meaningful chunks with plain-English meanings.
- Prefer practical, readable patterns. Do not over-engineer.
- Do not wrap the JSON in markdown fences.`;

function buildUserPrompt(description: string): string {
  return `Description of what to match:\n${description.trim()}`;
}

function extractJsonObject(raw: string): unknown {
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

function normalizeProposal(data: unknown): RegexProposal {
  if (!data || typeof data !== "object") {
    throw new AiProviderError("Model returned an unexpected payload.");
  }

  const obj = data as Record<string, unknown>;
  const pattern = typeof obj.pattern === "string" ? obj.pattern.trim() : "";
  if (!pattern) {
    throw new AiProviderError("Model did not return a pattern.");
  }

  const flags =
    typeof obj.flags === "string" && obj.flags.trim() ? obj.flags.trim() : "g";

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

export async function generateRegex(
  description: string
): Promise<{ proposal: RegexProposal; provider: AiProviderName }> {
  const messages: ChatMessage[] = [
    { role: "system", content: REGEX_SYSTEM_PROMPT },
    { role: "user", content: buildUserPrompt(description) },
  ];

  try {
    const { text, provider } = await callAiWithFallback(messages);
    const proposal = normalizeProposal(extractJsonObject(text));
    return { proposal, provider };
  } catch (err) {
    if (err instanceof MissingApiKeyError || err instanceof AiProviderError) {
      throw err;
    }
    const message = err instanceof Error ? err.message : "Something went sideways generating a regex.";
    throw new AiProviderError(message);
  }
}
