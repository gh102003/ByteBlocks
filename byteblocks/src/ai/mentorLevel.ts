import type { RunnerState } from '../python/runner'
import type { ExperienceLevel, LearningProfile } from '../preferences'

export type ResolvedMentorLevel = Exclude<ExperienceLevel, 'auto'>

export function resolveMentorLevel(
  selectedLevel: ExperienceLevel | undefined,
  code: string,
  execution: Pick<RunnerState, 'output'>,
  profile?: LearningProfile,
): ResolvedMentorLevel {
  if (!selectedLevel) return 'beginner'
  if (selectedLevel !== 'auto') return selectedLevel

  const output = execution.output.map(({ text }) => text).join('\n')
  if (/SyntaxError|IndentationError|TabError|unexpected indent/i.test(output))
    return 'beginner'

  // A learner's demonstrated concept mastery is more reliable than the
  // complexity of a snippet they may have pasted into the editor.
  if (profile?.diagnosticComplete) {
    const scores = Object.values(profile.concepts)
    const average =
      scores.reduce((total, score) => total + score, 0) / scores.length
    if (average < 0.75) return 'beginner'
    if (average >= 1.65) return 'senior'
  }

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
