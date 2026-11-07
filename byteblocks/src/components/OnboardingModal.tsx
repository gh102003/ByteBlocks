import { useState } from 'react'
import {
  type ExperienceLevel,
  type FeedbackStyle,
  type GuidanceTone,
  type LearningGoal,
  type UserPreferences,
  savePreferences,
} from '../preferences'
import { Icon } from './Icon'

interface OnboardingModalProps {
  initialPreferences?: UserPreferences | null
  onComplete: (prefs: UserPreferences) => void
  onCancel?: () => void
  isEditing?: boolean
}

const LEVEL_OPTIONS: Array<{
  value: ExperienceLevel
  label: string
  badge: string
  desc: string
}> = [
  {
    value: 'beginner',
    label: 'Beginner',
    badge: 'Foundations',
    desc: 'New to Python or algorithms. Focus on core syntax, step-by-step logic, and gentle hints.',
  },
  {
    value: 'intermediate',
    label: 'Intermediate',
    badge: 'DSA & Patterns',
    desc: 'Comfortable writing code. Practicing common algorithmic patterns, edge cases, and Big-O efficiency.',
  },
  {
    value: 'senior',
    label: 'Senior',
    badge: 'Systems & Idioms',
    desc: 'Experienced engineer. Focus on optimal complexity, subtle memory tradeoffs, and production Python idioms.',
  },
]

const FEEDBACK_OPTIONS: Array<{
  value: FeedbackStyle
  label: string
  desc: string
}> = [
  {
    value: 'socratic',
    label: 'Socratic Hints',
    desc: 'Ask targeted questions to guide you toward the answer without spoiling it.',
  },
  {
    value: 'direct',
    label: 'Direct & Concise',
    desc: 'Get straight to the point with brief, actionable pointers on bugs and complexity.',
  },
  {
    value: 'detailed',
    label: 'Detailed Explanations',
    desc: 'Deep-dive into underlying data structure behavior, tradeoffs, and analogies.',
  },
  {
    value: 'code-review',
    label: 'Production Code Review',
    desc: 'Evaluate PEP 8 style, variable naming, immutability, and readability.',
  },
]

const GOAL_OPTIONS: Array<{
  value: LearningGoal
  label: string
  desc: string
}> = [
  {
    value: 'interview',
    label: 'Technical Interview Prep',
    desc: 'Tackle DSA questions under realistic interview constraints.',
  },
  {
    value: 'pythonic',
    label: 'Idiomatic Python',
    desc: 'Learn expressive and clean Python features, comprehensions, and generators.',
  },
  {
    value: 'algorithms',
    label: 'Problem Solving Mastery',
    desc: 'Strengthen systematic problem decomposition and algorithmic thinking.',
  },
  {
    value: 'general',
    label: 'General Practice',
    desc: 'Fun, self-paced exploration and daily coding challenges.',
  },
]

const TONE_OPTIONS: Array<{
  value: GuidanceTone
  label: string
}> = [
  { value: 'encouraging', label: '🌱 Encouraging & Supportive' },
  { value: 'pragmatic', label: '⚖️ Pragmatic & Direct' },
  { value: 'rigorous', label: '🔬 Rigorous & Challenging' },
]

