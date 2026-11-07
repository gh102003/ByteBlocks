export type CollectionView = 'list' | 'stack' | 'queue'
export type TraceValue = {
  kind: 'scalar' | 'object' | 'list' | 'deque' | 'tuple' | 'set' | 'dict'
  type: string
  text: string
  size?: number
  items?: TraceValue[]
  entries?: { key: TraceValue; value: TraceValue }[]
}
export type TraceVariable = {
  name: string
  value: TraceValue
  view?: CollectionView | null
}
export type TraceFrame = {
  id: number
  name: string
  line: number
  variables: TraceVariable[]
}
export type TraceStep = {
  event: 'line' | 'return' | 'exception'
  line: number
  frames: TraceFrame[]
  result?: TraceValue
  exception?: string
}
export type ExecutionTrace = {
  steps: TraceStep[]
  truncated: boolean
}

const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object'
const shortText = (value: unknown) =>
  typeof value === 'string' && value.length <= 1000
const integer = (value: unknown) =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0

function validValue(value: unknown, depth = 0): value is TraceValue {
  if (!record(value) || depth > 3) return false
  return (
    ['scalar', 'object', 'list', 'deque', 'tuple', 'set', 'dict'].includes(
      value.kind as string,
    ) &&
    shortText(value.type) &&
    shortText(value.text) &&
    (value.size === undefined || integer(value.size)) &&
    (value.items === undefined ||
      (Array.isArray(value.items) &&
        value.items.length <= 40 &&
        value.items.every((item) => validValue(item, depth + 1)))) &&
    (value.entries === undefined ||
      (Array.isArray(value.entries) &&
        value.entries.length <= 40 &&
        value.entries.every(
          (entry) =>
            record(entry) &&
            validValue(entry.key, depth + 1) &&
            validValue(entry.value, depth + 1),
        )))
  )
}

// Messages originate in the user-code sandbox. Check their shape and bounds
// before exposing them to React, just as we do with ordinary execution output.
export function isTraceStep(value: unknown): value is TraceStep {
  return (
    record(value) &&
    ['line', 'return', 'exception'].includes(value.event as string) &&
    integer(value.line) &&
    (value.result === undefined || validValue(value.result)) &&
    (value.exception === undefined || shortText(value.exception)) &&
    Array.isArray(value.frames) &&
    value.frames.length > 0 &&
    value.frames.length <= 12 &&
    value.frames.every(
      (frame) =>
        record(frame) &&
        integer(frame.id) &&
        shortText(frame.name) &&
        integer(frame.line) &&
        Array.isArray(frame.variables) &&
        frame.variables.length <= 40 &&
        frame.variables.every(
          (variable) =>
            record(variable) &&
            shortText(variable.name) &&
            (variable.view == null ||
              ['list', 'stack', 'queue'].includes(variable.view as string)) &&
            validValue(variable.value),
        ),
    )
  )
}

export function describeValue(value: TraceValue): string {
  if (value.entries) {
    return `{${value.entries.map((entry) => `${describeValue(entry.key)}: ${describeValue(entry.value)}`).join(', ')}${(value.size ?? 0) > value.entries.length ? ', …' : ''}}`
  }
  if (value.items) {
    const [open, close] =
      value.kind === 'tuple'
        ? ['(', ')']
        : value.kind === 'set'
          ? ['{', '}']
          : ['[', ']']
    return `${open}${value.items.map(describeValue).join(', ')}${(value.size ?? 0) > value.items.length ? ', …' : ''}${close}`
  }
  return value.text
}
