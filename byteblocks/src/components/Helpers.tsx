import { Icon } from './Icon'
import { estimateComplexity } from './complexity'
import { CHALLENGES } from './challenges'
import type { ChallengeId } from './challenges'

export function GoalPanel({
  selected,
  onSelect,
}: {
  selected: ChallengeId
  onSelect: (challenge: ChallengeId) => void
}) {
  const challenge = CHALLENGES[selected]
  return (
    <div className="goal-content">
      <label className="challenge-picker">
        PRACTICE QUESTION
        <select
          value={selected}
          onChange={(event) => onSelect(event.target.value as ChallengeId)}
          aria-label="Choose a practice question"
        >
          {Object.entries(CHALLENGES).map(([id, item]) => (
            <option key={id} value={id}>
              {item.title}
            </option>
          ))}
        </select>
      </label>
      <div className="eyebrow">
        <span className="eyebrow-line" /> YOUR NEXT CHALLENGE{' '}
        <span className="problem-number">
          {String(Object.keys(CHALLENGES).indexOf(selected) + 1).padStart(
            2,
            '0',
          )}{' '}
          / {challenge.category}
        </span>
      </div>
      <div className="challenge-heading">
        <h1>
          {challenge.title}
          <span>.</span>
        </h1>
        <span className="difficulty">{challenge.difficulty}</span>
      </div>
      <p className="goal-description">{challenge.summary}</p>
      <p className="goal-detail">{challenge.detail}</p>
      <div className="example-card">
        <div className="example-label">
          EXAMPLE 01 <Icon name="arrow" size={14} />
        </div>
        <div className="example-row">
          <span>Input</span>
          <code>{challenge.input}</code>
        </div>
        <div className="example-row">
          <span>Output</span>
          <code className="example-result">{challenge.output}</code>
        </div>
        <p>{challenge.note}</p>
      </div>
    </div>
  )
}

export function ComplexityPanel({ code }: { code: string }) {
  const estimate = estimateComplexity(code)
  return (
    <div className="helper-content">
      <div className="section-heading">
        <div>
          <p className="eyebrow">UNDERSTAND THE TRADEOFF</p>
          <h2>Complexity estimate</h2>
        </div>
        <span className="sample-badge">Estimate</span>
      </div>
      <p className="muted">
        Based on the current Python code. This simple estimate treats
        input-dependent loops as linear and may miss hidden work, recursion, and
        allocations.
      </p>
      <div className="complexity-stats">
        <div>
          <span>TIME COMPLEXITY</span>
          <strong>{estimate.time}</strong>
          <p>{estimate.timeDetail}</p>
        </div>
        <div>
          <span>SPACE COMPLEXITY</span>
          <strong>{estimate.space}</strong>
          <p>{estimate.spaceDetail}</p>
        </div>
      </div>
    </div>
  )
}
