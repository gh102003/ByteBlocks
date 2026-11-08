export type ByteblocksPayload = {
  json: string
  start: number
  end: number
}

/**
 * Models occasionally omit quotes around an object key in an otherwise-valid
 * byteblocks payload (for example, `operator: "-"`). JSON requires those
 * quotes, but accepting this limited repair lets us render the diagram rather
 * than expose its implementation detail in the chat.
 */
function quoteUnquotedObjectKeys(json: string): string {
  let repaired = ''
  let quote = ''
  let escaped = false

  for (let index = 0; index < json.length; index += 1) {
    const character = json[index]
    if (quote) {
      repaired += character
      if (escaped) escaped = false
      else if (character === '\\') escaped = true
      else if (character === quote) quote = ''
      continue
    }
    if (character === '"' || character === "'") {
      quote = character
      repaired += character
      continue
    }

    if (character === '{' || character === ',') {
      const remainder = json.slice(index + 1)
      const match = remainder.match(/^(\s*)([A-Za-z_$][\w$-]*)(\s*:)/)
      if (match) {
        repaired += `${character}${match[1]}"${match[2]}"${match[3]}`
        index += match[0].length
        continue
      }
    }
    repaired += character
  }

  return repaired
}

function parseByteblocksJson(json: string): string | null {
  try {
    JSON.parse(json)
    return json
  } catch {
    const repaired = quoteUnquotedObjectKeys(json)
    if (repaired === json) return null
    try {
      JSON.parse(repaired)
      return repaired
    } catch {
      return null
    }
  }
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
        const json = parseByteblocksJson(text.slice(start, index + 1))
        return json ? { json, start: found.index, end: index + 1 } : null
      }
    }
  }
  return null
}

/** Removes a valid structured example while retaining the surrounding advice. */
export function withoutByteblocksPayload(text: string): string {
  const payload = findByteblocksPayload(text)
  if (!payload) return text

  let start = payload.start
  let end = payload.end
  const prefix = text.slice(0, start)
  const openingFence = prefix.match(/```$/)
  if (openingFence?.index !== undefined) {
    start = openingFence.index
    const closingFence = text.slice(end).match(/^\s*```/)
    if (closingFence) end += closingFence[0].length
  }

  return `${text.slice(0, start)}${text.slice(end)}`.trim()
}
