import { useState } from 'react'
import {
  type ExperienceLevel,
  type FeedbackStyle,
  type GuidanceTone,
  type AdviceFormat,
  type LearningGoal,
  type UserPreferences,
  savePreferences,
} from '../preferences'
import { Icon } from './Icon'
import { AutoMentorSprite, NibbleSprite } from './NibbleSprite'
import { mascotForLevel, mascotName } from './mascot'

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
    value: 'auto',
    label: 'Auto',
    badge: 'Choose for me',
    desc: 'Your runs help pick a mentor.',
  },
  {
    value: 'beginner',
    label: 'Beginner',
    badge: 'Start here',
    desc: 'Core Python, one step at a time.',
  },
  {
    value: 'intermediate',
    label: 'Intermediate',
    badge: 'Build speed',
    desc: 'Patterns, edge cases, and Big-O.',
  },
  {
    value: 'senior',
    label: 'Senior',
    badge: 'Go deep',
    desc: 'Tradeoffs, performance, and clean code.',
  },
]

const FEEDBACK_OPTIONS: Array<{
  value: FeedbackStyle
  label: string
  desc: string
}> = [
  {
    value: 'socratic',
    label: 'Ask me questions',
    desc: 'Help me figure it out myself.',
  },
  {
    value: 'direct',
    label: 'Just tell me',
    desc: 'Show me the next step.',
  },
  {
    value: 'detailed',
    label: 'Explain it slowly',
    desc: 'Tell me why it works.',
  },
  {
    value: 'code-review',
    label: 'Check my code',
    desc: 'Spot ways to make it better.',
  },
]

const GOAL_OPTIONS: Array<{
  value: LearningGoal
  label: string
  desc: string
}> = [
  {
    value: 'interview',
    label: 'Get interview ready',
    desc: 'Practice tricky questions.',
  },
  {
    value: 'pythonic',
    label: 'Write better Python',
    desc: 'Learn neat Python tricks.',
  },
  {
    value: 'algorithms',
    label: 'Solve puzzles',
    desc: 'Break big problems into steps.',
  },
  {
    value: 'general',
    label: 'Explore and play',
    desc: 'Try things at your own pace.',
  },
]

const TONE_OPTIONS: Array<{
  value: GuidanceTone
  label: string
}> = [
  { value: 'encouraging', label: 'Cheer me on' },
  { value: 'pragmatic', label: 'Keep it simple' },
  { value: 'rigorous', label: 'Push me hard' },
]

const ADVICE_FORMAT_OPTIONS: Array<{
  value: AdviceFormat
  label: string
  desc: string
}> = [
  { value: 'text', label: 'Words', desc: 'Explain it to me.' },
  { value: 'python', label: 'Code', desc: 'Show me Python.' },
  {
    value: 'blocks',
    label: 'Blocks',
    desc: 'Show me the blocks.',
  },
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
  const [adviceFormat, setAdviceFormat] = useState<AdviceFormat>(
    initialPreferences?.adviceFormat ?? 'text',
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
      adviceFormat,
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
              <span>Pick your mentor</span>
            </label>
            <div className="options-grid two-col">
              {LEVEL_OPTIONS.map((opt) => {
                const mascotLevel =
                  opt.value === 'auto' ? 'beginner' : opt.value
                return (
                  <button
                    type="button"
                    key={opt.value}
                    className={`choice-card level-choice ${level === opt.value ? 'selected' : ''}`}
                    onClick={() => setLevel(opt.value)}
                  >
                    {opt.value === 'auto' ? (
                      <AutoMentorSprite />
                    ) : (
                      <NibbleSprite
                        size="medium"
                        mascot={mascotForLevel(mascotLevel)}
                      />
                    )}
                    <div className="choice-header">
                      <strong>
                        {opt.value === 'auto'
                          ? 'Auto'
                          : mascotName(mascotForLevel(mascotLevel))}
                      </strong>
                      <span className="choice-tag">{opt.badge}</span>
                    </div>
                    <p>
                      {opt.label} · {opt.desc}
                    </p>
                  </button>
                )
              })}
            </div>
          </section>

          {/* Question 2: Feedback Style */}
          <section className="onboarding-section">
            <label className="onboarding-label">
              <span className="step-num">2</span>
              <span>How should your mentor help?</span>
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
              <span>What do you want to do today?</span>
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
              <span>How should they sound?</span>
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

          <section className="onboarding-section">
            <label className="onboarding-label">
              <span className="step-num">5</span>
              <span>How should examples look?</span>
            </label>
            <div className="options-grid three-col">
              {ADVICE_FORMAT_OPTIONS.map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  className={`choice-card ${adviceFormat === opt.value ? 'selected' : ''}`}
                  onClick={() => setAdviceFormat(opt.value)}
                >
                  <div className="choice-header">
                    <strong>{opt.label}</strong>
                  </div>
                  <p>{opt.desc}</p>
                </button>
              ))}
            </div>
          </section>

          {/* Optional notes */}
          <section className="onboarding-section">
            <label className="onboarding-label" htmlFor="custom-notes-input">
              <span className="step-num">6</span>
              <span>Anything else? (Optional)</span>
            </label>
            <input
              id="custom-notes-input"
              type="text"
              className="onboarding-input"
              placeholder="e.g. Give me small hints first"
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
