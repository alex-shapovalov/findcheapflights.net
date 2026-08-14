import {
  APP_URL,
  OPENROUTER_MAX_OUTPUT_TOKENS,
  OPENROUTER_MODEL,
} from './constants'
import { buildFlightHuntPrompt } from './prompt'
import { FARE_REPORT_SCHEMA } from './report-schema'
import type { SearchRequest } from './types'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

const SYSTEM_PROMPT =
  'You are a rigorous airfare deal hunter. Never hallucinate. Never invent prices, dates, airlines, event lineups, airport codes, or URLs. If you did not observe a fact on a page or search result in this run, omit it or set the field to null. Fetch Skyscanner cheapest-month and routes/deal-listing pages first. One-stop itineraries are the default hunt; do not filter to nonstop. Convert non-USD prices to USD. Skyscanner "from £X" cards are often one-way — for round-trip hunts, follow the exact deal href through to a return total instead of discarding them. bookingUrl and sourceUrl must be copied verbatim from an observed href for that specific fare — never a generic search you constructed. The price you report must be the cheapest qualifying fare on that exact URL. Prefer primary sources and current search pages over recaps. If coverage is incomplete, say exactly what you checked and what you could not verify. Reply with a single JSON object that matches the requested schema and nothing else. Every deal must include originAirport and destinationAirport as uppercase 3-letter IATA codes (for example TPA and KEF), plus destinationCity as a city name. Never return an empty deals array: if the cap is missed, return the closest currently bookable fares instead.'

export async function streamFlightHunt(input: SearchRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    throw new Error('Fare search is not configured')
  }

  const prompt = buildFlightHuntPrompt(input, new Date())

  let response = await requestHunt(apiKey, prompt, true)
  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    if (!isSchemaUnsupported(response.status, detail)) {
      throw new Error(`Upstream request failed (${response.status})`)
    }
    response = await requestHunt(apiKey, prompt, false)
  }

  if (!response.ok || !response.body) {
    throw new Error(`Upstream request failed (${response.status})`)
  }

  return response.body
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(openRouterTextStream())
}

function requestHunt(apiKey: string, prompt: string, withSchema: boolean) {
  return fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': APP_URL,
      'X-Title': 'Find Cheap Flights',
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      stream: true,
      temperature: 0.2,
      max_tokens: OPENROUTER_MAX_OUTPUT_TOKENS,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      ...(withSchema
        ? {
            response_format: {
              type: 'json_schema',
              json_schema: FARE_REPORT_SCHEMA,
            },
          }
        : {}),
      tools: [
        {
          type: 'openrouter:datetime',
        },
        {
          type: 'openrouter:web_search',
          parameters: {
            max_results: 10,
            max_uses: 24,
          },
        },
        {
          type: 'openrouter:web_fetch',
          parameters: {
            max_uses: 20,
            max_content_tokens: 24000,
          },
        },
      ],
    }),
    signal: AbortSignal.timeout(270_000),
  })
}

function isSchemaUnsupported(status: number, detail: string) {
  if (status !== 400 && status !== 404 && status !== 422) return false
  return /response_format|json_schema|structured output/i.test(detail)
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
