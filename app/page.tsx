"use client";

import { useCallback, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { BuildStatus } from "@/components/BuildStatus";
import { MatchResults } from "@/components/MatchResults";
import { RegexExplanation } from "@/components/RegexExplanation";
import { RegexInput } from "@/components/RegexInput";
import { RegexOutput } from "@/components/RegexOutput";
import { RegexTester } from "@/components/RegexTester";
import type {
  ExplanationPart,
  GenerateResponse,
} from "@/types/regex";

type UiStatus = "idle" | "loading" | "error" | "result";

export default function Home() {
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<UiStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [pattern, setPattern] = useState<string | null>(null);
  const [flags, setFlags] = useState("g");
  const [explanation, setExplanation] = useState<ExplanationPart[]>([]);
  const [testText, setTestText] = useState("");

  const clearResult = useCallback(() => {
    setPattern(null);
    setFlags("g");
    setExplanation([]);
    setError(null);
    setStatus("idle");
  }, []);

  const handleBuild = useCallback(async () => {
    const trimmed = description.trim();
    if (!trimmed) {
      setError("Describe what you want to match.");
      setStatus("error");
      setPattern(null);
      return;
    }

    setStatus("loading");
    setError(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: trimmed }),
      });

      const data = (await res.json()) as GenerateResponse;

      if (!data.ok) {
        setPattern(null);
        setExplanation([]);
        setError(data.error);
        setStatus("error");
        return;
      }

      setPattern(data.pattern);
      setFlags(data.flags || "g");
      setExplanation(data.explanation ?? []);
      setError(null);
      setStatus("result");
      if (!testText.trim()) {
        setTestText(
          "https://example.com\nhttp://not-secure.test\nhello@example.com\n2024-01-15\n#1a2b3c",
        );
      }
    } catch {
      setPattern(null);
      setExplanation([]);
      setError("Network error — could not reach the generate API.");
      setStatus("error");
    }
  }, [description, testText]);

  return (
    <div className="flex min-h-full flex-1 flex-col bg-[var(--bg)] text-[var(--text)]">
      <AppHeader />

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-5 py-10">
        <div className="space-y-2">
          <p className="max-w-xl text-[var(--text-soft)]">
            Tell it what you want to match and let it build the regex for you.
          </p>
        </div>

        <RegexInput
          value={description}
          onChange={(v) => {
            setDescription(v);
            if (status === "error") {
              setStatus("idle");
              setError(null);
            }
          }}
          onSubmit={handleBuild}
          disabled={status === "loading"}
        />

        <BuildStatus
          status={
            status === "loading"
              ? "loading"
              : status === "error"
                ? "error"
                : status === "idle" && !pattern
                  ? "empty"
                  : "idle"
          }
          message={error ?? undefined}
        />

        {status === "result" && pattern && (
          <div className="animate-fade-in-up space-y-8 border-t border-[var(--border)] pt-8">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-[family-name:var(--font-display)] text-lg text-[var(--text)]">
                Result
              </h2>
              <button
                type="button"
                onClick={clearResult}
                className="text-xs text-[var(--muted)] underline-offset-2 hover:text-[var(--text)] hover:underline"
              >
                Clear
              </button>
            </div>

            <RegexOutput pattern={pattern} flags={flags} />
            <RegexExplanation parts={explanation} />
            <RegexTester value={testText} onChange={setTestText} />
            <MatchResults
              pattern={pattern}
              flags={flags}
              testText={testText}
            />
          </div>
        )}
      </main>

      <footer className="border-t border-[var(--border)] py-4 text-center text-xs text-[var(--muted)]">
        AI proposes · JavaScript RegExp validates
      </footer>
    </div>
  );
}
