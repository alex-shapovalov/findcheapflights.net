import { hasReportContent, parseFareReport } from './report'

export const HUNT_SEARCH_MAX_USES = 24
export const HUNT_FETCH_MAX_USES = 20

export type HuntClientEvent =
  | { type: 'progress'; percent: number; label: string }
  | { type: 'chunk'; text: string }

type ToolKind = 'search' | 'fetch' | 'other'

type ModelSignal = {
  content: string
  reasoning: string
  reasoningTokens: number
  tools: Array<{ id: string; name: string; args: string }>
}

export function encodeHuntEvent(event: HuntClientEvent) {
  return `${JSON.stringify(event)}\n`
}

export function parseHuntEvent(line: string): HuntClientEvent | null {
  const trimmed = line.trim()
  if (!trimmed) return null
  try {
    const parsed = JSON.parse(trimmed) as HuntClientEvent
    if (parsed.type === 'progress') {
      return {
        type: 'progress',
        percent: clampPercent(parsed.percent),
        label:
          typeof parsed.label === 'string' ? parsed.label : playfulLabel(0),
      }
    }
    if (parsed.type === 'chunk' && typeof parsed.text === 'string') {
      return parsed
    }
    return { type: 'chunk', text: trimmed }
  } catch {
    return { type: 'chunk', text: trimmed }
  }
}

export function createHuntProgress() {
  const flavorOffset = Math.floor(Math.random() * HUNT_FLAVOR.length)
  let flavorTick = 0
  let lastFlavorPacket = 0
  let lastReasoningFlavor = 0
  let percent = 2
  let label: string = playfulLabel(flavorOffset)
  const toolArgs = new Map<string, string>()
  const toolNames = new Map<string, string>()
  const toolKinds = new Map<string, ToolKind>()
  let searches = 0
  let fetches = 0
  let reasoningChars = 0
  let reasoningTokens = 0
  let packets = 0
  let writing = false
  let report = ''

  function spinLabel() {
    flavorTick += 1
    lastFlavorPacket = packets
    label = playfulLabel(flavorOffset + flavorTick)
  }

  function snapshot(): HuntClientEvent {
    return { type: 'progress', percent, label }
  }

  function applySseLine(line: string): HuntClientEvent[] {
    const signal = signalFromSseLine(line)
    if (!signal) return []
    packets += 1
    return applySignal(signal)
  }

  function applySignal(signal: ModelSignal): HuntClientEvent[] {
    const events: HuntClientEvent[] = []
    const before = `${percent}|${label}`

    if (signal.reasoningTokens > reasoningTokens) {
      reasoningTokens = signal.reasoningTokens
    }
    if (signal.reasoning) {
      reasoningChars += signal.reasoning.length
      if (!writing && reasoningChars - lastReasoningFlavor > 700) {
        lastReasoningFlavor = reasoningChars
        spinLabel()
      }
    }

    for (const tool of signal.tools) {
      const prevArgs = toolArgs.get(tool.id) ?? ''
      const nextArgs = prevArgs + tool.args
      toolArgs.set(tool.id, nextArgs)
      if (tool.name) toolNames.set(tool.id, tool.name)
      const name = toolNames.get(tool.id) ?? tool.name
      const nextKind = toolKind(name)
      const prevKind = toolKinds.get(tool.id)
      if (!prevKind) {
        toolKinds.set(tool.id, nextKind)
        if (nextKind === 'search') searches += 1
        else if (nextKind === 'fetch') fetches += 1
        spinLabel()
      } else if (prevKind === 'other' && nextKind !== 'other') {
        toolKinds.set(tool.id, nextKind)
        if (nextKind === 'search') searches += 1
        else if (nextKind === 'fetch') fetches += 1
      }
    }

    if (signal.content) {
      const startedWriting = !writing
      writing = true
      report += signal.content
      if (startedWriting) spinLabel()
      events.push({ type: 'chunk', text: signal.content })
    }

    if (packets - lastFlavorPacket >= 8) spinLabel()

    percent = Math.max(percent, computePercent())
    if (`${percent}|${label}` !== before) {
      events.unshift(snapshot())
    }
    return events
  }

  function computePercent() {
    if (writing) return writePercent()
    const searchShare = Math.min(1, searches / HUNT_SEARCH_MAX_USES)
    const fetchShare = Math.min(1, fetches / HUNT_FETCH_MAX_USES)
    const toolShare = searchShare * 0.55 + fetchShare * 0.45
    const thinkingShare = Math.min(
      0.22,
      Math.max(reasoningChars / 18_000, reasoningTokens / 4_500),
    )
    const packetShare = Math.min(0.1, packets / 80)
    const research = 4 + (72 * toolShare + 18 * thinkingShare + 8 * packetShare)
    return clampPercent(Math.min(78, research))
  }

  function writePercent() {
    const parsed = parseFareReport(report)
    let score = Math.min(8, report.length / 120)
    if (parsed && hasReportContent(parsed)) {
      if (parsed.headline) score += 4
      if (parsed.verdict) score += 3
      if (parsed.summary) score += 5
      score += Math.min(48, (parsed.deals?.length ?? 0) * 8)
      score += Math.min(8, (parsed.alsoChecked?.length ?? 0) * 1)
    }
    return clampPercent(78 + Math.min(21, (score / 80) * 21))
  }

  function finish(): HuntClientEvent {
    percent = 100
    label = 'Back from the hunt'
    return snapshot()
  }

  return { snapshot, applySseLine, finish }
}

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(100, Math.round(value)))
}

