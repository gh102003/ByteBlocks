import { useId } from 'react'
import Markdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
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

function ComplexityValue({ value }: { value: string }) {
  if (value === 'Unknown') return <>Unknown</>
  return (
    <Markdown
      remarkPlugins={[remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={{ p: ({ children }) => <>{children}</> }}
    >
      {`$${value}$`}
    </Markdown>
  )
}

// These curves use illustrative constants: Big-O describes growth, not an
// exact running time or memory use. All curves share the same plot axes.
const referenceCurves = [
  { label: 'O(1)', height: (_n: number) => 0.1 },
  {
    label: 'O(log n)',
    height: (n: number) => (0.3 * Math.log(n)) / Math.log(10),
  },
  { label: 'O(n)', height: (n: number) => (0.78 * n) / 10 },
  {
    label: 'O(n log n)',
    height: (n: number) => (1.1 * (n / 10) * Math.log(n)) / Math.log(10),
  },
  { label: 'O(n^2)', height: (n: number) => 1.6 * (n / 10) ** 2 },
  { label: 'O(n^3)', height: (n: number) => 3 * (n / 10) ** 3 },
]

function ComplexityGraph({ title, value }: { title: string; value: string }) {
  const clipId = useId()
  const power = /^O\(n\^(\d+)\)$/.exec(value)
  const exponent = power ? Number(power[1]) : 0
  const curves = [...referenceCurves]
  if (power && !curves.some((curve) => curve.label === value)) {
    const factor = 3 * 1.5 ** Math.min(20, Math.max(0, exponent - 3))
    curves.push({ label: value, height: (n) => factor * (n / 10) ** exponent })
  }
  function path(height: (n: number) => number) {
    return Array.from({ length: 101 }, (_, i) => {
      const x = i / 100
      return `${i === 0 ? 'M' : 'L'}${24 + 278 * x} ${142 - 128 * height(1 + 9 * x)}`
    }).join(' ')
  }
  return (
    <div className="complexity-graph">
      <h3>{title} growth</h3>
      <div
        className="chart"
        role="img"
        aria-label={`${title} complexity: ${value}. Illustrative growth curves on shared linear axes. Input size starts at 1 and increases to the right and ${title.toLowerCase()} grows upward.`}
      >
        <svg
          viewBox="0 0 320 160"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <clipPath id={clipId}>
              <rect x="24" y="14" width="278" height="128" />
            </clipPath>
          </defs>
          <g clipPath={`url(#${clipId})`}>
            {curves
              .filter((curve) => curve.label !== value)
              .map((curve) => (
                <path
                  key={curve.label}
                  data-complexity={curve.label}
                  className="chart-reference"
                  d={path(curve.height)}
                />
              ))}
            {curves
              .filter((curve) => curve.label === value)
              .map((curve) => (
                <path
                  key={curve.label}
                  data-complexity={curve.label}
                  className="chart-highlight"
                  d={path(curve.height)}
                />
              ))}
          </g>
          <path className="chart-axis" d="M24 14V142H302" />
        </svg>
      </div>
      {value === 'Unknown' && (
        <p className="complexity-graph-note">
          Unknown estimate — no curve highlighted.
        </p>
      )}
    </div>
  )
}

export function ComplexityPanel({ code }: { code: string }) {
  const estimate = estimateComplexity(code)
  return (
    <div className="helper-content">
      <div className="section-heading">
        <h2>Complexity estimate</h2>
      </div>
      <p className="muted">
        Based on the current Python code. This simple estimate treats
        input-dependent loops as linear and may miss hidden work, recursion, and
        allocations.
      </p>
      <div className="complexity-stats">
        <div>
          <span>TIME COMPLEXITY</span>
          <strong>
            <ComplexityValue value={estimate.time} />
          </strong>
          <p>{estimate.timeDetail}</p>
        </div>
        <div>
          <span>SPACE COMPLEXITY</span>
          <strong>
            <ComplexityValue value={estimate.space} />
          </strong>
          <p>{estimate.spaceDetail}</p>
        </div>
      </div>
      <div className="complexity-graphs">
        <ComplexityGraph title="Time" value={estimate.time} />
        <ComplexityGraph title="Space" value={estimate.space} />
      </div>
    </div>
  )
}
