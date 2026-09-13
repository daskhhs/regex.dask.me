import type { RegexProposal } from "@/types/regex";
import {
  AiProviderError,
  MissingApiKeyError,
  REGEX_SYSTEM_PROMPT,
  buildUserPrompt,
  extractJsonObject,
  normalizeProposal,
  type AiProvider,
} from "@/lib/ai/provider";

const OPENROUTER_MODEL =
  process.env.OPENROUTER_MODEL?.trim() || "openai/gpt-4o-mini";

export const openrouterProvider: AiProvider = {
  name: "openrouter",

  isConfigured() {
    return Boolean(process.env.OPENROUTER_API_KEY?.trim());
  },

  async generateRegex(description: string): Promise<RegexProposal> {
    const apiKey = process.env.OPENROUTER_API_KEY?.trim();
    if (!apiKey) {
      throw new MissingApiKeyError("openrouter", "OPENROUTER_API_KEY");
    }

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer":
          process.env.OPENROUTER_SITE_URL?.trim() || "https://regex.dask.me",
        "X-Title": process.env.OPENROUTER_APP_NAME?.trim() || "Human → Regex",
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: REGEX_SYSTEM_PROMPT },
          { role: "user", content: buildUserPrompt(description) },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new AiProviderError(
        `OpenRouter request failed (${res.status})${body ? `: ${body.slice(0, 240)}` : ""}`,
      );
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const text = json.choices?.[0]?.message?.content?.trim();
    if (!text) {
      throw new AiProviderError("OpenRouter returned an empty response.");
    }

    return normalizeProposal(extractJsonObject(text));
  },
};