function signalFromSseLine(line: string): ModelSignal | null {
  const trimmed = line.trim()
  if (!trimmed.startsWith('data:')) return null
  const data = trimmed.slice(5).trim()
  if (!data || data === '[DONE]') return null
  try {
    return signalFromPacket(JSON.parse(data) as Record<string, unknown>)
  } catch {
    return null
  }
}

function signalFromPacket(packet: Record<string, unknown>): ModelSignal {
  const signal: ModelSignal = {
    content: '',
    reasoning: '',
    reasoningTokens: 0,
    tools: [],
  }
  const usage = asRecord(packet.usage)
  const details = asRecord(usage?.completion_tokens_details)
  if (typeof details?.reasoning_tokens === 'number') {
    signal.reasoningTokens = details.reasoning_tokens
  }

  const choices = Array.isArray(packet.choices) ? packet.choices : []
  for (const choice of choices) {
    const row = asRecord(choice)
    if (!row) continue
    mergeDelta(signal, asRecord(row.delta) ?? asRecord(row.message))
  }

  if (typeof packet.type === 'string') {
    const type = packet.type
    if (type.includes('output_text') || type.includes('content')) {
      signal.content += textFromUnknown(packet.delta ?? packet.text)
    }
    if (type.includes('reasoning')) {
      signal.reasoning += textFromUnknown(packet.delta ?? packet.text)
    }
    if (type.includes('function_call') || type.includes('web_search')) {
      const item = asRecord(packet.item) ?? packet
      const name =
        textFromUnknown(asRecord(item)?.name) ||
        (type.includes('web_search') ? 'web_search' : 'tool')
      const id =
        textFromUnknown(asRecord(item)?.id) ||
        textFromUnknown(asRecord(item)?.call_id) ||
        name
      signal.tools.push({
        id,
        name,
        args: textFromUnknown(
          asRecord(item)?.arguments ?? asRecord(item)?.query,
        ),
      })
    }
  }

  return signal
}

function mergeDelta(
  signal: ModelSignal,
  delta: Record<string, unknown> | null,
) {
  if (!delta) return
  signal.content += contentText(delta.content)
  signal.reasoning += textFromUnknown(delta.reasoning)
  const details = delta.reasoning_details
  if (Array.isArray(details)) {
    for (const part of details) {
      const row = asRecord(part)
      if (!row) continue
      signal.reasoning += textFromUnknown(
        row.text ?? row.summary ?? row.content,
      )
    }
  }

  const toolCalls = delta.tool_calls
  if (Array.isArray(toolCalls)) {
    for (const call of toolCalls) {
      const row = asRecord(call)
      if (!row) continue
      const fn = asRecord(row.function)
      const name = textFromUnknown(fn?.name ?? row.name ?? row.type)
      const index =
        typeof row.index === 'number' ? row.index : signal.tools.length
      const id = textFromUnknown(row.id) || `tool-${index}`
      signal.tools.push({
        id,
        name,
        args: textFromUnknown(fn?.arguments ?? row.arguments),
      })
    }
  }

  const legacy = asRecord(delta.function_call)
  if (legacy) {
    signal.tools.push({
      id: textFromUnknown(legacy.name) || 'function',
      name: textFromUnknown(legacy.name),
      args: textFromUnknown(legacy.arguments),
    })
  }
}

