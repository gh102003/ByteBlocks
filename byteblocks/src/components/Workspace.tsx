import { ThemeToggle } from './ThemeToggle'
import { useEffect, useRef, useState } from 'react'
import { CodeEditor } from './CodeEditor'
import { VisualBlockEditor } from './blocks/VisualBlockEditor'
import { CoachPanel } from './CoachPanel'
import { Divider } from './Divider'
import { GoalPanel, ComplexityPanel, DataflowPanel } from './Helpers'
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

type HelperTab = 'Goal' | 'Complexity' | 'Dataflow' | 'Output'
const STORAGE_KEY = 'byteblocks.main.py'
const TABS: HelperTab[] = ['Goal', 'Complexity', 'Dataflow', 'Output']

function readCode() {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? STARTER_CODE
  } catch {
    return STARTER_CODE
  }
}

export function Workspace({
  onNavigateHome,
  onOpenPreferences,
  preferences,
}: WorkspaceProps) {
  const [code, setCode] = useState(readCode)
  const [editorTab, setEditorTab] = useState<'blocks' | 'code'>('blocks')
  const [saved, setSaved] = useState<'saved' | 'saving' | 'unavailable'>(
    'saving',
  )
  const [activeTab, setActiveTab] = useState<HelperTab>('Goal')
  const [columnSplit, setColumnSplit] = useState(50)
  const [rowSplit, setRowSplit] = useState(50)
  const [cursor, setCursor] = useState({ lineNumber: 1, column: 1 })
  const outputEnd = useRef<HTMLDivElement>(null)
  const runner = usePythonRunner()
  const busy = runner.status === 'loading' || runner.status === 'running'

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

  const run = () => {
    setActiveTab('Output')
    void runner.run(code)
  }

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
        <span className="workspace-label">Practice workspace</span>

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
            <div
              className="editor-mode-nav"
              role="tablist"
              aria-label="Editor modes"
            >
              <button
                type="button"
                role="tab"
                aria-selected={editorTab === 'blocks'}
                className={`editor-nav-tab ${editorTab === 'blocks' ? 'active' : ''}`}
                onClick={() => setEditorTab('blocks')}
                title="Visual Scratch Chunks Builder"
              >
                <Icon name="puzzle" size={13} />
                <span>Visual Blocks</span>
                <span className="tab-pill">Scratch</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={editorTab === 'code'}
                className={`editor-nav-tab ${editorTab === 'code' ? 'active' : ''}`}
                onClick={() => setEditorTab('code')}
                title="Python Source Code"
              >
                <span className="python-icon">Py</span>
                <span>main.py</span>
                <span
                  className="file-dot"
                  title={saved === 'saved' ? 'Saved locally' : 'Saving changes'}
                />
              </button>
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
          <div className="editor-breadcrumb">
            <span>workspace</span>
            <Icon name="chevron" size={12} />
            <span>
              {editorTab === 'blocks' ? 'Visual Scratch Chunks' : 'main.py'}
            </span>
          </div>
          {editorTab === 'blocks' ? (
            <VisualBlockEditor
              onPythonChange={(nextCode) => {
                setCode(nextCode)
                setSaved('saving')
              }}
              onRun={run}
            />
          ) : (
            <CodeEditor
              value={code}
              onChange={(next) => {
                setCode(next)
                setSaved('saving')
              }}
              onCursorChange={setCursor}
              onRun={run}
            />
          )}
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
                            : tab === 'Dataflow'
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
              {activeTab === 'Goal' && <GoalPanel />}
              {activeTab === 'Complexity' && <ComplexityPanel />}
              {activeTab === 'Dataflow' && <DataflowPanel />}
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
            context={{
              code,
              execution: { status: runner.status, output: runner.output },
              preferences,
            }}
          />
        </div>
      </main>
      <footer className="app-footer">
        <span>
          <span className="tiny-dot" /> YOUR SPACE TO THINK IN CODE
        </span>
        <span>
          One problem. One step at a time.
          <span className="footer-spark">✳</span>
        </span>
      </footer>
    </div>
  )
}
