"use client";

const EXAMPLES = [
  {
    label: "Nigerian phones",
    text: "Nigerian phone numbers starting with 080, 081, 090 or 091",
  },
  {
    label: "Emails",
    text: "standard email addresses",
  },
  {
    label: "ISO dates",
    text: "dates in YYYY-MM-DD format",
  },
  {
    label: "Hex colors",
    text: "hex color codes like #fff or #1a2b3c",
  },
];

interface RegexInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

export function RegexInput({
  value,
  onChange,
  onSubmit,
  disabled,
}: RegexInputProps) {
  return (
    <section className="space-y-4">
      <label className="block space-y-2">
        <span className="font-[family-name:var(--font-display)] text-lg text-[var(--text)]">
          I want to match…
        </span>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          rows={3}
          placeholder="Describe the pattern in plain language"
          className="w-full resize-y rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-[var(--text)] placeholder:text-[var(--muted)] outline-none transition focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] disabled:opacity-60"
        />
      </label>

      <div className="flex flex-wrap gap-2">
        {EXAMPLES.map((ex) => (
          <button
            key={ex.label}
            type="button"
            disabled={disabled}
            onClick={() => onChange(ex.text)}
            className="rounded border border-[var(--border)] bg-transparent px-2.5 py-1 text-xs text-[var(--muted)] transition hover:border-[var(--accent-soft)] hover:text-[var(--text)] disabled:opacity-50"
          >
            {ex.label}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={onSubmit}
        disabled={disabled || !value.trim()}
        className="inline-flex h-11 items-center justify-center rounded-md bg-[var(--accent)] px-5 text-sm font-medium text-[var(--accent-fg)] transition hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        Build my regex
      </button>
    </section>
  );
}
