import Link from 'next/link'
import { Markdown } from '@/components/markdown'
import { cn } from '@/lib/cn'
import { formatStoryDate, type StoryEntry, storyTagLabel } from '@/lib/story'

export function StoryEntryBlock({
  entry,
  heading,
}: {
  entry: StoryEntry
  heading: 'h1' | 'h2'
}) {
  const Heading = heading
  const coming = entry.tag === 'next'

  return (
    <article className="relative border-l border-line pl-6 sm:pl-8">
      <span
        className={cn(
          'absolute top-1.5 -left-1.5 h-3 w-3 rounded-full',
          coming ? 'bg-teal' : 'bg-gold',
        )}
      />
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs uppercase tracking-[0.16em] text-mute">
        <time dateTime={entry.date}>{formatStoryDate(entry.date)}</time>
        <span className={coming ? 'text-teal' : 'text-gold'}>
          {storyTagLabel(entry.tag)}
        </span>
      </p>
      <Heading className="mt-2 font-display text-3xl tracking-tight">
        {heading === 'h2' ? (
          <Link href={`/story/${entry.slug}`} className="hover:text-gold">
            {entry.title}
          </Link>
        ) : (
          entry.title
        )}
      </Heading>
      <div className="mt-5">
        <Markdown content={entry.body} />
      </div>
    </article>
  )
}
