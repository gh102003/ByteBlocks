export type ExperienceLevel = 'beginner' | 'intermediate' | 'senior'
export type FeedbackStyle = 'socratic' | 'direct' | 'detailed' | 'code-review'
export type LearningGoal = 'interview' | 'pythonic' | 'algorithms' | 'general'
export type GuidanceTone = 'encouraging' | 'pragmatic' | 'rigorous'

export interface UserPreferences {
  level: ExperienceLevel
  feedbackStyle: FeedbackStyle
  goal: LearningGoal
  tone: GuidanceTone
  customNotes?: string
  completedAt: string
}

export const PREFERENCES_STORAGE_KEY = 'byteblocks.ai.preferences'

export const DEFAULT_PREFERENCES: UserPreferences = {
  level: 'intermediate',
  feedbackStyle: 'socratic',
  goal: 'interview',
  tone: 'pragmatic',
  completedAt: new Date().toISOString(),
}

export function getPreferences(): UserPreferences | null {
  try {
    const raw = sessionStorage.getItem(PREFERENCES_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as UserPreferences
  } catch {
    return null
  }
}

export function savePreferences(prefs: UserPreferences): void {
  try {
    sessionStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(prefs))
  } catch (err) {
    console.error('Failed to save preferences to sessionStorage:', err)
  }
}

export function clearPreferences(): void {
  try {
    sessionStorage.removeItem(PREFERENCES_STORAGE_KEY)
  } catch {
    // Ignore storage errors
  }
}
