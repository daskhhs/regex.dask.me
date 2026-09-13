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

const GROQ_MODEL =
  process.env.GROQ_MODEL?.trim() || "llama-3.3-70b-versatile";

export const groqProvider: AiProvider = {
  name: "groq",

  isConfigured() {
    return Boolean(process.env.GROQ_API_KEY?.trim());
  },

  async generateRegex(description: string): Promise<RegexProposal> {
    const apiKey = process.env.GROQ_API_KEY?.trim();
    if (!apiKey) {
      throw new MissingApiKeyError("groq", "GROQ_API_KEY");
    }

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
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
        `Groq request failed (${res.status})${body ? `: ${body.slice(0, 240)}` : ""}`,
      );
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const text = json.choices?.[0]?.message?.content?.trim();
    if (!text) {
      throw new AiProviderError("Groq returned an empty response.");
    }

    return normalizeProposal(extractJsonObject(text));
  },
};
