import { ThemeToggle } from './ThemeToggle'
import { useCallback, useEffect, useRef, useState } from 'react'
import { VisualBlockEditor } from './blocks/VisualBlockEditor'
import type { BlockItem } from './blocks/types'
import { CoachPanel } from './CoachPanel'
import type { CoachHandle } from './CoachPanel'
import { Divider } from './Divider'
import { GoalPanel, ComplexityPanel } from './Helpers'
import { ExecutionVisualizer } from './ExecutionVisualizer'
import { CHALLENGES } from './challenges'
import { buildTestProgram, getChallengeTests } from './challengeTests'
import type { TestResult } from './challengeTests'
import { Icon } from './Icon'
import { AuthNav } from './AuthNav'
import { usePythonRunner } from '../python/usePythonRunner'
import { STARTER_CODE } from '../starter'
import type { UserPreferences } from '../preferences'

interface WorkspaceProps {
  onNavigateHome: () => void
  onOpenPreferences: () => void
  preferences: UserPreferences | null
}

type HelperTab = 'Goal' | 'Complexity' | 'Visualizer' | 'Output'
const STORAGE_KEY = 'byteblocks.main.py'
const EDITOR_MODE_KEY = 'byteblocks.editor.mode'
type Progress = { stage: number; bonus: boolean; complete: boolean }
const PROGRESS_KEY = 'byteblocks.challenge-progress.v1'
const initialProgress = (): Progress[] => {
  try {
    const saved: unknown = JSON.parse(
      localStorage.getItem(PROGRESS_KEY) ?? 'null',
    )
    if (
      Array.isArray(saved) &&
      saved.length === CHALLENGES.length &&
      saved.every(
        (item, i) =>
          item &&
          Number.isInteger(item.stage) &&
          item.stage >= 0 &&
          item.stage < CHALLENGES[i].stages.length &&
          typeof item.bonus === 'boolean' &&
          typeof item.complete === 'boolean',
      )
    )
      return saved as Progress[]
  } catch {
    /* Start fresh when storage is unavailable or invalid. */
  }
  return CHALLENGES.map(() => ({ stage: 0, bonus: false, complete: false }))
}

const TABS: HelperTab[] = ['Goal', 'Complexity', 'Visualizer', 'Output']

function readCode() {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? STARTER_CODE
  } catch {
    return STARTER_CODE
  }
}

function readEditorMode(): 'blocks' | 'code' {
  try {
    const mode = localStorage.getItem(EDITOR_MODE_KEY)
    if (mode === 'blocks' || mode === 'code') return mode
    // Existing saved source must not be overwritten by the initial blocks.
    return localStorage.getItem(STORAGE_KEY) === null ? 'blocks' : 'code'
  } catch {
    return 'blocks'
  }
}

