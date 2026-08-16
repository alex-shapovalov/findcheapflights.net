import Link from 'next/link'
import { JsonLd } from '@/components/json-ld'
import { formatBlogDate, getBlogPosts } from '@/lib/blog'
import { blogIndexJsonLd, pageMetadata } from '@/lib/seo'

export const metadata = pageMetadata({
  title: 'Blogs, Guides, and Tips',
  description:
    'Learn how to find cheap flights for free. These guides cover nearby airports, flexible dates, and live fare hunts anywhere in the world on findcheapflights.ai.',
  path: '/blog',
})

export default function BlogPage() {
  const posts = getBlogPosts()

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-16">
      <JsonLd data={blogIndexJsonLd(posts)} />
      <p className="text-xs uppercase tracking-[0.28em] text-gold">Guides</p>
      <h1 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
        Blog
      </h1>
      <p className="mt-4 text-mute">
        How to find cheap flights, nearby airports, flexible dates, and fare
        searches of live public fares.
      </p>
      {posts.length === 0 ? (
        <p className="mt-12 text-mute">No posts yet.</p>
      ) : (
        <ol className="mt-12 space-y-8">
          {posts.map(post => (
            <li key={post.slug}>
              <p className="text-xs uppercase tracking-[0.16em] text-mute">
                <time dateTime={post.date}>{formatBlogDate(post.date)}</time>
              </p>
              <Link
                href={`/blog/${post.slug}`}
                className="mt-2 block font-display text-2xl tracking-tight text-foam hover:text-gold"
              >
                {post.title}
              </Link>
              <p className="mt-2 text-mute">{post.description}</p>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
