import { useEffect, useState } from 'react'
import { Icon } from './Icon'
import {
  describeValue,
  type CollectionView,
  type TraceValue,
  type TraceVariable,
} from '../python/trace'
import type { RunnerState } from '../python/runner'
import './ExecutionVisualizer.css'

type Props = {
  runner: RunnerState
  code: string
  stepIndex: number
  onStepChange: (index: number) => void
  onRecord: () => void
  onStop: () => void
}

function Value({ value }: { value: TraceValue }) {
  const text = describeValue(value)
  return (
    <code title={text}>
      {text.length > 180 ? `${text.slice(0, 180)}…` : text}
    </code>
  )
}

function VariableCard({
  variable,
  previous,
  view,
  onViewChange,
}: {
  variable: TraceVariable
  previous?: TraceVariable
  view?: CollectionView
  onViewChange: (view: CollectionView) => void
}) {
  const { name, value } = variable
  const sequence = value.kind === 'list' || value.kind === 'deque'
  const layout = sequence
    ? (view ?? variable.view ?? (value.kind === 'deque' ? 'queue' : 'list'))
    : value.kind
  const changed = JSON.stringify(previous?.value) !== JSON.stringify(value)
  const items = value.items
  return (
    <article
      className={`trace-variable ${value.kind === 'scalar' || value.kind === 'object' ? 'trace-variable-scalar' : ''} ${changed ? 'trace-changed' : ''}`}
    >
      <header>
        <div>
          <strong>{name}</strong>
          <span className="trace-type">{value.type}</span>
          {changed && (
            <span className="trace-change-label">
              {previous ? 'changed' : 'new'}
            </span>
          )}
        </div>
        {sequence ? (
          <label className="trace-view-picker">
            <select
              aria-label={`View ${name} as`}
              value={layout}
              onChange={(event) =>
                onViewChange(event.target.value as CollectionView)
              }
            >
              <option value="list">List</option>
              <option value="stack">Stack</option>
              <option value="queue">Queue</option>
            </select>
          </label>
        ) : value.size !== undefined ? (
          <span className="trace-type">
            {value.size} {value.size === 1 ? 'item' : 'items'}
          </span>
        ) : null}
      </header>
      {items ? (
        <>
          <div className="trace-collection-caption">
            <span>
              {layout === 'stack'
                ? 'Last in, first out'
                : layout === 'queue'
                  ? 'First in, first out'
                  : layout === 'set'
                    ? 'Unordered values'
                    : 'Indexed values'}
            </span>
            <span>
              {value.size} {value.size === 1 ? 'item' : 'items'}
            </span>
          </div>
          {items.length === 0 ? (
            <div className="trace-empty-collection">Empty {layout}</div>
          ) : (
            <div
              className={`trace-cells trace-layout-${layout}`}
              aria-label={`${name}: ${layout}`}
            >
              {items.map((item, index) => (
                <div
                  key={index}
                  className={`trace-cell ${JSON.stringify(item) !== JSON.stringify(previous?.value.items?.[index]) ? 'trace-cell-changed' : ''}`}
                  style={layout === 'stack' ? { order: -index } : undefined}
                >
                  <span>{layout === 'set' ? '•' : index}</span>
                  <Value value={item} />
                  {layout === 'queue' &&
                    (index === 0 || index === (value.size ?? 0) - 1) && (
                      <small>{index === 0 ? 'front' : 'back'}</small>
                    )}
                  {layout === 'stack' && index === (value.size ?? 0) - 1 && (
                    <small>top</small>
                  )}
                </div>
              ))}
            </div>
          )}
          {(value.size ?? 0) > items.length && (
            <p className="trace-footnote">
              Showing the first {items.length} of {value.size} items.
            </p>
          )}
        </>
      ) : value.entries ? (
        value.entries.length ? (
          <div className="trace-dictionary">
            <div className="trace-dictionary-heading">
              <span>Key</span>
              <span>Value</span>
            </div>
            {value.entries.map((entry, index) => (
              <div key={index}>
                <Value value={entry.key} />
                <Value value={entry.value} />
              </div>
            ))}
            {(value.size ?? 0) > value.entries.length && (
              <p className="trace-footnote">
                Showing {value.entries.length} of {value.size} entries.
              </p>
            )}
          </div>
        ) : (
          <div className="trace-empty-collection">Empty dictionary</div>
        )
      ) : (
        <div className="trace-scalar">
          <Value value={value} />
        </div>
      )}
    </article>
  )
}

