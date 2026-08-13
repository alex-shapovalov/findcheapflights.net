'use client'

function linkify(text: string) {
  const parts = text.split(/((?:https?:\/\/|www\.)[^\s)]+)/g)
  return parts.map((part, index) => {
    if (/^(https?:\/\/|www\.)/.test(part)) {
      const href = part.startsWith('http') ? part : `https://${part}`
      return (
        <a
          key={`${part}-${index}`}
          href={href}
          target="_blank"
          rel="noreferrer"
          className="text-gold underline decoration-gold/40 underline-offset-2"
        >
          {part}
        </a>
      )
    }
    return <span key={`${part}-${index}`}>{part}</span>
  })
}

export function SearchReport({
  text,
  running,
}: {
  text: string
  running?: boolean
}) {
  return (
    <section className="rounded-3xl border border-line bg-ink/70 p-5 sm:p-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-display text-2xl">Fare report</h2>
        {running && (
          <span className="text-xs uppercase tracking-[0.2em] text-teal">
            Searching live sources
          </span>
        )}
      </div>
      <pre className="whitespace-pre-wrap font-sans text-sm leading-7 text-foam/90">
        {text
          ? linkify(text)
          : 'Querying public fare calendars, airline pages, and event dates...'}
      </pre>
    </section>
  )
}
