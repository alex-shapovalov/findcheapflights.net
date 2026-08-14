import type { MetadataRoute } from 'next'
import { getBlogPosts } from '@/lib/blog'
import { SITE_URL } from '@/lib/constants'
import { getStoryEntries } from '@/lib/story'

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()
  const stories = getStoryEntries().map(entry => ({
    url: `${SITE_URL}/story/${entry.slug}`,
    lastModified: new Date(`${entry.date}T00:00:00Z`),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))
  const posts = getBlogPosts().map(post => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: new Date(`${post.date}T00:00:00Z`),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))
  return [
    {
      url: SITE_URL,
      lastModified,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${SITE_URL}/pricing`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    ...posts,
    {
      url: `${SITE_URL}/story`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    ...stories,
    {
      url: `${SITE_URL}/terms`,
      lastModified,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]
}
