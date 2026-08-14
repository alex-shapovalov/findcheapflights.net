import Link from 'next/link'
import { notFound } from 'next/navigation'
import { JsonLd } from '@/components/json-ld'
import { StoryEntryBlock } from '@/components/story-entry'
import { notFoundMetadata, pageMetadata, storyEntryJsonLd } from '@/lib/seo'
import { getStoryEntries, getStoryEntry } from '@/lib/story'

export function generateStaticParams() {
  return getStoryEntries().map(entry => ({ slug: entry.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const entry = getStoryEntry(slug)
  if (!entry) return notFoundMetadata
  return pageMetadata({
    title: entry.title,
    description: entry.summary,
    path: `/story/${entry.slug}`,
  })
}

export default async function StoryEntryPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const entries = getStoryEntries()
  const index = entries.findIndex(entry => entry.slug === slug)
  const entry = entries[index]
  if (!entry) notFound()

  const newer = entries[index - 1]
  const older = entries[index + 1]

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-16">
      <JsonLd data={storyEntryJsonLd(entry)} />
      <p className="text-xs uppercase tracking-[0.28em] text-gold">
        <Link href="/story" className="hover:underline">
          Story
        </Link>
      </p>
      <div className="mt-8">
        <StoryEntryBlock entry={entry} heading="h1" />
      </div>
      <nav
        aria-label="Story entries"
        className="mt-14 flex flex-wrap justify-between gap-4 border-t border-line pt-6 text-sm"
      >
        {newer ? (
          <Link
            href={`/story/${newer.slug}`}
            className="text-gold hover:underline"
          >
            ← {newer.title}
          </Link>
        ) : (
          <span />
        )}
        {older ? (
          <Link
            href={`/story/${older.slug}`}
            className="ml-auto text-gold hover:underline"
          >
            {older.title} →
          </Link>
        ) : null}
      </nav>
    </div>
  )
}
