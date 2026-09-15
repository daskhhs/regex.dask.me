# Human → Regex

**Describe what you want to match, in plain English. Get a working, tested regex back.**

Part of the [dask.me](https://dask.me) tool collection.

---

## What it does

Regex is one of those things almost every developer can *read* faster than they can *write*. This tool flips that: describe the pattern you want in a sentence — "dates in YYYY-MM-DD format," "URLs starting with https" — and it hands back a regular expression, a plain-English breakdown of what each part does, and a live tester so you can throw real examples at it and watch what matches.

## How it works

The one rule this tool never breaks: **the AI proposes, your browser's regex engine decides.**

1. **Describe** — you write what you want to match in natural language.
2. **Propose** — the description is sent to an LLM (Gemini, Groq, or OpenRouter, whichever is configured) with instructions to return a pattern and an explanation, structured as JSON.
3. **Validate** — the proposed pattern is compiled with JavaScript's native `RegExp` engine before it's ever shown to you. If it doesn't compile, you get a clear error instead of a broken pattern.
4. **Explain** — the pattern is broken into its component parts (groups, character classes, anchors, quantifiers) and each one gets a plain-English label.
5. **Test** — paste in real examples and see exactly which lines match, highlighted inline, computed live in the browser with the validated pattern. No AI involved in this step — it's just `String.match()`.

That separation matters: language models are good at *proposing* patterns and bad at reliably knowing whether one actually works. The JavaScript engine is the only source of truth for whether a regex is valid and what it matches.

## Tech stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- A small provider abstraction (`lib/ai/`) supporting Gemini, Groq, and OpenRouter interchangeably

## Running locally

```bash
npm install
cp .env.example .env.local
# add at least one API key to .env.local
npm run dev
```

Environment variables (see `.env.example`):

| Variable | Required | Notes |
|---|---|---|
| `AI_PROVIDER` | No | `gemini` \| `groq` \| `openrouter` — which provider to prefer. Defaults to `gemini`. |
| `GEMINI_API_KEY` | One of these three | |
| `GROQ_API_KEY` | | |
| `OPENROUTER_API_KEY` | | |

Only one key is required — the tool falls back to whichever provider has a key configured.

## Design notes

Dark, terminal-adjacent theme (Fraunces for the wordmark, DM Sans for UI text, IBM Plex Mono for patterns and code) — it's meant to feel like a tool built *for* developers, not a form pretending to be one.
