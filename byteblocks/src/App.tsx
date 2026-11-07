import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { CodeEditor } from './components/CodeEditor'
import { Divider } from './components/Divider'
import { GoalPanel, ComplexityPanel, DataflowPanel } from './components/Helpers'
import { Icon } from './components/Icon'
import { usePythonRunner } from './python/usePythonRunner'
import { STARTER_CODE } from './starter'
import './App.css'

type HelperTab = 'Goal' | 'Complexity' | 'Dataflow' | 'Output'
type Message = { role: 'coach' | 'user'; text: string }
const STORAGE_KEY = 'byteblocks.main.py'
const TABS: HelperTab[] = ['Goal', 'Complexity', 'Dataflow', 'Output']
const INITIAL_MESSAGES: Message[] = [
  {
    role: 'coach',
    text: 'Hey! Let’s work through Two Sum. You already have a solution to explore. Try running it, then think about why keeping a record of earlier numbers helps.',
  },
]

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
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES)
  const [draft, setDraft] = useState('')
  const coachEnd = useRef<HTMLDivElement>(null)
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
    coachEnd.current?.scrollIntoView({ block: 'nearest' })
  }, [messages])
  useEffect(() => {
    if (activeTab === 'Output')
      outputEnd.current?.scrollIntoView({ block: 'nearest' })
  }, [runner.output, activeTab])

  const run = () => {
    setActiveTab('Output')
    void runner.run(code)
  }
  const submitMessage = (event: FormEvent) => {
    event.preventDefault()
    if (!draft.trim()) return
    setMessages((previous) => [
      ...previous,
      { role: 'user', text: draft.trim() },
      {
        role: 'coach',
        text: 'This coach is a preview, so I can’t review your code yet. For the example solution, ask yourself: what does the seen dictionary let you avoid doing?',
      },
    ])
    setDraft('')
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

          <section className="panel coach-panel" aria-label="AI coach preview">
            <div className="panel-toolbar coach-toolbar">
              <div className="coach-title">
                <span className="coach-mark">
                  <Icon name="sparkle" size={17} />
                </span>
                <strong>AI coach</strong>
                <span className="coach-subtitle">
                  A little nudge goes a long way.
                </span>
              </div>
              <span className="sample-badge">Preview</span>
            </div>
            <div
              className="coach-messages"
              role="log"
              aria-label="Coach conversation"
              aria-live="polite"
            >
              <div className="conversation-date">
                <span />
                LET’S FIGURE IT OUT
                <span />
              </div>
              {messages.map((message, index) => (
                <div className={`message message-${message.role}`} key={index}>
                  <span
                    className={`message-avatar ${message.role === 'coach' ? 'coach-message-avatar' : ''}`}
                  >
                    {message.role === 'coach' ? (
                      <Icon name="sparkle" size={15} />
                    ) : (
                      'Y'
                    )}
                  </span>
                  <div>
                    <div className="message-label">
                      {message.role === 'coach' ? 'ByteBlocks coach' : 'You'}
                      {message.role === 'coach' && <span>DEMO</span>}
                    </div>
                    <p>{message.text}</p>
                  </div>
                </div>
              ))}
              {messages.length === 1 && (
                <div className="suggested-prompts">
                  <button
                    onClick={() => setDraft('Why use a dictionary here?')}
                  >
                    Why use a dictionary?
                    <Icon name="arrow" size={13} />
                  </button>
                  <button
                    onClick={() =>
                      setDraft('Help me understand the complexity.')
                    }
                  >
                    Explore the complexity
                    <Icon name="arrow" size={13} />
                  </button>
                </div>
              )}
              <div ref={coachEnd} />
            </div>
            <div className="coach-compose-area">
              <form className="coach-composer" onSubmit={submitMessage}>
                <textarea
                  aria-label="Message the coach"
                  placeholder="Ask a question, or think out loud…"
                  maxLength={4000}
                  rows={2}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (
                      event.key === 'Enter' &&
                      !event.shiftKey &&
                      !event.nativeEvent.isComposing
                    ) {
                      event.preventDefault()
                      event.currentTarget.form?.requestSubmit()
                    }
                  }}
                />
                <div className="composer-bottom">
                  <span>
                    <Icon name="code" size={13} />
                    Coach preview
                  </span>
                  <button
                    type="submit"
                    aria-label="Send message"
                    disabled={!draft.trim()}
                  >
                    <Icon name="arrowUp" size={17} />
                  </button>
                </div>
              </form>
              <p className="coach-disclaimer">
                <span className="tiny-dot" /> Sample responses · Live AI isn’t
                connected yet
              </p>
            </div>
          </section>
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
