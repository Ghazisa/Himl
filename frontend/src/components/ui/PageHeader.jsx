/** Dark banner at the top of every signed-in page; owns the page's <h1>. */
export function PageHeader({ title, subtitle, icon: Icon, children }) {
  return (
    <header className="relative overflow-hidden bg-gray-950">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{ background: "radial-gradient(40rem 20rem at 85% -30%, #14573a 0%, transparent 65%)" }}
      />
      <div className="relative mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-4 px-4 py-8">
        <div className="flex items-start gap-3">
          {Icon && (
            <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
              <Icon aria-hidden="true" className="h-5 w-5 text-gold-400" />
            </span>
          )}
          <div>
            <h1 className="text-2xl font-bold text-white sm:text-3xl">{title}</h1>
            {subtitle && <p className="mt-2 max-w-2xl text-sm text-gray-200">{subtitle}</p>}
          </div>
        </div>
        {children}
      </div>
    </header>
  );
}