function contentText(value: unknown) {
  if (typeof value === 'string') return value
  if (!Array.isArray(value)) return ''
  return value
    .map(part => {
      if (typeof part === 'string') return part
      const row = asRecord(part)
      return row ? textFromUnknown(row.text ?? row.content) : ''
    })
    .join('')
}

function textFromUnknown(value: unknown): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return ''
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function toolKind(name: string): ToolKind {
  const key = name.toLowerCase()
  if (key.includes('search')) return 'search'
  if (key.includes('fetch') || key.includes('page')) return 'fetch'
  if (key.includes('datetime') || key.includes('date')) return 'other'
  return 'other'
}

const HUNT_FLAVOR = [
  'Warming up the passport',
  'Putting on the deal-hunting goggles',
  'Sniffing the jet fuel of a bargain',
  'Shaking the fare trees',
  'Peeking under the seat cushions',
  'Asking Tuesday what it knows',
  'Bribing the calendar with snacks',
  'Whispering to the departure board',
  'Chasing a stupid-cheap rumor',
  'Rattling the vending machine of aviation',
  'Following a hunch across an ocean',
  'Combing the layover jungle',
  'Flipping months like vinyl',
  'Trying cities on like jackets',
  'Making friends with obscure airports',
  'Fishing the shoulder season',
  'Knocking on January’s door',
  'Walking past the obvious hubs',
  'Letting a connection city introduce itself',
  'Counting nights on our fingers',
  'Rolling the dice on a red-eye',
  'Listening for a price to blink',
  'Watching a fare hesitate',
  'Holding a flashlight under a maybe',
  'Turning over rocks in March',
  'Sending a scout to the islands',
  'Folding a paper plane toward somewhere nicer',
  'Tuning the radio to cheap',
  'Collecting rumors from the gate',
  'Tapping on glass departure times',
  'Sifting gold from the middle seat',
  'Waking up a sleepy midweek fare',
  'Borrowing a better origin for a minute',
  'Measuring the gap between good and wait-what',
  'Giving the sky a pep talk',
  'Hunting in the tall grass of calendars',
  'Checking if the universe left a deal out',
  'Wandering the duty-free of possibilities',
  'Shaking hands with a one-stop',
  'Tossing a coin in the departure fountain',
  'Reading the fine print of the clouds',
  'Keeping the hunt a little feral',
  'Packing an imaginary carry-on',
  'Tracing fingerprints on a price',
  'Circling a city like a hawk',
  'Waiting for the board to flinch',
  'Asking is this real in a whisper',
  'Holding out for the spicy one',
  'Walking a fare like a nervous dog',
  'Letting curiosity take the window',
  'Jogging the long-haul corridor',
  'Dusting off forgotten Tuesdays',
  'Bargaining with the jet stream',
  'Looking behind the duty-free',
  'Untangling a ball of routes',
  'Poking midweek in the ribs',
  'Hunting shoulder-season ghosts',
  'Counting stops like lucky charms',
  'Tasting dates that are not ripe yet',
  'Mapping the cheap seats with a crayon',
  'Putting a tracker on a rumor',
  'Crossing the Atlantic on a dare',
  'Keeping the receipt for a maybe',
  'Stirring the pot of cities',
  'Listening to the hum of inventory',
  'Catching a fare in the wild',
  'Warming both hands on a low number',
  'Asking Cleveland if it wants to come',
  'Polishing a boarding pass that does not exist yet',
  'Leaving a trail of maybe-yes tabs',
  'Checking the couch for loose euros',
  'Negotiating with time zones',
  'Sniffing out a weekend that forgot its price',
  'Wearing the goggles a little lower',
  'Letting a cheap seat wink first',
] as const

function playfulLabel(index: number) {
  return HUNT_FLAVOR[
    ((index % HUNT_FLAVOR.length) + HUNT_FLAVOR.length) % HUNT_FLAVOR.length
  ]
}
