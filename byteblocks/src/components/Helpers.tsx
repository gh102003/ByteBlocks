import { useEffect, useRef } from 'react'
import { Icon } from './Icon'
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
