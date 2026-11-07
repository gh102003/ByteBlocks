export type ByteblocksPayload = {
  json: string
  start: number
  end: number
}

/**
 * Finds either a fenced `byteblocks` example or the compact
 * `byteblocks [ ... ]` form used by voice/chat transports.
 */
export function findByteblocksPayload(text: string): ByteblocksPayload | null {
  const marker = /\bbyteblocks\b/gi
  const found = marker.exec(text)
  if (!found) return null

  const start = text.indexOf('[', found.index + found[0].length)
  if (start === -1) return null

  let depth = 0
  let quote = ''
  let escaped = false
  for (let index = start; index < text.length; index += 1) {
    const character = text[index]
    if (quote) {
      if (escaped) escaped = false
      else if (character === '\\') escaped = true
      else if (character === quote) quote = ''
      continue
    }
    if (character === '"' || character === "'") {
      quote = character
      continue
    }
    if (character === '[') depth += 1
    if (character === ']') {
      depth -= 1
      if (depth === 0) {
        const json = text.slice(start, index + 1)
        try {
          JSON.parse(json)
          return { json, start: found.index, end: index + 1 }
        } catch {
          return null
        }
      }
    }
  }
  return null
}

/** Removes a valid structured example while retaining the surrounding advice. */
export function withoutByteblocksPayload(text: string): string {
  const payload = findByteblocksPayload(text)
  if (!payload) return text
  return `${text.slice(0, payload.start)}${text.slice(payload.end)}`
    .replace(/^\s*```\s*$/m, '')
    .trim()
}
