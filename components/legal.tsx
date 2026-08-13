import type { ReactNode } from 'react'
import { LEGAL_UPDATED } from '@/lib/constants'

export function LegalPage({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string
  title: string
  intro: string
  children: ReactNode
}) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-16">
      <p className="text-xs uppercase tracking-[0.28em] text-gold">{eyebrow}</p>
      <h1 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
        {title}
      </h1>
      <p className="mt-4 text-sm text-mute">Last updated {LEGAL_UPDATED}</p>
      <p className="mt-6 text-mute">{intro}</p>
      <div className="mt-10 flex flex-col gap-8">{children}</div>
    </div>
  )
}

export function LegalSection({
  heading,
  children,
}: {
  heading: string
  children: ReactNode
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-display text-2xl tracking-tight">{heading}</h2>
      <div className="flex flex-col gap-3 text-mute [&_a]:text-gold [&_a:hover]:underline [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-foam">
        {children}
      </div>
    </section>
  )
}
