import { useEffect, useId, useRef } from 'react'
import Markdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { Icon } from './Icon'
import { estimateComplexity } from './complexity'
import { CHALLENGES } from './challenges'
import type { TestCase, TestResult } from './challengeTests'

function formatTestValue(value: unknown): string {
  if (value === true) return 'True'
  if (value === false) return 'False'
  if (value === null) return 'None'
  if (Array.isArray(value)) return `[${value.map(formatTestValue).join(', ')}]`
  if (typeof value === 'object')
    return `{${Object.entries(value as Record<string, unknown>)
      .map(([key, item]) => `${JSON.stringify(key)}: ${formatTestValue(item)}`)
      .join(', ')}}`
  return JSON.stringify(value) ?? String(value)
}

export function GoalPanel({
  selected,
  unlocked,
  stage,
  bonus,
  complete,
  onSelect,
  onCheck,
  checking,
  unavailable,
  cases,
  results,
  testError,
  passed,
  onContinue,
  onFeedback,
  feedbackBusy,
  scrollKey,
}: {
  selected: number
  unlocked: number
  stage: number
  bonus: boolean
  complete: boolean
  onSelect: (index: number) => void
  onCheck: () => void
  checking: boolean
  unavailable: boolean
  cases: TestCase[]
  results: TestResult[] | null
  testError: string
  passed: boolean
  onContinue: () => void
  onFeedback: () => void
  feedbackBusy: boolean
  scrollKey: number
}) {
  const challenge = CHALLENGES[selected]
  const task = bonus ? challenge.bonus : challenge.stages[stage]
  const activeStageRef = useRef<HTMLElement>(null)
  const lastScrollKey = useRef(scrollKey)
  useEffect(() => {
    if (lastScrollKey.current === scrollKey) return
    lastScrollKey.current = scrollKey
    activeStageRef.current?.scrollIntoView({
      block: 'start',
      behavior: 'smooth',
    })
  }, [scrollKey])
  const completedStages = challenge.stages.slice(
    0,
    bonus ? challenge.stages.length : stage,
  )
  return (
    <div className="goal-content">
      <div className="goal-topline">
        <div className="goal-position">
          <span>
            CHALLENGE{' '}
            <strong>
              {selected + 1} / {CHALLENGES.length}
            </strong>
          </span>
        </div>
        <label className="challenge-picker">
          <select
            value={selected}
            disabled={checking}
            onChange={(event) => onSelect(Number(event.target.value))}
            aria-label="Choose a practice question"
          >
            {CHALLENGES.map((item, index) => (
              <option key={item.id} value={index} disabled={index > unlocked}>
                {index + 1}. {item.title}
                {index > unlocked ? ' 🔒' : ''}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="goal-intro">
        <div className="challenge-heading">
          <h1>
            {challenge.title}
            <span>.</span>
          </h1>
        </div>
        <p className="goal-description">{challenge.summary}</p>
      </div>
      {completedStages.map((completedStage, index) => (
        <section
          className="goal-stage goal-stage-completed"
          aria-label={`Stage ${index + 1}, completed`}
          key={completedStage.title}
        >
          <div className="goal-stage-marker" aria-hidden="true">
            <Icon name="check" size={16} />
          </div>
          <div className="goal-stage-header">
            <h2>{completedStage.title}</h2>
            <span className="goal-stage-complete-label">Completed</span>
          </div>
          <p className="goal-detail">{completedStage.detail}</p>
        </section>
      ))}
      <section
        ref={activeStageRef}
        className="goal-stage"
        aria-label={bonus ? 'Bonus task' : `Stage ${stage + 1}`}
      >
        <div className="goal-stage-marker" aria-hidden="true">
          {complete ? (
            <Icon name="check" size={16} />
          ) : bonus ? (
            '✦'
          ) : (
            String(stage + 1).padStart(2, '0')
          )}
        </div>
        <div className="goal-stage-header">
          {complete || bonus ? (
            <div className="goal-stage-label">
              {complete ? 'CHALLENGE COMPLETE' : 'BONUS TASK'}
            </div>
          ) : (
            <h2>{task.title}</h2>
          )}
          <div
            className="goal-stage-progress"
            aria-label={
              bonus
                ? 'Bonus unlocked'
                : `Stage ${stage + 1} of ${challenge.stages.length}`
            }
          >
            {challenge.stages.map((item, index) => (
              <span
                key={item.title}
                className={index <= stage ? 'filled' : ''}
              />
            ))}
          </div>
        </div>
        {(complete || bonus) && <h2>{task.title}</h2>}
        <p className="goal-detail">{task.detail}</p>
        <div className="goal-tests">
          <div className="goal-tests-heading">
            <span>TEST CASES</span>
          </div>
          <div className="goal-test-list">
            {cases.slice(0, 5).map((testCase, index) => (
              <div className="goal-test-row" key={index}>
                <span
                  className={`goal-test-status ${results ? (results[index].passed ? 'is-pass' : 'is-fail') : ''}`}
                  aria-label={
                    results
                      ? results[index].passed
                        ? 'Passed'
                        : 'Failed'
                      : `Case ${index + 1} not yet run`
                  }
                >
                  {results ? (
                    <Icon
                      name={results[index].passed ? 'check' : 'cross'}
                      size={16}
                    />
                  ) : (
                    String(index + 1).padStart(2, '0')
                  )}
                </span>
                <div>
                  <span className="goal-test-value">
                    <span>Input</span>
                    <code>
                      {testCase.args
                        .map((arg) => JSON.stringify(arg))
                        .join(', ')}
                    </code>
                  </span>
                  <span className="goal-test-value">
                    <span>Expected</span>
                    <code>{formatTestValue(testCase.expected)}</code>
                    {challenge.id === 'two-sum' ? ' (either order)' : ''}
                  </span>
                  <span className="goal-test-value">
                    <span>Got</span>
                    <code>{results ? results[index].actual : '—'}</code>
                  </span>
                </div>
              </div>
            ))}
          </div>
          {results && (
            <p className="goal-test-summary" role="status">
              {results.slice(0, 5).filter((result) => result.passed).length} / 5
              visible passed ·{' '}
              {results.slice(5).filter((result) => result.passed).length} / 10
              hidden passed
            </p>
          )}
          {testError && (
            <p className="goal-test-summary" role="alert">
              {testError}
            </p>
          )}
        </div>
        <div className="goal-action">
          {!complete && !passed && (
            <button
              className="run-button goal-check"
              onClick={onCheck}
              disabled={checking}
            >
              {checking ? 'Running checks…' : 'Run checks'}{' '}
              <Icon name="arrow" size={14} />
            </button>
          )}
          {!complete && passed && (
            <>
              <button
                className="run-button goal-check"
                onClick={onContinue}
                disabled={feedbackBusy}
              >
                {!bonus && stage < challenge.stages.length - 1
                  ? 'Next stage'
                  : 'Complete challenge'}{' '}
                <Icon name="arrow" size={14} />
              </button>
              <button
                className="goal-feedback"
                onClick={onFeedback}
                disabled={feedbackBusy || unavailable}
              >
                {feedbackBusy ? 'Coach is thinking…' : 'Ask coach for feedback'}
              </button>
            </>
          )}
          <p className="goal-note">
            {complete
              ? selected + 1 < CHALLENGES.length
                ? 'Challenge complete. Choose the next challenge above.'
                : 'You completed all five challenges.'
              : passed
                ? unavailable
                  ? 'All checks passed. Connect the coach for optional feedback.'
                  : 'All checks passed. Feedback is optional.'
                : bonus
                  ? 'Checks cover results; ask the coach about efficiency after passing.'
                  : 'Run all 15 checks to complete this stage.'}
          </p>
        </div>
      </section>
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
