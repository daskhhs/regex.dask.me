export function AppHeader() {
  return (
    <header className="animate-fade-in-up border-b border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-3xl items-center gap-2.5 px-5 py-4">
        <img
          src="/icon.png"
          alt=""
          className="h-6 w-6 rounded-md shadow-sm transition-transform duration-300 hover:rotate-6"
        />
        <span className="font-[family-name:var(--font-display)] text-xl tracking-tight text-[var(--text)]">
          Human → Regex
        </span>
        <span className="hidden text-xs text-[var(--muted)] sm:inline">
          · dask.me
        </span>
      </div>
    </header>
  );
}
