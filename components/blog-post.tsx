import Link from 'next/link'
import { Markdown } from '@/components/markdown'
import { type BlogPost, formatBlogDate } from '@/lib/blog'

export function BlogArticle({ post }: { post: BlogPost }) {
  return (
    <article>
      <p className="text-xs uppercase tracking-[0.16em] text-mute">
        <time dateTime={post.date}>{formatBlogDate(post.date)}</time>
      </p>
      <h1 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
        {post.title}
      </h1>
      <p className="mt-4 text-lg text-mute">{post.description}</p>
      <div className="mt-8">
        <Markdown content={post.body} />
      </div>
      <p className="mt-12 rounded-2xl border border-line bg-panel px-5 py-5">
        <span className="font-medium text-foam">Ready to hunt?</span>{' '}
        <span className="text-mute">
          Run a live cheap-flight search from nearby airports or to a city you
          already want.
        </span>{' '}
        <Link href="/" className="text-gold hover:underline">
          Find cheap flights
        </Link>
      </p>
    </article>
  )
}
