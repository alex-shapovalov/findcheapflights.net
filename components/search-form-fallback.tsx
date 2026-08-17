export function SearchFormFallback() {
  return (
    <div
      className="rounded-3xl border border-line bg-panel/90 p-4 shadow-(--elev) sm:p-8"
      aria-hidden
    >
      <div className="mb-6 flex flex-wrap gap-2">
        <div className="h-9 w-56 rounded-full border border-line bg-panel-2" />
        <div className="h-9 w-40 rounded-full border border-line bg-panel-2" />
      </div>
      <div className="grid gap-5">
        <div className="h-14 rounded-xl border border-line bg-panel-2" />
        <div className="h-10 rounded-xl border border-line bg-panel-2" />
        <div className="h-14 rounded-xl border border-line bg-panel-2" />
        <div className="h-14 rounded-xl border border-line bg-panel-2" />
        <div className="mt-2 h-12 w-40 rounded-full bg-gold/80" />
      </div>
    </div>
  )
}
