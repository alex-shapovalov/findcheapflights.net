import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { cache } from 'react'

const STORY_DIR = join(process.cwd(), 'content/story')
const FILE_RE = /^(\d{4}-\d{2}-\d{2})-([a-z0-9]+(?:-[a-z0-9]+)*)\.md$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export const STORY_TAGS = ['shipped', 'next'] as const
export type StoryTag = (typeof STORY_TAGS)[number]

export type StoryEntry = {
  slug: string
  title: string
  date: string
  summary: string
  tag: StoryTag
  body: string
}

function isStoryTag(value: string): value is StoryTag {
  return STORY_TAGS.some(tag => tag === value)
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

function deriveSummary(body: string) {
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

function parseStoryFile(filename: string, raw: string): StoryEntry {
  const nameMatch = FILE_RE.exec(filename)
  if (!nameMatch) {
    throw new Error(`Invalid story filename: ${filename}`)
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
  const tag = data.tag || 'shipped'
  if (!isStoryTag(tag)) {
    throw new Error(`Invalid tag in ${filename}: ${tag}`)
  }
  return {
    slug,
    title,
    date,
    summary: data.summary || deriveSummary(body),
    tag,
    body,
  }
}

function loadStoryEntries() {
  if (!existsSync(STORY_DIR)) return []
  const files = readdirSync(STORY_DIR).filter(name => FILE_RE.test(name))
  const entries = files.map(name =>
    parseStoryFile(name, readFileSync(join(STORY_DIR, name), 'utf8')),
  )
  entries.sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1
    return a.slug < b.slug ? 1 : -1
  })
  return entries
}

export const getStoryEntries = cache(loadStoryEntries)

export function getStoryEntry(slug: string) {
  return getStoryEntries().find(entry => entry.slug === slug)
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

export function formatStoryDate(iso: string) {
  const [year, month, day] = iso.split('-').map(Number)
  return `${MONTHS[month - 1]} ${day}, ${year}`
}

export function storyTagLabel(tag: StoryTag) {
  return tag === 'next' ? 'Coming' : 'Shipped'
}
