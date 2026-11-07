import { useEffect, useRef, useState } from 'react'
import { CoachPanel } from './components/CoachPanel'
import { CodeEditor } from './components/CodeEditor'
import { Divider } from './components/Divider'
import { GoalPanel, ComplexityPanel, DataflowPanel } from './components/Helpers'
import { Icon } from './components/Icon'
import { usePythonRunner } from './python/usePythonRunner'
import { STARTER_CODE } from './starter'
import './App.css'

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

function App() {
  const [code, setCode] = useState(readCode)
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
        <a className="brand" href="./" aria-label="ByteBlocks home">
          <span className="brand-symbol">
            <i />
            <i />
            <i />
          </span>
          ByteBlocks<span className="brand-dot">.</span>
        </a>
        <span className="header-divider" />
        <span className="workspace-label">Practice workspace</span>
        <div className="header-right">
          <span className="private-label">
            <Icon name="shield" size={14} /> Runs in your browser
          </span>
          <span className="avatar">YOU</span>
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
            <div className="file-tab">
              <span className="python-icon">Py</span>
              <span>main.py</span>
              <span
                className="file-dot"
                title={saved === 'saved' ? 'Saved locally' : 'Saving changes'}
              />
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
            <span>main.py</span>
          </div>
          <CodeEditor
            value={code}
            onChange={(next) => {
              setCode(next)
              setSaved('saving')
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

export default App
