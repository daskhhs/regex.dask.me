export type AiProviderName = "gemini" | "groq" | "openrouter";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export class MissingApiKeyError extends Error {
  constructor() {
    super("No AI API key is configured.");
    this.name = "MissingApiKeyError";
  }
}

export class AiProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiProviderError";
  }
}

const PROVIDER_ENV: Record<AiProviderName, string> = {
  gemini: "GEMINI_API_KEY",
  groq: "GROQ_API_KEY",
  openrouter: "OPENROUTER_API_KEY",
};

// Fallback cascade: every configured Gemini key is tried first (in order),
// then every Groq key, then every OpenRouter key. Each env var may hold a
// single key or a comma-separated list of keys — this is what lets one
// account running out of quota fall through to the next automatically,
// and one provider being down fall through to the next provider.
const CASCADE_ORDER: AiProviderName[] = ["gemini", "groq", "openrouter"];

function parseKeys(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
}

function keysFor(provider: AiProviderName): string[] {
  return parseKeys(process.env[PROVIDER_ENV[provider]]);
}

export function getAvailableProviders(): AiProviderName[] {
  return CASCADE_ORDER.filter((p) => keysFor(p).length > 0);
}

async function callOne(
  provider: AiProviderName,
  key: string,
  messages: ChatMessage[]
): Promise<string> {
  switch (provider) {
    case "gemini":
      return (await import("./gemini")).callGemini(messages, key);
    case "groq":
      return (await import("./groq")).callGroq(messages, key);
    case "openrouter":
      return (await import("./openrouter")).callOpenRouter(messages, key);
  }
}

/**
 * Tries every configured key across every provider, in a fixed cascade:
 * all Gemini keys, then all Groq keys, then all OpenRouter keys. Returns
 * as soon as one succeeds. If every single configured key fails, throws
 * an AiProviderError describing every attempt; if nothing is configured
 * at all, throws MissingApiKeyError before making any network call.
 */
export async function callAiWithFallback(
  messages: ChatMessage[]
): Promise<{ text: string; provider: AiProviderName }> {
  const providers = getAvailableProviders();
  if (providers.length === 0) {
    throw new MissingApiKeyError();
  }

  const failures: string[] = [];

  for (const provider of CASCADE_ORDER) {
    const keys = keysFor(provider);
    for (let i = 0; i < keys.length; i++) {
      try {
        const text = await callOne(provider, keys[i], messages);
        return { text, provider };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        failures.push(`${provider}#${i + 1}: ${msg}`);
        console.error(`AI fallback: ${provider} key #${i + 1} failed, trying next`, err);
      }
    }
  }

  throw new AiProviderError(`All configured AI providers failed. ${failures.join(" | ")}`);
}
