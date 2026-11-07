export type ExperienceLevel = 'auto' | 'beginner' | 'intermediate' | 'senior'
export type FeedbackStyle = 'socratic' | 'direct' | 'detailed' | 'code-review'
export type LearningGoal = 'interview' | 'pythonic' | 'algorithms' | 'general'
export type GuidanceTone = 'encouraging' | 'pragmatic' | 'rigorous'
export type AdviceFormat = 'text' | 'python' | 'blocks'

export interface UserPreferences {
  level: ExperienceLevel
  feedbackStyle: FeedbackStyle
  goal: LearningGoal
  tone: GuidanceTone
  adviceFormat: AdviceFormat
  customNotes?: string
  completedAt: string
}

export const PREFERENCES_STORAGE_KEY = 'byteblocks.ai.preferences'

export const DEFAULT_PREFERENCES: UserPreferences = {
  level: 'intermediate',
  feedbackStyle: 'socratic',
  goal: 'interview',
  tone: 'pragmatic',
  adviceFormat: 'text',
  completedAt: new Date().toISOString(),
}

function preferencesStorageKey(userId?: string): string {
  return userId
    ? `${PREFERENCES_STORAGE_KEY}.${userId}`
    : PREFERENCES_STORAGE_KEY
}

export function getPreferences(userId?: string): UserPreferences | null {
  try {
    const raw = sessionStorage.getItem(preferencesStorageKey(userId))
    if (!raw) return null
    return JSON.parse(raw) as UserPreferences
  } catch {
    return null
  }
}

export function savePreferences(prefs: UserPreferences, userId?: string): void {
  try {
    sessionStorage.setItem(preferencesStorageKey(userId), JSON.stringify(prefs))
  } catch (err) {
    console.error('Failed to save preferences to sessionStorage:', err)
  }
}

export function clearPreferences(userId?: string): void {
  try {
    sessionStorage.removeItem(preferencesStorageKey(userId))
  } catch {
    // Ignore storage errors
  }
}