export function OnboardingModal({
  initialPreferences,
  onComplete,
  onCancel,
  isEditing = false,
}: OnboardingModalProps) {
  const [level, setLevel] = useState<ExperienceLevel>(
    initialPreferences?.level ?? 'intermediate',
  )
  const [feedbackStyle, setFeedbackStyle] = useState<FeedbackStyle>(
    initialPreferences?.feedbackStyle ?? 'socratic',
  )
  const [goal, setGoal] = useState<LearningGoal>(
    initialPreferences?.goal ?? 'interview',
  )
  const [tone, setTone] = useState<GuidanceTone>(
    initialPreferences?.tone ?? 'pragmatic',
  )
  const [customNotes, setCustomNotes] = useState(
    initialPreferences?.customNotes ?? '',
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const prefs: UserPreferences = {
      level,
      feedbackStyle,
      goal,
      tone,
      customNotes: customNotes.trim() || undefined,
      completedAt: new Date().toISOString(),
    }
    savePreferences(prefs)
    onComplete(prefs)
  }

  return (
    <div className="onboarding-overlay" role="dialog" aria-modal="true">
      <div className="onboarding-card">
        <header className="onboarding-header">
          <div className="onboarding-badge">
            <Icon name="sparkle" size={15} />
            <span>AI Coach Calibration</span>
          </div>
          <h2>
            {isEditing ? 'Update AI Preferences' : 'Tailor Your AI Coach'}
          </h2>
          <p>
            ByteBlocks customizes hints, complexity feedback, and code reviews
            specifically for your skill level and learning goals.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="onboarding-form">
          {/* Question 1: Experience Level */}
          <section className="onboarding-section">
            <label className="onboarding-label">
              <span className="step-num">1</span>
              <span>What is your Python experience level?</span>
            </label>
            <div className="options-grid three-col">
              {LEVEL_OPTIONS.map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  className={`choice-card ${level === opt.value ? 'selected' : ''}`}
                  onClick={() => setLevel(opt.value)}
                >
                  <div className="choice-header">
                    <strong>{opt.label}</strong>
                    <span className="choice-tag">{opt.badge}</span>
                  </div>
                  <p>{opt.desc}</p>
                </button>
              ))}
            </div>
          </section>

          {/* Question 2: Feedback Style */}
          <section className="onboarding-section">
            <label className="onboarding-label">
              <span className="step-num">2</span>
              <span>What style of feedback do you prefer?</span>
            </label>
            <div className="options-grid two-col">
              {FEEDBACK_OPTIONS.map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  className={`choice-card ${feedbackStyle === opt.value ? 'selected' : ''}`}
                  onClick={() => setFeedbackStyle(opt.value)}
                >
                  <div className="choice-header">
                    <strong>{opt.label}</strong>
                  </div>
                  <p>{opt.desc}</p>
                </button>
              ))}
            </div>
          </section>

          {/* Question 3: Primary Goal */}
          <section className="onboarding-section">
            <label className="onboarding-label">
              <span className="step-num">3</span>
              <span>What is your primary goal right now?</span>
            </label>
            <div className="options-grid two-col">
              {GOAL_OPTIONS.map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  className={`choice-card ${goal === opt.value ? 'selected' : ''}`}
                  onClick={() => setGoal(opt.value)}
                >
                  <div className="choice-header">
                    <strong>{opt.label}</strong>
                  </div>
                  <p>{opt.desc}</p>
                </button>
              ))}
            </div>
          </section>

          {/* Question 4: Tone */}
          <section className="onboarding-section">
            <label className="onboarding-label">
              <span className="step-num">4</span>
              <span>Preferred AI Tone</span>
            </label>
            <div className="tone-pills">
              {TONE_OPTIONS.map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  className={`tone-pill ${tone === opt.value ? 'selected' : ''}`}
                  onClick={() => setTone(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </section>

          {/* Optional notes */}
          <section className="onboarding-section">
            <label className="onboarding-label" htmlFor="custom-notes-input">
              <span className="step-num">5</span>
              <span>Any special instructions for the AI coach? (Optional)</span>
            </label>
            <input
              id="custom-notes-input"
              type="text"
              className="onboarding-input"
              placeholder="e.g. Focus on space complexity, warn me if I create extra lists..."
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              maxLength={200}
            />
          </section>

          <footer className="onboarding-footer">
            {isEditing && onCancel && (
              <button
                type="button"
                className="onboarding-secondary-btn"
                onClick={onCancel}
              >
                Cancel
              </button>
            )}
            <button type="submit" className="onboarding-submit-btn">
              <span>
                {isEditing ? 'Save Changes' : 'Save & Enter Workspace'}
              </span>
              <Icon name="arrow" size={15} />
            </button>
          </footer>
        </form>
      </div>
    </div>
  )
}