export function Workspace({
  onNavigateHome,
  onOpenPreferences,
  preferences,
}: WorkspaceProps) {
  const [code, setCode] = useState(readCode)
  const [editorTab, setEditorTab] = useState(readEditorMode)
  const [hasCodeEdits, setHasCodeEdits] = useState(false)
  const selectEditorTab = (mode: 'blocks' | 'code') => {
    if (mode === 'blocks' && editorTab === 'code' && hasCodeEdits) {
      const confirmed = window.confirm(
        'Switching back to blocks will replace your code edits with the generated code. Continue?',
      )
      if (!confirmed) return
    }
    setEditorTab(mode)
    if (mode === 'blocks') setHasCodeEdits(false)
    try {
      localStorage.setItem('byteblocks.editor.mode', mode)
    } catch {
      /* Storage is optional. */
    }
  }
  const [saved, setSaved] = useState<'saved' | 'saving' | 'unavailable'>(
    'saving',
  )
  const [activeTab, setActiveTab] = useState<HelperTab>('Visualizer')
  const [traceStep, setTraceStep] = useState(0)
  const [progress, setProgress] = useState(initialProgress)
  const unlocked = Math.min(
    progress.findIndex((item) => !item.complete) === -1
      ? CHALLENGES.length - 1
      : progress.findIndex((item) => !item.complete),
    CHALLENGES.length - 1,
  )
  const [challenge, setChallenge] = useState(() => {
    const first = progress.findIndex((item) => !item.complete)
    return first === -1 ? CHALLENGES.length - 1 : first
  })
  const coachRef = useRef<CoachHandle>(null)
  const [coachBusy, setCoachBusy] = useState(false)
  const [coachUnavailable, setCoachUnavailable] = useState(false)
  const onAvailability = useCallback(
    (isBusy: boolean, unavailable: boolean) => {
      setCoachBusy(isBusy)
      setCoachUnavailable(unavailable)
    },
    [],
  )
  const currentProgress = progress[challenge]
  const currentChallenge = CHALLENGES[challenge]
  const currentTask = currentProgress.bonus
    ? currentChallenge.bonus
    : currentChallenge.stages[currentProgress.stage]
  const [checkAttempts, setCheckAttempts] = useState<number[]>(() => {
    try {
      const saved: unknown = JSON.parse(
        localStorage.getItem('byteblocks.challenge-attempts.v1') ?? 'null',
      )
      if (
        Array.isArray(saved) &&
        saved.length === CHALLENGES.length &&
        saved.every((value) => Number.isInteger(value) && value >= 0)
      )
        return saved as number[]
    } catch {
      /* Attempt history is optional. */
    }
    return CHALLENGES.map(() => 0)
  })
  useEffect(() => {
    try {
      localStorage.setItem(
        'byteblocks.challenge-attempts.v1',
        JSON.stringify(checkAttempts),
      )
    } catch {
      /* Continue without persistence. */
    }
  }, [checkAttempts])
  const [stageScrollKey, setStageScrollKey] = useState(0)
  const [testResults, setTestResults] = useState<TestResult[] | null>(null)
  const [testError, setTestError] = useState('')
  const [testedCode, setTestedCode] = useState('')
  const testRunner = usePythonRunner()
  const testBusy =
    testRunner.status === 'loading' || testRunner.status === 'running'
  const testRequest = useRef<{
    program: string
    source: string
    challenge: number
    stage: number
    bonus: boolean
  } | null>(null)
  const passed =
    testResults?.length === 15 &&
    testResults.every((result) => result.passed) &&
    testedCode === code
  const suite = getChallengeTests(
    currentChallenge.id,
    currentProgress.stage,
    currentProgress.bonus,
  )
  const checkWork = () => {
    if (testBusy) return
    setCheckAttempts((previous) =>
      previous.map((count, index) => (index === challenge ? count + 1 : count)),
    )
    const program = buildTestProgram(
      code,
      currentChallenge.id,
      currentProgress.stage,
      currentProgress.bonus,
    )
    testRequest.current = {
      program,
      source: code,
      challenge,
      stage: currentProgress.stage,
      bonus: currentProgress.bonus,
    }
    setTestResults(null)
    setTestError('')
    void testRunner.run(program)
  }
  // Synchronize the asynchronous sandbox result with the submitted stage.
  /* oxlint-disable react/set-state-in-effect */
  useEffect(() => {
    const request = testRequest.current
    if (
      !request ||
      testRunner.source !== request.program ||
      !['success', 'error', 'stopped'].includes(testRunner.status)
    )
      return
    testRequest.current = null
    if (
      request.challenge !== challenge ||
      request.stage !== currentProgress.stage ||
      request.bonus !== currentProgress.bonus
    )
      return
    const text = testRunner.output.map((entry) => entry.text).join('')
    const matches = [...text.matchAll(/BYTEBLOCKS_TEST_RESULTS:(\[[^\n]*\])/g)]
    try {
      const parsed: unknown = JSON.parse(matches.at(-1)?.[1] ?? 'null')
      if (
        testRunner.status !== 'success' ||
        !Array.isArray(parsed) ||
        parsed.length !== 15 ||
        !parsed.every(
          (item) =>
            item &&
            typeof item === 'object' &&
            typeof item.passed === 'boolean' &&
            (typeof item.actual === 'string' || item.actual === null),
        )
      )
        throw new Error()
      setTestResults(parsed as TestResult[])
      setTestedCode(request.source)
    } catch {
      setTestError(
        'Could not run the checks. Check your code for errors or an infinite loop, then try again.',
      )
    }
  }, [
    testRunner.status,
    testRunner.source,
    testRunner.output,
    challenge,
    currentProgress.stage,
    currentProgress.bonus,
  ])
  /* oxlint-enable react/set-state-in-effect */
  const continueChallenge = () => {
    if (!passed) return
    if (
      !currentProgress.bonus &&
      currentProgress.stage < currentChallenge.stages.length - 1
    )
      setStageScrollKey((key) => key + 1)
    setProgress((previous) =>
      previous.map((item, index) => {
        if (index !== challenge || item.complete) return item
        if (!item.bonus && item.stage < currentChallenge.stages.length - 1)
          return { ...item, stage: item.stage + 1 }
        return { ...item, complete: true }
      }),
    )
    setTestResults(null)
  }
  const onAssessment = (result: 'advance' | 'bonus' | 'skip') => {
    if (
      result !== 'bonus' ||
      !passed ||
      currentProgress.bonus ||
      currentProgress.stage !== currentChallenge.stages.length - 1
    )
      return
    setStageScrollKey((key) => key + 1)
    setProgress((previous) =>
      previous.map((item, index) =>
        index === challenge && !item.complete ? { ...item, bonus: true } : item,
      ),
    )
    setTestResults(null)
  }
  useEffect(() => {
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress))
    } catch {
      /* Progress remains available for this session. */
    }
  }, [progress])
  const [columnSplit, setColumnSplit] = useState(100 / 1.5)
  const [rowSplit, setRowSplit] = useState(50)
  const [cursor, setCursor] = useState({ lineNumber: 1, column: 1 })
  const [blocks, setBlocks] = useState<BlockItem[]>([])
  const outputEnd = useRef<HTMLDivElement>(null)
  const runner = usePythonRunner()
  const busy = runner.status === 'loading' || runner.status === 'running'

  useEffect(() => {
    try {
      localStorage.setItem(EDITOR_MODE_KEY, editorTab)
    } catch {
      // Editor mode can still be switched when storage is unavailable.
    }
  }, [editorTab])

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, code)
        setSaved('saved')
      } catch {
        setSaved('unavailable')
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [code])

  useEffect(() => {
    if (activeTab === 'Output')
      outputEnd.current?.scrollIntoView({ block: 'nearest' })
  }, [runner.output, activeTab])

  const updateCode = useCallback((nextCode: string) => {
    setCode(nextCode)
    setSaved('saving')
  }, [])

  const run = () => {
    setActiveTab('Output')
    setTraceStep(0)
    void runner.run(code)
  }

  const visualize = () => {
    setTraceStep(0)
    void runner.run(code)
  }
  const highlightedLine =
    activeTab === 'Visualizer' && runner.source === code
      ? runner.trace.steps[traceStep]?.line
      : undefined

  return (
    <div className="app-shell">
      <header className="app-header">
        <button
          type="button"
          className="brand brand-btn"
          onClick={onNavigateHome}
          title="Return to Home"
        >
          <span className="brand-symbol">
            <i />
            <i />
            <i />
          </span>
          ByteBlocks<span className="brand-dot">.</span>
        </button>
        <span className="header-divider" />
        <span className="workspace-label">
          Practice space <b> / 01</b>
        </span>

        {preferences && (
          <button
            type="button"
            className="ai-pref-badge"
            onClick={onOpenPreferences}
            title="Click to update AI Coach Calibration"
          >
            <Icon name="sparkle" size={13} />
            <span>
              {preferences.level.charAt(0).toUpperCase() +
                preferences.level.slice(1)}{' '}
              • {preferences.feedbackStyle}
            </span>
            <span className="edit-pill">Edit</span>
          </button>
        )}

        <div className="header-right">
          <ThemeToggle />
          <span className="private-label">
            <Icon name="shield" size={14} /> Runs in your browser
          </span>
          <AuthNav />
        </div>
      </header>

      <main
        className="workspace"
        style={{
          gridTemplateColumns: `minmax(0, ${columnSplit}fr) 8px minmax(0, ${100 - columnSplit}fr)`,
        }}
      >
        <section className="panel editor-panel" aria-label="Python code editor">
          <div className="panel-toolbar editor-toolbar">
            <div className="workspace-section-label">
              <span /> BUILD YOUR PROGRAM
            </div>
            <div className="editor-actions">
              <span className="language-label">Python 3</span>
              <button
                className={`run-button ${busy ? 'stop-button' : ''}`}
                onClick={busy ? runner.stop : run}
                disabled={!code.trim() && !busy}
                title={busy ? 'Stop execution' : 'Run code (Ctrl/⌘ + Enter)'}
              >
                <Icon name={busy ? 'stop' : 'play'} size={14} />
                <span>{busy ? 'Stop' : 'Run code'}</span>
                {!busy && <kbd>⌘ ↵</kbd>}
              </button>
            </div>
          </div>
          <VisualBlockEditor
            mode={editorTab}
            highlightedLine={highlightedLine}
            code={code}
            onSelectMode={selectEditorTab}
            onPythonChange={updateCode}
            onBlocksChange={setBlocks}
            onEditCode={(nextCode) => {
              updateCode(nextCode)
              setHasCodeEdits(true)
            }}
            onCursorChange={setCursor}
            onRun={run}
          />
          <footer className="editor-footer">
            <span className={saved === 'unavailable' ? 'save-warning' : ''}>
              <Icon
                name={
                  saved === 'saved'
                    ? 'check'
                    : saved === 'saving'
                      ? 'clock'
                      : 'info'
                }
                size={12}
              />
              {saved === 'saved'
                ? 'Saved locally'
                : saved === 'saving'
                  ? 'Saving…'
                  : 'Autosave unavailable'}
            </span>
            <div>
              <span>
                Ln {cursor.lineNumber}, Col {cursor.column}
              </span>
              <span>Spaces: 4</span>
              <span>UTF-8</span>
            </div>
          </footer>
        </section>

        <Divider
          direction="vertical"
          value={columnSplit}
          onChange={setColumnSplit}
        />

        <div
          className="right-workspace"
          style={{
            gridTemplateRows: `minmax(0, ${rowSplit}fr) 8px minmax(0, ${100 - rowSplit}fr)`,
          }}
        >
          <section className="panel helpers-panel" aria-label="Coding helpers">
            <div className="panel-toolbar helper-toolbar">
              <div
                className="helper-tabs"
                role="tablist"
                aria-label="Coding helpers"
              >
                {TABS.map((tab) => (
                  <button
                    key={tab}
                    role="tab"
                    id={`tab-${tab}`}
                    aria-controls={`panel-${tab}`}
                    aria-selected={activeTab === tab}
                    tabIndex={activeTab === tab ? 0 : -1}
                    className={activeTab === tab ? 'active' : ''}
                    onClick={() => setActiveTab(tab)}
                    onKeyDown={(event) => {
                      const index = TABS.indexOf(tab)
                      const next =
                        event.key === 'ArrowRight'
                          ? TABS[(index + 1) % TABS.length]
                          : event.key === 'ArrowLeft'
                            ? TABS[(index + TABS.length - 1) % TABS.length]
                            : event.key === 'Home'
                              ? TABS[0]
                              : event.key === 'End'
                                ? TABS.at(-1)
                                : undefined
                      if (next) {
                        event.preventDefault()
                        setActiveTab(next)
                        document.getElementById(`tab-${next}`)?.focus()
                      }
                    }}
                  >
                    <Icon
                      name={
                        tab === 'Goal'
                          ? 'flag'
                          : tab === 'Complexity'
                            ? 'chart'
                            : tab === 'Visualizer'
                              ? 'flow'
                              : 'terminal'
                      }
                      size={15}
                    />
                    <span>{tab}</span>
                    {tab === 'Output' && runner.status === 'error' && (
                      <span className="error-dot" />
                    )}
                  </button>
                ))}
              </div>
            </div>
            <div
              className={`helper-body ${activeTab === 'Output' ? 'output-body' : ''}`}
              role="tabpanel"
              id={`panel-${activeTab}`}
              aria-labelledby={`tab-${activeTab}`}
              tabIndex={0}
            >
              {activeTab === 'Goal' && (
                <GoalPanel
                  selected={challenge}
                  scrollKey={stageScrollKey}
                  unlocked={unlocked}
                  stage={currentProgress.stage}
                  bonus={currentProgress.bonus}
                  complete={currentProgress.complete}
                  onSelect={(index) => {
                    if (!coachBusy && !testBusy) {
                      setChallenge(index)
                      setTestResults(null)
                      setTestError('')
                    }
                  }}
                  onCheck={checkWork}
                  checking={testBusy}
                  cases={suite.cases}
                  results={testedCode === code ? testResults : null}
                  testError={testError}
                  passed={!!passed}
                  onContinue={continueChallenge}
                  onFeedback={() => coachRef.current?.checkWork()}
                  feedbackBusy={coachBusy}
                  unavailable={coachUnavailable}
                />
              )}
              {activeTab === 'Complexity' && <ComplexityPanel code={code} />}
              {activeTab === 'Visualizer' && (
                <ExecutionVisualizer
                  runner={runner}
                  code={code}
                  stepIndex={traceStep}
                  onStepChange={setTraceStep}
                  onRecord={visualize}
                  onStop={runner.stop}
                />
              )}
              {activeTab === 'Output' && (
                <>
                  <div className="output-toolbar">
                    <span
                      className={`execution-status status-${runner.status}`}
                    >
                      <span
                        className={busy ? 'status-dot pulsing' : 'status-dot'}
                      />
                      {runner.status === 'idle'
                        ? 'Ready when you are'
                        : runner.status === 'loading'
                          ? 'Preparing Python…'
                          : runner.status === 'running'
                            ? 'Running main.py…'
                            : runner.status === 'success'
                              ? 'Execution complete'
                              : runner.status === 'stopped'
                                ? 'Execution stopped'
                                : 'Execution failed'}
                    </span>
                    <div>
                      {runner.duration !== null && (
                        <span className="execution-time">
                          {runner.duration < 1000
                            ? `${runner.duration} ms`
                            : `${(runner.duration / 1000).toFixed(2)} s`}
                        </span>
                      )}
                      <button
                        className="icon-button"
                        aria-label="Clear output"
                        onClick={runner.clear}
                        disabled={busy}
                      >
                        <Icon name="clear" size={15} />
                      </button>
                    </div>
                  </div>
                  {runner.output.length === 0 && !busy ? (
                    <div className="output-empty">
                      <div className="empty-icon">
                        <Icon name="terminal" size={24} />
                      </div>
                      <h2>A space for your results.</h2>
                      <p>Run your code to see output and errors here.</p>
                      <span>Ctrl / ⌘ + Enter to run</span>
                    </div>
                  ) : (
                    <div
                      className="output-lines"
                      role="log"
                      aria-label="Python output"
                      aria-live="polite"
                    >
                      {runner.output.map((line, index) => (
                        <pre key={index} className={`output-${line.kind}`}>
                          {line.text}
                        </pre>
                      ))}
                      {busy && <span className="terminal-cursor" />}
                      <div ref={outputEnd} />
                    </div>
                  )}
                </>
              )}
            </div>
          </section>

          <Divider
            direction="horizontal"
            value={rowSplit}
            onChange={setRowSplit}
          />

          <CoachPanel
            key={challenge}
            coachRef={coachRef}
            onAssessment={onAssessment}
            onAvailability={onAvailability}
            context={{
              code,
              execution: { status: runner.status, output: runner.output },
              preferences,
              blocks,
              problem: `${currentChallenge.title} — ${currentTask.title}: ${currentTask.detail} Example: ${currentTask.input} → ${currentTask.output}`,
              testSummary: passed
                ? `All 15 test cases passed. The learner has run checks ${checkAttempts[challenge]} time(s) on this challenge across its stages.`
                : undefined,
              progression: {
                finalStage:
                  currentProgress.stage === currentChallenge.stages.length - 1,
                bonus: currentProgress.bonus,
              },
            }}
          />
        </div>
      </main>
    </div>
  )
}
