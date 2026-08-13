import { APP_URL, OPENROUTER_MODEL } from './constants'
import { buildFlightHuntPrompt } from './prompt'
import type { SearchRequest } from './types'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

export async function streamFlightHunt(input: SearchRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured')
  }

  const today = new Date().toISOString().slice(0, 10)
  const prompt = buildFlightHuntPrompt(input, today)
  const appUrl = APP_URL

  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': appUrl,
      'X-Title': 'Find Cheap Flights',
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      stream: true,
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content:
            'You are a rigorous airfare deal hunter. Use web search and page fetch tools aggressively to inspect live/public fare results. Prefer primary sources and current search pages over recaps. Never invent prices, dates, airlines, or event lineups. If coverage is incomplete, say exactly what you checked and what you could not verify.',
        },
        { role: 'user', content: prompt },
      ],
      tools: [
        {
          type: 'openrouter:datetime',
        },
        {
          type: 'openrouter:web_search',
          parameters: {
            max_results: 8,
            max_uses: 18,
          },
        },
        {
          type: 'openrouter:web_fetch',
          parameters: {
            max_uses: 12,
            max_content_tokens: 20000,
          },
        },
      ],
    }),
    signal: AbortSignal.timeout(270_000),
  })

  if (!response.ok || !response.body) {
    const detail = await response.text().catch(() => '')
    throw new Error(
      `OpenRouter request failed (${response.status}): ${detail.slice(0, 500)}`,
    )
  }

  return response.body
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(openRouterTextStream())
}

function openRouterTextStream() {
  let buffer = ''
  return new TransformStream<string, string>({
    transform(chunk, controller) {
      buffer += chunk
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const line of lines) {
        const text = parseSseLine(line)
        if (text) controller.enqueue(text)
      }
    },
    flush(controller) {
      const text = parseSseLine(buffer)
      if (text) controller.enqueue(text)
    },
  })
}

function parseSseLine(line: string) {
  const trimmed = line.trim()
  if (!trimmed.startsWith('data:')) return ''
  const data = trimmed.slice(5).trim()
  if (!data || data === '[DONE]') return ''
  try {
    const json = JSON.parse(data) as {
      choices?: Array<{
        delta?: { content?: string | Array<{ type?: string; text?: string }> }
      }>
    }
    const content = json.choices?.[0]?.delta?.content
    if (typeof content === 'string') return content
    if (Array.isArray(content)) {
      return content
        .map(part => (typeof part === 'object' ? (part.text ?? '') : ''))
        .join('')
    }
    return ''
  } catch {
    return ''
  }
}
