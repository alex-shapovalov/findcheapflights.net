import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { cache } from 'react'

const BLOG_DIR = join(process.cwd(), 'content/blog')
const FILE_RE = /^(\d{4}-\d{2}-\d{2})-([a-z0-9]+(?:-[a-z0-9]+)*)\.md$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export type BlogPost = {
  slug: string
  title: string
  date: string
  description: string
  body: string
}

function parseFrontmatter(raw: string, filename: string) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/)
  if (!match) {
    throw new Error(`Missing frontmatter in ${filename}`)
  }
  const data: Record<string, string> = {}
  for (const line of match[1].split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) continue
    const idx = trimmed.indexOf(':')
    if (idx === -1) {
      throw new Error(`Invalid frontmatter line in ${filename}: ${line}`)
    }
    const key = trimmed.slice(0, idx).trim()
    const value = trimmed
      .slice(idx + 1)
      .trim()
      .replace(/^["']|["']$/g, '')
    data[key] = value
  }
  return { data, body: match[2].trim() }
}

function deriveDescription(body: string) {
  const block = body
    .split(/\n{2,}/)
    .map(part => part.trim())
    .find(part => part && !part.startsWith('#'))
  if (!block) return ''
  return block
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_`#]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function parseBlogFile(filename: string, raw: string): BlogPost {
  const nameMatch = FILE_RE.exec(filename)
  if (!nameMatch) {
    throw new Error(`Invalid blog filename: ${filename}`)
  }
  const [, fileDate, slug] = nameMatch
  const { data, body } = parseFrontmatter(raw, filename)
  const title = data.title
  if (!title) {
    throw new Error(`Missing title in ${filename}`)
  }
  const date = data.date || fileDate
  if (!DATE_RE.test(date)) {
    throw new Error(`Invalid date in ${filename}`)
  }
  return {
    slug,
    title,
    date,
    description: data.description || data.summary || deriveDescription(body),
    body,
  }
}

function loadBlogPosts() {
  if (!existsSync(BLOG_DIR)) return []
  const files = readdirSync(BLOG_DIR).filter(name => FILE_RE.test(name))
  const posts = files.map(name =>
    parseBlogFile(name, readFileSync(join(BLOG_DIR, name), 'utf8')),
  )
  const slugs = new Set<string>()
  for (const post of posts) {
    if (slugs.has(post.slug)) {
      throw new Error(`Duplicate blog slug: ${post.slug}`)
    }
    slugs.add(post.slug)
  }
  posts.sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1
    return a.slug < b.slug ? 1 : -1
  })
  return posts
}

export const getBlogPosts = cache(loadBlogPosts)

export function getBlogPost(slug: string) {
  return getBlogPosts().find(post => post.slug === slug)
}

const SENTENCE_RE = /[.!?](?:["')\]]+)?(?=\s|$)/g

function countSentences(text: string) {
  const plain = text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_`#]/g, '')
    .trim()
  if (!plain) return 0
  return plain.match(SENTENCE_RE)?.length ?? 1
}

function splitBlockAfterSentences(text: string, count: number) {
  const matches = [...text.matchAll(SENTENCE_RE)]
  if (matches.length < count) return null
  const last = matches[count - 1]
  const end = (last.index ?? 0) + last[0].length
  return {
    before: text.slice(0, end).trim(),
    after: text.slice(end).trim(),
  }
}

export function splitBlogAfterIntro(body: string, minSentences = 2) {
  const blocks = body
    .split(/\n{2,}/)
    .map(part => part.trim())
    .filter(Boolean)
  let sentences = 0
  let index = 0
  let beforeTail = ''
  let afterHead = ''
  for (; index < blocks.length; index += 1) {
    const block = blocks[index]
    if (block.startsWith('#')) {
      if (sentences > 0) break
      continue
    }
    const remaining = minSentences - sentences
    const split = splitBlockAfterSentences(block, remaining)
    if (split) {
      beforeTail = split.before
      afterHead = split.after
      break
    }
    sentences += countSentences(block)
  }
  const beforeBlocks = blocks.slice(0, index)
  if (beforeTail) beforeBlocks.push(beforeTail)
  if (index === 0 && !beforeTail) {
    beforeBlocks.push(blocks[0] ?? '')
    index = 1
    afterHead = ''
  }
  const afterBlocks = [
    ...(afterHead ? [afterHead] : []),
    ...blocks.slice(index + (beforeTail ? 1 : 0)),
  ]
  return {
    before: beforeBlocks.filter(Boolean).join('\n\n'),
    after: afterBlocks.filter(Boolean).join('\n\n'),
  }
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const

export function formatBlogDate(iso: string) {
  const [year, month, day] = iso.split('-').map(Number)
  return `${MONTHS[month - 1]} ${day}, ${year}`
}
