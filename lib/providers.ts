import type { AiProvider, AiProviderName } from "@/lib/ai/provider";
import { geminiProvider } from "@/lib/ai/gemini";
import { groqProvider } from "@/lib/ai/groq";
import { openrouterProvider } from "@/lib/ai/openrouter";

const PROVIDERS: Record<AiProviderName, AiProvider> = {
  gemini: geminiProvider,
  groq: groqProvider,
  openrouter: openrouterProvider,
};

/**
 * Resolve the active AI provider.
 * Default: Gemini. Override with AI_PROVIDER=gemini|groq|openrouter.
 */
export function getAiProvider(): AiProvider {
  const raw = (process.env.AI_PROVIDER ?? "gemini").trim().toLowerCase();
  const name = (
    raw === "groq" || raw === "openrouter" || raw === "gemini" ? raw : "gemini"
  ) as AiProviderName;
  return PROVIDERS[name];
}

export function getConfiguredProvider(): AiProvider | null {
  const preferred = getAiProvider();
  if (preferred.isConfigured()) return preferred;

  // Fall through to any configured provider so local setup is forgiving
  for (const provider of Object.values(PROVIDERS)) {
    if (provider.isConfigured()) return provider;
  }
  return null;
}

export function describeMissingKeys(): string {
  const preferred = getAiProvider();
  const envMap: Record<AiProviderName, string> = {
    gemini: "GEMINI_API_KEY",
    groq: "GROQ_API_KEY",
    openrouter: "OPENROUTER_API_KEY",
  };
  return `No AI API key configured. Set ${envMap[preferred.name]} (default provider: ${preferred.name}), or switch with AI_PROVIDER=gemini|groq|openrouter.`;
}
