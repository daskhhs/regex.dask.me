import { NextResponse } from "next/server";
import {
  AiProviderError,
  MissingApiKeyError,
} from "@/lib/ai/provider";
import { resolveExplanation } from "@/lib/regex-parser";
import { compileRegex, sanitizeFlags } from "@/lib/regex-validator";
import {
  describeMissingKeys,
  getConfiguredProvider,
  getAiProvider,
} from "@/lib/providers";
import type { GenerateResponse } from "@/types/regex";

export const runtime = "nodejs";

const MAX_DESCRIPTION = 2000;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    const payload: GenerateResponse = {
      ok: false,
      error: "Request body must be JSON.",
      code: "INVALID_INPUT",
    };
    return NextResponse.json(payload, { status: 400 });
  }

  const description =
    body &&
    typeof body === "object" &&
    "description" in body &&
    typeof (body as { description: unknown }).description === "string"
      ? (body as { description: string }).description.trim()
      : "";

  if (!description) {
    const payload: GenerateResponse = {
      ok: false,
      error: "Describe what you want to match.",
      code: "INVALID_INPUT",
    };
    return NextResponse.json(payload, { status: 400 });
  }

  if (description.length > MAX_DESCRIPTION) {
    const payload: GenerateResponse = {
      ok: false,
      error: `Description is too long (max ${MAX_DESCRIPTION} characters).`,
      code: "INVALID_INPUT",
    };
    return NextResponse.json(payload, { status: 400 });
  }

  const provider = getConfiguredProvider();
  if (!provider) {
    const preferred = getAiProvider();
    const payload: GenerateResponse = {
      ok: false,
      error: describeMissingKeys(),
      code: "MISSING_API_KEY",
    };
    console.warn(
      `[generate] missing API key for preferred provider: ${preferred.name}`,
    );
    return NextResponse.json(payload, { status: 503 });
  }

  try {
    const proposal = await provider.generateRegex(description);
    const flags = sanitizeFlags(proposal.flags);
    const compiled = compileRegex(proposal.pattern, flags);

    if (!compiled.ok) {
      const payload: GenerateResponse = {
        ok: false,
        error: `AI proposed an invalid regex: ${compiled.error ?? "unknown error"}`,
        code: "INVALID_REGEX",
      };
      return NextResponse.json(payload, { status: 422 });
    }

    const explanation = resolveExplanation(
      proposal.pattern,
      proposal.explanation,
    );

    const payload: GenerateResponse = {
      ok: true,
      source: "ai",
      validated: true,
      pattern: proposal.pattern,
      flags,
      explanation,
    };
    return NextResponse.json(payload);
  } catch (err) {
    if (err instanceof MissingApiKeyError) {
      const payload: GenerateResponse = {
        ok: false,
        error: err.message,
        code: "MISSING_API_KEY",
      };
      return NextResponse.json(payload, { status: 503 });
    }

    const message =
      err instanceof AiProviderError
        ? err.message
        : err instanceof Error
          ? err.message
          : "Failed to generate regex.";

    const payload: GenerateResponse = {
      ok: false,
      error: message,
      code: "AI_ERROR",
    };
    return NextResponse.json(payload, { status: 502 });
  }
}
