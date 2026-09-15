import { AiProviderError, type ChatMessage } from "./provider";

// openrouter/free is OpenRouter's Free Models Router — it randomly selects
// a free model from whatever's available and is filtered for the features
// the request needs (e.g. structured JSON output). It's the right default
// for a last-resort fallback provider. Override with OPENROUTER_MODEL if
// you'd rather pin a specific (possibly paid) model.
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "openrouter/free";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export async function callOpenRouter(
  messages: ChatMessage[],
  apiKey: string
): Promise<string> {
  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "https://regex.dask.me",
      "X-Title": "Human to Regex",
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new AiProviderError(
      `OpenRouter request failed (${res.status}). ${body.slice(0, 240)}`
    );
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) {
    throw new AiProviderError("OpenRouter returned an empty response.");
  }

  return text;
}
