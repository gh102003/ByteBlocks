import type { RunnerState } from '../python/runner'
import type { ExperienceLevel } from '../preferences'

export type ResolvedMentorLevel = Exclude<ExperienceLevel, 'auto'>

export function resolveMentorLevel(
  selectedLevel: ExperienceLevel | undefined,
  code: string,
  execution: Pick<RunnerState, 'output'>,
): ResolvedMentorLevel {
  if (!selectedLevel) return 'beginner'
  if (selectedLevel !== 'auto') return selectedLevel

  const output = execution.output.map(({ text }) => text).join('\n')
  if (/SyntaxError|IndentationError|TabError|unexpected indent/i.test(output))
    return 'beginner'

  if (
    /\b(class|async|await|yield|match|dataclass|TypedDict|Protocol)\b|->\s*\w+|@\w+/m.test(
      code,
    )
  )
    return 'senior'

  if (
    /\b(def|for|while|try|except|dict|set|lambda)\b|(?:\[|\{).*?(?:\]|\})/m.test(
      code,
    )
  )
    return 'intermediate'

  return 'beginner'
}
