import { AiProviderError, type ChatMessage } from "./provider";

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

export async function callGemini(messages: ChatMessage[], apiKey: string): Promise<string> {
  const system = messages
    .filter((m) => m.role === "system")
    .map((m) => m.content)
    .join("\n\n");
  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: system
        ? { parts: [{ text: system }] }
        : undefined,
      contents,
      generationConfig: {
        temperature: 0.3,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new AiProviderError(
      `Gemini request failed (${res.status}). ${sanitizeUpstream(body)}`
    );
  }

  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  const text = data.candidates?.[0]?.content?.parts
    ?.map((p) => p.text || "")
    .join("")
    .trim();

  if (!text) {
    throw new AiProviderError("Gemini returned an empty response.");
  }

  return text;
}

function sanitizeUpstream(body: string): string {
  return body.replace(/key=[^&\s"']+/gi, "key=REDACTED").slice(0, 240);
}
