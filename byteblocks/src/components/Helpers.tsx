import { Icon } from './Icon'
import type { ReactNode } from 'react'

export type ChallengeId = 'two-sum' | 'bubble-sort' | 'binary-search'

export const CHALLENGES: Record<ChallengeId, { title: string; category: string; difficulty: string; summary: string; coachPrompt: string; detail: ReactNode; input: string; output: string; note: string }> = {
  'two-sum': { title: 'Two Sum', category: 'ARRAYS', difficulty: 'Easy', summary: 'Find the two numbers that add up to a target.', coachPrompt: 'Given integers nums and target, return the indices of two distinct elements whose sum is target. Exactly one solution exists.', detail: <>Given an array of integers <code>nums</code> and an integer <code>target</code>, return the <strong>indices</strong> of the two numbers whose sum equals the target.</>, input: 'nums = [2, 7, 11, 15], target = 9', output: '[0, 1]', note: 'Exactly one solution exists. You can’t use the same element twice.' },
  'bubble-sort': { title: 'Bubble Sort', category: 'SORTING', difficulty: 'Medium', summary: 'Sort a list in place by repeatedly swapping adjacent values.', coachPrompt: 'Implement bubble_sort(nums) to sort integers in ascending order. Optimize by stopping after a pass with no swaps.', detail: <>Implement <code>bubble_sort(nums)</code> to sort integers in ascending order. Stop early when a full pass makes no swaps, and return the sorted list.</>, input: 'nums = [5, 1, 4, 2, 8]', output: '[1, 2, 4, 5, 8]', note: 'Consider an empty list, duplicates, and how many passes are needed.' },
  'binary-search': { title: 'Binary Search', category: 'SEARCHING', difficulty: 'Medium', summary: 'Find a target in a sorted list in logarithmic time.', coachPrompt: 'Implement binary_search(nums, target) to return its index or -1 when absent. nums is sorted and the algorithm must run in O(log n) time.', detail: <>Implement <code>binary_search(nums, target)</code> to return the target’s index, or <code>-1</code> if it is absent. Your algorithm must run in <strong>O(log n)</strong> time.</>, input: 'nums = [-4, 0, 3, 9, 12], target = 9', output: '3', note: 'Maintain a correct search interval and handle empty input and missing targets.' },
}

export function GoalPanel({ selected, onSelect }: { selected: ChallengeId; onSelect: (challenge: ChallengeId) => void }) {
  const challenge = CHALLENGES[selected]
  return (
    <div className="goal-content">
      <label className="challenge-picker">PRACTICE QUESTION
        <select value={selected} onChange={(event) => onSelect(event.target.value as ChallengeId)} aria-label="Choose a practice question">
          {Object.entries(CHALLENGES).map(([id, item]) => <option key={id} value={id}>{item.title}</option>)}
        </select>
      </label>
      <div className="eyebrow">
        <span className="eyebrow-line" /> YOUR NEXT CHALLENGE{' '}
        <span className="problem-number">{String(Object.keys(CHALLENGES).indexOf(selected) + 1).padStart(2, '0')} / {challenge.category}</span>
      </div>
      <div className="challenge-heading">
        <h1>{challenge.title}<span>.</span></h1>
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
        <p>
          {challenge.note}
        </p>
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

export function DataflowPanel() {
  return (
    <div className="helper-content">
      <div className="section-heading">
        <div>
          <p className="eyebrow">FOLLOW THE VALUES</p>
          <h2>Remember. Look up. Match.</h2>
        </div>
        <span className="sample-badge">Example</span>
      </div>
      <p className="muted">
        A sample walkthrough for <code>[2, 7, 11, 15]</code> with target{' '}
        <code>9</code>. Live tracing comes later.
      </p>
      <div className="array-visual" aria-label="Example array: 2, 7, 11, 15">
        <div className="array-cell visited">
          <small>0</small>
          <strong>2</strong>
        </div>
        <div className="array-cell current">
          <small>1</small>
          <strong>7</strong>
          <span>current</span>
        </div>
        <div className="array-cell">
          <small>2</small>
          <strong>11</strong>
        </div>
        <div className="array-cell">
          <small>3</small>
          <strong>15</strong>
        </div>
      </div>
      <div className="flow-steps">
        <div>
          <span className="step-number">1</span>
          <span>Find the complement</span>
          <code>
            9 − 7 = <b>2</b>
          </code>
        </div>
        <div>
          <span className="step-number">2</span>
          <span>
            Look in <code>seen</code>
          </span>
          <code>{'{ 2: 0 }'}</code>
        </div>
        <div>
          <span className="step-number">3</span>
          <span>Match found. Return indices.</span>
          <code className="flow-result">
            [0, 1] <Icon name="check" size={13} />
          </code>
        </div>
      </div>
    </div>
  )
}