export function ExecutionVisualizer({
  runner,
  code,
  stepIndex,
  onStepChange,
  onRecord,
  onStop,
}: Props) {
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(700)
  const [selectedFrame, setSelectedFrame] = useState<number | null>(null)
  const [views, setViews] = useState<Record<string, CollectionView>>({})
  const { steps, truncated } = runner.trace
  const busy = runner.status === 'loading' || runner.status === 'running'
  const stale = runner.source !== null && runner.source !== code
  const canPlay = !busy && !stale && steps.length > 1
  const index = Math.min(stepIndex, Math.max(0, steps.length - 1))
  const step = steps[index]
  const frame =
    step?.frames.find((item) => item.id === selectedFrame) ??
    step?.frames.at(-1)
  const previousFrame = steps[index - 1]?.frames.find(
    (item) => item.id === frame?.id,
  )
  const lines = (runner.source ?? '').split('\n')

  useEffect(() => {
    if (!playing || !canPlay) return
    const timer = setTimeout(() => {
      if (index >= steps.length - 1) setPlaying(false)
      else onStepChange(index + 1)
    }, speed)
    return () => clearTimeout(timer)
  }, [playing, canPlay, index, steps.length, onStepChange, speed])

  const move = (next: number) => {
    setPlaying(false)
    onStepChange(next)
  }

  const recordButton = (
    <button
      type="button"
      className="trace-record"
      onClick={() => {
        setPlaying(false)
        if (busy) onStop()
        else onRecord()
      }}
      disabled={!busy && !code.trim()}
    >
      <Icon
        name={busy ? 'stop' : steps.length ? 'refresh' : 'play'}
        size={13}
      />
      {busy ? 'Stop' : steps.length ? 'Re-run' : 'Record run'}
    </button>
  )

  return (
    <div className="execution-visualizer">
      <div className="trace-session">
        {!step && (
          <div className="trace-heading">
            <div>
              <h2>Execution</h2>
              <span className="trace-recording-state">
                {busy ? 'Recording' : step ? 'Recorded' : 'No recording'}
              </span>
            </div>
            {recordButton}
          </div>
        )}
        {step && (
          <>
            <div className="trace-controls">
              <div className="trace-buttons">
                <button
                  type="button"
                  aria-label="First step"
                  title="First step"
                  disabled={busy || index === 0}
                  onClick={() => move(0)}
                >
                  <Icon name="first" size={14} />
                </button>
                <button
                  type="button"
                  aria-label="Previous step"
                  title="Previous step"
                  disabled={busy || index === 0}
                  onClick={() => move(index - 1)}
                >
                  <span className="trace-back">
                    <Icon name="chevron" size={16} />
                  </span>
                </button>
                <button
                  type="button"
                  aria-label={
                    playing && canPlay ? 'Pause playback' : 'Play steps'
                  }
                  title={playing && canPlay ? 'Pause playback' : 'Play steps'}
                  disabled={!canPlay}
                  onClick={() => {
                    if (index === steps.length - 1) onStepChange(0)
                    setPlaying(!playing)
                  }}
                >
                  <Icon
                    name={playing && canPlay ? 'pause' : 'play'}
                    size={13}
                  />
                </button>
                <button
                  type="button"
                  aria-label="Next step"
                  title="Next step"
                  disabled={busy || index === steps.length - 1}
                  onClick={() => move(index + 1)}
                >
                  <Icon name="chevron" size={16} />
                </button>
              </div>
              <span className="trace-step-count">
                <span>Step</span> {index + 1} <span>/ {steps.length}</span>
              </span>
              <select
                aria-label="Playback speed"
                value={speed}
                onChange={(event) => setSpeed(Number(event.target.value))}
              >
                <option value={1400}>0.5×</option>
                <option value={700}>1×</option>
                <option value={350}>2×</option>
              </select>
              {recordButton}
            </div>
            <input
              className="trace-scrubber"
              type="range"
              aria-label="Execution step"
              min={0}
              max={steps.length - 1}
              value={index}
              disabled={busy}
              onChange={(event) => move(Number(event.target.value))}
            />
          </>
        )}
      </div>
      {busy && (
        <p className="trace-notice" role="status">
          {runner.status === 'loading'
            ? 'Preparing Python…'
            : `Recording execution… ${steps.length} steps captured.`}
        </p>
      )}
      {stale && (
        <p className="trace-notice trace-warning">
          Code changed since this recording. Re-run to update.
        </p>
      )}
      {!step ? (
        <div className="trace-empty">
          <h3>No execution recorded</h3>
          <p>
            Record a run to inspect your variables and data structures, one line
            at a time.
          </p>
          <span>
            {runner.status === 'error'
              ? 'Execution failed before a step could be recorded. See Output for details.'
              : 'You can step backward and forward after the run.'}
          </span>
        </div>
      ) : (
        <>
          <div
            className={`trace-source ${step.event === 'exception' ? 'trace-source-error' : ''}`}
          >
            <div className="trace-source-heading">
              <span>
                {step.event === 'line'
                  ? 'Next line to execute'
                  : step.event === 'exception'
                    ? `Exception raised · ${step.exception}`
                    : step.frames.at(-1)?.name === '<module>'
                      ? runner.status === 'success'
                        ? 'Program finished'
                        : 'Program exited'
                      : 'Return / yield'}
              </span>
              <span>main.py:{step.line}</span>
            </div>
            <pre>
              <span>{step.line}</span>
              <code>{lines[step.line - 1] || '(end of program)'}</code>
            </pre>
            {step.event === 'return' &&
              step.result &&
              step.frames.at(-1)?.name !== '<module>' && (
                <div className="trace-return">
                  Result <Value value={step.result} />
                </div>
              )}
          </div>
          <div className="trace-scope">
            <label>
              Scope{' '}
              <select
                aria-label="Variable scope"
                value={frame?.id}
                onChange={(event) =>
                  setSelectedFrame(Number(event.target.value))
                }
              >
                {step.frames.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name === '<module>'
                      ? 'Global'
                      : `${item.name}() #${item.id}`}
                  </option>
                ))}
              </select>
            </label>
            <span>
              <i /> Updated this step
            </span>
          </div>
          <div className="trace-variables" aria-label="Recorded variables">
            {frame?.variables.length === 0 && (
              <p className="trace-footnote">
                No variables in this scope yet. Step forward to execute the
                highlighted line.
              </p>
            )}
            {frame?.variables.map((variable) => {
              const key = `${frame.id}:${variable.name}`
              return (
                <VariableCard
                  key={key}
                  variable={variable}
                  previous={previousFrame?.variables.find(
                    (item) => item.name === variable.name,
                  )}
                  view={views[key]}
                  onViewChange={(view) =>
                    setViews((current) => ({ ...current, [key]: view }))
                  }
                />
              )
            })}
            {previousFrame?.variables
              .filter(
                (variable) =>
                  !frame?.variables.some((item) => item.name === variable.name),
              )
              .map((variable) => (
                <p className="trace-removed" key={variable.name}>
                  <code>{variable.name}</code> removed from this scope
                </p>
              ))}
          </div>
          {truncated && (
            <p className="trace-notice trace-warning">
              Recording limit reached (600 steps or 2 MB). Showing the recorded
              portion; execution continued.
            </p>
          )}
          {!busy && runner.status !== 'success' && (
            <p className="trace-notice trace-warning">
              {runner.status === 'stopped'
                ? 'Execution was stopped.'
                : 'Execution ended with an error.'}{' '}
              Captured steps are available. See Output for details.
            </p>
          )}
        </>
      )}
    </div>
  )
}
