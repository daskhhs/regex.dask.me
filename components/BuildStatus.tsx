interface BuildStatusProps {
  status: "idle" | "loading" | "error" | "empty";
  message?: string;
}

export function BuildStatus({ status, message }: BuildStatusProps) {
  if (status === "idle") return null;

  if (status === "loading") {
    return (
      <div
        className="flex items-center gap-3 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-sm text-[var(--text-soft)]"
        role="status"
        aria-live="polite"
      >
        <span className="status-dot" aria-hidden />
        Building your regex…
      </div>
    );
  }

  if (status === "empty") {
    return (
      <div className="rounded-md border border-dashed border-[var(--border)] px-3 py-3 text-sm text-[var(--muted)]">
        {message ?? "Describe what you want to match, then build a regex."}
      </div>
    );
  }

  if (status === "error") {
    return (
      <div
        className="rounded-md border border-[var(--danger-border)] bg-[var(--danger-bg)] px-3 py-3 text-sm text-[var(--danger)]"
        role="alert"
      >
        {message ?? "Something went wrong."}
      </div>
    );
  }

  return null;
}
