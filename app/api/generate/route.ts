import { NextResponse } from "next/server";
import { resolveExplanation } from "@/lib/regex-parser";
import { compileRegex, sanitizeFlags } from "@/lib/regex-validator";
import { MissingApiKeyError, generateRegex } from "@/lib/providers";
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

  try {
    const { proposal } = await generateRegex(description);
    const flags = sanitizeFlags(proposal.flags);
    const compiled = compileRegex(proposal.pattern, flags);

    if (!compiled.ok) {
      const payload: GenerateResponse = {
        ok: false,
        error: "That description didn't produce a valid pattern. Try rephrasing it.",
        code: "INVALID_REGEX",
      };
      console.error(`[generate] AI proposed an invalid regex: ${compiled.error ?? "unknown error"}`);
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
      console.error("Regex builder: missing API key", err);
      const payload: GenerateResponse = {
        ok: false,
        error: "This tool isn't fully set up yet — please check back soon.",
        code: "MISSING_API_KEY",
      };
      return NextResponse.json(payload, { status: 503 });
    }

    console.error("Regex builder: upstream error", err);
    const payload: GenerateResponse = {
      ok: false,
      error: "Couldn't build a regex from that description. Please try again in a moment.",
      code: "AI_ERROR",
    };
    return NextResponse.json(payload, { status: 502 });
  }
}
