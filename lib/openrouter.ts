import { APP_URL, OPENROUTER_MODEL } from './constants'
import {
  createHuntProgress,
  HUNT_FETCH_MAX_USES,
  HUNT_SEARCH_MAX_USES,
  type HuntClientEvent,
} from './hunt-stream'
import { buildFlightHuntPrompt } from './prompt'
import { FARE_REPORT_SCHEMA } from './report-schema'
import type { SearchRequest } from './types'

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
      throw new Error('Upstream request failed 208')
    }
    response = await requestHunt(apiKey, prompt, false)
  }

  if (!response.ok || !response.body) {
    throw new Error('Upstream request failed 209')
  }

  return response.body
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(openRouterHuntStream())
}

function requestHunt(apiKey: string, prompt: string, withSchema: boolean) {
  return fetch('https://openrouter.ai/api/v1/chat/completions', {
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
      stream_options: { include_usage: true },
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content:
            'You are a rigorous airfare deal hunter. Never hallucinate. Never invent prices, dates, airlines, event lineups, airport codes, or URLs. If you did not observe a fact on a page or search result in this run, omit it or set the field to null. Fetch Skyscanner cheapest-month and routes/deal-listing pages first. One-stop itineraries are the default hunt; do not filter to nonstop. Convert non-USD prices to USD. Skyscanner "from £X" cards are often one-way — for round-trip hunts, follow the exact deal href through to a dated return total instead of discarding them. Every deal must include a bookingUrl. Prefer a copied Google /travel/flights/booking?tfs=&tfu= or Skyscanner /config/{id} href. If you do not have that token, emit a dated Google, Kayak, or Skyscanner URL that includes this origin IATA, destination IATA, and travel dates. Never leave bookingUrl null. Never use marketing pages such as /flights-to-europe/, /flight-routes/, or /flights-from-City-to-City. You must fetch each bookingUrl with the page-fetch tool and report only what that page showed. verifiedLive is true only after that visit confirmed this origin, destination, dates, and price. If the page differs, change the deal to match or drop it. Prefer primary sources and current search pages over recaps. If coverage is incomplete, say exactly what you checked and what you could not verify. Reply with a single JSON object that matches the requested schema and nothing else. Every deal must include originAirport and destinationAirport as uppercase 3-letter IATA codes (for example TPA and KEF), plus destinationCity as a city name. Never return an empty deals array: if the cap is missed, return the closest currently bookable fares instead.',
        },
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
      reasoning: { enabled: true },
      tools: [
        {
          type: 'openrouter:datetime',
        },
        {
          type: 'openrouter:web_search',
          parameters: {
            max_results: 10,
            max_uses: HUNT_SEARCH_MAX_USES,
          },
        },
        {
          type: 'openrouter:web_fetch',
          parameters: {
            max_uses: HUNT_FETCH_MAX_USES,
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

function openRouterHuntStream() {
  let buffer = ''
  const progress = createHuntProgress()
  return new TransformStream<string, HuntClientEvent>({
    start(controller) {
      controller.enqueue(progress.snapshot())
    },
    transform(chunk, controller) {
      buffer += chunk
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const line of lines) {
        for (const event of progress.applySseLine(line)) {
          controller.enqueue(event)
        }
      }
    },
    flush(controller) {
      for (const event of progress.applySseLine(buffer)) {
        controller.enqueue(event)
      }
      controller.enqueue(progress.finish())
    },
  })
}
