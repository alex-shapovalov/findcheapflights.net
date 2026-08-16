import { JsonLd } from '@/components/json-ld'
import { StoryEntryBlock } from '@/components/story-entry'
import { pageMetadata, storyIndexJsonLd } from '@/lib/seo'
import { getStoryEntries } from '@/lib/story'

export const metadata = pageMetadata({
  title: 'Updates and Journal',
  description:
    'Read a dated journal of what Find Cheap Flights has shipped, plus updates on alerts, onboarding, and what is coming next on findcheapflights.ai.',
  path: '/story',
})

export default function StoryPage() {
  const entries = getStoryEntries()

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-16">
      <JsonLd data={storyIndexJsonLd(entries)} />
      <p className="text-xs uppercase tracking-[0.28em] text-gold">Journal</p>
      <h1 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
        The story
      </h1>
      <p className="mt-4 text-mute">
        Dated notes as the product changes: what shipped, what we are building
        toward. Newest first.
      </p>
      {entries.length === 0 ? (
        <p className="mt-12 text-mute">No entries yet.</p>
      ) : (
        <div className="mt-12 flex flex-col gap-14">
          {entries.map(entry => (
            <StoryEntryBlock key={entry.slug} entry={entry} heading="h2" />
          ))}
        </div>
      )}
    </div>
  )
}
