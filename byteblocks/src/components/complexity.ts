import type { ExecutionTrace } from '../python/trace'

export interface ComplexityEstimate {
  time: string
  timeDetail: string
  space: string
  spaceDetail: string
}

export type ObservedLine = {
  line: number
  source: string
  executions: number
}

export type ObservedCollection = {
  name: string
  type: string
  peakSize: number
}

export type ExecutionProfile = {
  lines: ObservedLine[]
  collections: ObservedCollection[]
  truncated: boolean
}

// Python emits a "line" event immediately before it runs that line. Counting
// those events lets us show the learner what this particular run actually did,
// while keeping the separate Big-O estimate about growth as input changes.
export function profileExecution(
  code: string,
  trace: ExecutionTrace,
): ExecutionProfile {
  const sourceLines = code.split('\n')
  const executions = new Map<number, number>()
  const collections = new Map<string, ObservedCollection>()

  for (const step of trace.steps) {
    if (step.event === 'line')
      executions.set(step.line, (executions.get(step.line) ?? 0) + 1)

    for (const frame of step.frames) {
      for (const variable of frame.variables) {
        const size = variable.value.size
        if (size === undefined) continue
        const key = `${frame.id}:${variable.name}`
        const previous = collections.get(key)
        if (!previous || size > previous.peakSize)
          collections.set(key, {
            name: variable.name,
            type: variable.value.type,
            peakSize: size,
          })
      }
    }
  }

  return {
    lines: [...executions.entries()]
      .sort(([left], [right]) => left - right)
      .map(([line, count]) => ({
        line,
        source: sourceLines[line - 1]?.trim() || `Line ${line}`,
        executions: count,
      })),
    collections: [...collections.values()].sort(
      (left, right) =>
        right.peakSize - left.peakSize || left.name.localeCompare(right.name),
    ),
    truncated: trace.truncated,
  }
}

// This intentionally recognizes only simple loop shapes; it is not a Python parser.
export function estimateComplexity(code: string): ComplexityEstimate {
  const lines = code.split('\n')
  const loops: number[] = []
  let maxDepth = 0
  let collectionDepth = 0
  let currentFunction: { name: string; indent: number } | undefined
  let unknownTime = false
  let unknownSpace = false

  for (const raw of lines) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const indent = raw.match(/^\s*/)?.[0].replaceAll('\t', '    ').length ?? 0
    if (currentFunction && indent <= currentFunction.indent)
      currentFunction = undefined
    const definition = line.match(/^(?:async\s+)?def\s+(\w+)\s*\(/)
    if (definition) currentFunction = { name: definition[1], indent }
    else if (
      currentFunction &&
      new RegExp(`\\b${currentFunction.name}\\s*\\(`).test(line)
    ) {
      unknownTime = true
      unknownSpace = true
    }
    while (loops.length && loops[loops.length - 1] >= indent) loops.pop()

    if (/^(async\s+)?while\b/.test(line)) {
      unknownTime = true
      unknownSpace = true
    }
    if (/^(async\s+)?for\b/.test(line)) {
      // A literal range has a fixed number of iterations as input grows.
      const fixed = /\bin\s+range\(\s*\d+\s*\)\s*:/.test(line)
      if (!fixed) loops.push(indent)
      maxDepth = Math.max(maxDepth, loops.length)
    }
    if (/\.(append|add|insert|extend|update)\s*\(|\[[^\]]+\]\s*=/.test(line)) {
      if (loops.length)
        collectionDepth = Math.max(collectionDepth, loops.length)
      else unknownSpace = true
    }
    // Calls, comprehensions, and recursion can hide work or allocation.
    if (
      /\b(sorted|sort|sum|min|max|list|dict|set)\s*\(|\.sort\s*\(|\[[^\]]+\bfor\b/.test(
        line,
      )
    ) {
      unknownTime = true
      unknownSpace = true
    }
  }

  const order =
    maxDepth === 0 ? 'O(1)' : maxDepth === 1 ? 'O(n)' : `O(n^${maxDepth})`
  const spaceOrder =
    collectionDepth === 0
      ? 'O(1)'
      : collectionDepth === 1
        ? 'O(n)'
        : `O(n^${collectionDepth})`
  return {
    time: unknownTime ? 'Unknown' : order,
    timeDetail: unknownTime
      ? 'Some operations or loops need closer analysis.'
      : maxDepth
        ? `Up to ${maxDepth} nested input-dependent loop${maxDepth === 1 ? '' : 's'}.`
        : 'No input-dependent loops detected.',
    space: unknownSpace ? 'Unknown' : spaceOrder,
    spaceDetail: unknownSpace
      ? 'Some allocations need closer analysis.'
      : collectionDepth
        ? 'A collection may grow inside a loop.'
        : 'No growing collection detected.',
  }
}
