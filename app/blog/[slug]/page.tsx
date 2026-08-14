import Link from 'next/link'
import { notFound } from 'next/navigation'
import { BlogArticle } from '@/components/blog-post'
import { JsonLd } from '@/components/json-ld'
import { getBlogPost, getBlogPosts } from '@/lib/blog'
import { articleMetadata, blogPostJsonLd, notFoundMetadata } from '@/lib/seo'

export function generateStaticParams() {
  return getBlogPosts().map(post => ({ slug: post.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = getBlogPost(slug)
  if (!post) return notFoundMetadata
  return articleMetadata({
    title: post.title,
    description: post.description,
    path: `/blog/${post.slug}`,
    publishedTime: post.date,
  })
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const posts = getBlogPosts()
  const index = posts.findIndex(post => post.slug === slug)
  const post = posts[index]
  if (!post) notFound()

  const newer = posts[index - 1]
  const older = posts[index + 1]

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-16">
      <JsonLd data={blogPostJsonLd(post)} />
      <p className="text-xs uppercase tracking-[0.28em] text-gold">
        <Link href="/blog" className="hover:underline">
          Blog
        </Link>
      </p>
      <div className="mt-8">
        <BlogArticle post={post} />
      </div>
      <nav
        aria-label="Blog posts"
        className="mt-14 flex flex-wrap justify-between gap-4 border-t border-line pt-6 text-sm"
      >
        {newer ? (
          <Link
            href={`/blog/${newer.slug}`}
            className="text-gold hover:underline"
          >
            ← {newer.title}
          </Link>
        ) : (
          <span />
        )}
        {older ? (
          <Link
            href={`/blog/${older.slug}`}
            className="ml-auto text-gold hover:underline"
          >
            {older.title} →
          </Link>
        ) : null}
      </nav>
    </div>
  )
}
