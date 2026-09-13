export type RegexFlags = string;

export interface ExplanationPart {
  part: string;
  meaning: string;
}

export interface RegexProposal {
  pattern: string;
  flags: RegexFlags;
  explanation: ExplanationPart[];
}

export interface GenerateRequest {
  description: string;
}

export interface GenerateSuccessResponse extends RegexProposal {
  ok: true;
  source: "ai";
  validated: boolean;
}

export interface GenerateErrorResponse {
  ok: false;
  error: string;
  code?: "MISSING_API_KEY" | "INVALID_INPUT" | "AI_ERROR" | "INVALID_REGEX";
}

export type GenerateResponse = GenerateSuccessResponse | GenerateErrorResponse;

export type BuildStatus =
  | "idle"
  | "loading"
  | "error"
  | "result"
  | "empty";

export interface MatchSpan {
  start: number;
  end: number;
  text: string;
}

export interface MatchTestResult {
  ok: boolean;
  error?: string;
  matches: MatchSpan[];
  matchCount: number;
}

export interface CompileResult {
  ok: boolean;
  regex: RegExp | null;
  error?: string;
}
