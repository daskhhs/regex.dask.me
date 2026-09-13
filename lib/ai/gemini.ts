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

const GEMINI_MODEL =
  process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash";

export const geminiProvider: AiProvider = {
  name: "gemini",

  isConfigured() {
    return Boolean(process.env.GEMINI_API_KEY?.trim());
  },

  async generateRegex(description: string): Promise<RegexProposal> {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      throw new MissingApiKeyError("gemini", "GEMINI_API_KEY");
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: REGEX_SYSTEM_PROMPT }] },
        contents: [
          {
            role: "user",
            parts: [{ text: buildUserPrompt(description) }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new AiProviderError(
        `Gemini request failed (${res.status})${body ? `: ${body.slice(0, 240)}` : ""}`,
      );
    }

    const json = (await res.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
    };

    const text = json.candidates?.[0]?.content?.parts
      ?.map((p) => p.text ?? "")
      .join("")
      .trim();

    if (!text) {
      throw new AiProviderError("Gemini returned an empty response.");
    }

    return normalizeProposal(extractJsonObject(text));
  },
};
