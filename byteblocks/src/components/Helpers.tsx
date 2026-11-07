import { Icon } from './Icon'
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

export function ComplexityPanel() {
  return (
    <div className="helper-content">
      <div className="section-heading">
        <div>
          <p className="eyebrow">UNDERSTAND THE TRADEOFF</p>
          <h2>A little memory. A lot less work.</h2>
        </div>
        <span className="sample-badge">Example</span>
      </div>
      <p className="muted">
        Illustration of the supplied Two Sum solution. This is not an analysis
        of your current code.
      </p>
      <div className="complexity-stats">
        <div>
          <span>TIME COMPLEXITY</span>
          <strong>O(n)</strong>
          <p>One pass through the array</p>
        </div>
        <div>
          <span>SPACE COMPLEXITY</span>
          <strong>O(n)</strong>
          <p>A map of numbers seen</p>
        </div>
      </div>
      <div
        className="chart"
        role="img"
        aria-label="Illustrative graph comparing linear hash-map work with quadratic nested-loop work"
      >
        <svg viewBox="0 0 500 140" preserveAspectRatio="none">
          <path className="chart-grid" d="M35 15V115H480M35 65H480M35 15H480" />
          <path className="chart-slow" d="M35 115Q290 115 460 15" />
          <path className="chart-fast" d="M35 115L460 75" />
          <text x="400" y="38">
            O(n²)
          </text>
          <text className="fast-label" x="437" y="100">
            O(n)
          </text>
        </svg>
        <div className="chart-caption">
          <span>Fewer items</span>
          <span>More items →</span>
        </div>
      </div>
    </div>
  )
}
