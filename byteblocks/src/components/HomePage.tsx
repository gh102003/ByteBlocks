import { ThemeToggle } from './ThemeToggle'
import { useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { Icon } from './Icon'
import { AuthNav } from './AuthNav'
import { NibbleSprite } from './NibbleSprite'
import { mascotForLevel, mascotName } from './mascot'

interface HomePageProps {
  onOpenWorkspace: () => void
}

type DemoLevel = 'beginner' | 'intermediate' | 'senior'

const DEMO_RESPONSES: Record<
  DemoLevel,
  {
    roleTitle: string
    feedbackStyle: string
    prompt: string
    coachReply: string
    helperHighlight: string
  }
> = {
  beginner: {
    roleTitle: 'Beginner',
    feedbackStyle: 'Socratic & Step-by-Step',
    prompt: 'How do I start solving Two Sum without getting overwhelmed?',
    coachReply:
      'Great question! Imagine you are holding the number 2, and your target is 9. What other number do you need to find to make 9? (Hint: 9 - 2 = ?). If we write down every number we see on a scratchpad as we walk through the list, how does that help us find the match in one step?',
    helperHighlight:
      'Beginner helpers break problems down into visual loops, variable tracking, and plain-English milestone checklists.',
  },
  intermediate: {
    roleTitle: 'Intermediate',
    feedbackStyle: 'Algorithmic Patterns & Big-O',
    prompt: 'I have a brute force O(n²) solution. How can I optimize it?',
    coachReply:
      'A brute force nested loop scans the remainder of the array repeatedly. Can we trade a little space to save time? If you use a hash map (dictionary) where the key is the number and value is its index, what is the lookup time for the complement target - num?',
    helperHighlight:
      'Intermediate helpers highlight asymptotic complexity (O(n) time vs O(n) space tradeoffs) and common interview patterns.',
  },
  senior: {
    roleTitle: 'Senior',
    feedbackStyle: 'Strict Systems Review & Edge Cases',
    prompt:
      'What are the subtle production tradeoffs of the dictionary approach?',
    coachReply:
      "Good thinking. The one-pass hash map is O(n) average time, but remember dict lookups are O(1) amortized—worst-case O(n) under adverse hash collisions. Also consider memory locality: Python's compact dict uses two arrays (sparse hash index + dense entries). What happens if nums contains duplicate numbers summing to target?",
    helperHighlight:
      'Senior helpers inspect amortized complexity, cache locality, memory overhead, and defensive Python idioms.',
  },
}

export function HomePage({ onOpenWorkspace }: HomePageProps) {
  const { isAuthenticated, loginWithRedirect } = useAuth0()
  const [demoLevel, setDemoLevel] = useState<DemoLevel>('intermediate')
  const demoMascot = mascotForLevel(demoLevel)
  const demoAgentName = mascotName(demoMascot)

  const handlePrimaryAction = () => {
    if (isAuthenticated) {
      onOpenWorkspace()
    } else {
      void loginWithRedirect()
    }
  }

  return (
    <div className="home-shell">
      {/* Navigation Header */}
      <header className="home-header">
        <div className="brand" aria-label="ByteBlocks home">
          <span className="brand-symbol">
            <i />
            <i />
            <i />
          </span>
          ByteBlocks<span className="brand-dot">.</span>
        </div>

        <nav className="home-nav" aria-label="Main Navigation">
          <a href="#features" className="home-nav-link">
            Features
          </a>
          <a href="#demo" className="home-nav-link">
            Adaptive AI Demo
          </a>
          <a href="#architecture" className="home-nav-link">
            Architecture
          </a>
        </nav>

        <div className="home-header-right">
          <ThemeToggle />
          <AuthNav />
          {isAuthenticated && (
            <button
              type="button"
              className="run-button home-cta-sm"
              onClick={onOpenWorkspace}
            >
              <span>Open Workspace</span>
              <Icon name="arrow" size={14} />
            </button>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-pill">
            <Icon name="sparkle" size={14} />
            <span>A little practice, a lot of progress</span>
          </div>

          <h1 className="hero-title">
            Think in blocks.
            <br />
            <span className="text-gradient">Code in Python.</span>
          </h1>

          <p className="hero-subtitle">
            Build your ideas one piece at a time. Practice Python, explore how
            your code works, and get a helpful nudge when you need one.
          </p>

          <div className="hero-actions">
            <button
              type="button"
              className="hero-primary-btn"
              onClick={handlePrimaryAction}
            >
              <Icon name="play" size={15} />
              <span>
                {isAuthenticated
                  ? 'Open Practice Workspace'
                  : 'Get Started Free'}
              </span>
            </button>
            <a href="#demo" className="hero-secondary-btn">
              <span>Meet Nibble</span>
              <Icon name="chevron" size={14} />
            </a>
          </div>

          <div className="hero-trust-bar">
            <span>
              <Icon name="shield" size={14} /> Python in your browser
            </span>
            <span className="dot-divider">•</span>
            <span>
              <Icon name="sparkle" size={14} /> Hints at your level
            </span>
            <span className="dot-divider">•</span>
            <span>
              <Icon name="code" size={14} /> Blocks or code
            </span>
          </div>
        </div>
        <div className="hero-workbench" aria-hidden="true">
          <div className="workbench-top">
            <span>● ● ●</span>
            <span>YOUR PRACTICE SPACE</span>
            <span>01 / PYTHON</span>
          </div>
          <div className="workbench-body">
            <div className="workbench-blocks">
              <div className="workbench-label">
                BUILD <span>01</span>
              </div>
              <div className="sample-block block-repeat">
                <span className="sample-block-icon">↻</span>
                <span>
                  for every <b>number</b> in <b>numbers</b>
                </span>
              </div>
              <div className="sample-block block-decision">
                <span className="sample-block-icon">?</span>
                <span>
                  if <b>number</b> is even
                </span>
              </div>
              <div className="sample-block block-output">
                <span className="sample-block-icon">›</span>
                <span>
                  say <b>number</b>
                </span>
              </div>
              <div className="workbench-grid-mark">
                <i />
                <i />
                <i />
                <i />
              </div>
            </div>
            <div className="workbench-code">
              <div className="workbench-label">
                PYTHON <span>02</span>
              </div>
              <pre>
                <span>01</span> <em>for</em> number <em>in</em> numbers:{'\n'}
                <span>02</span> <em>if</em> number % 2 == 0:{'\n'}
                <span>03</span> print(number)
              </pre>
              <div className="workbench-hint">
                <strong>✳ A LITTLE HINT</strong>
                <p>What happens when you divide an even number by 2?</p>
              </div>
            </div>
          </div>
          <div className="workbench-bottom">
            <span>● READY TO PLAY</span>
            <span>BUILD → RUN → LEARN</span>
          </div>
        </div>
      </section>

      {/* Interactive AI Preview Section */}
      <section id="demo" className="demo-section">
        <div className="section-header">
          <span className="section-eyebrow">Interactive Preview</span>
          <h2>A coach that meets you where you are</h2>
          <p>
            Pick a level and see how the same problem gets a different kind of
            hint.
          </p>
        </div>

        <div className="demo-card">
          <div className="demo-tabs" role="tablist">
            {(['beginner', 'intermediate', 'senior'] as DemoLevel[]).map(
              (lvl) => (
                <button
                  key={lvl}
                  type="button"
                  role="tab"
                  aria-selected={demoLevel === lvl}
                  className={`demo-tab ${demoLevel === lvl ? 'active' : ''}`}
                  onClick={() => setDemoLevel(lvl)}
                >
                  <span className="tab-circle" />
                  <strong>{lvl.charAt(0).toUpperCase() + lvl.slice(1)}</strong>
                  <span className="tab-style-label">
                    {DEMO_RESPONSES[lvl].feedbackStyle}
                  </span>
                </button>
              ),
            )}
          </div>

          <div className="demo-body">
            <div className="demo-chat-column">
              <div className="demo-chat-header">
                <NibbleSprite size="small" mascot={demoMascot} />
                <span>{demoAgentName} Simulation · Two Sum</span>
                <span className="demo-badge">
                  {DEMO_RESPONSES[demoLevel].roleTitle} Mode
                </span>
              </div>

              <div className="demo-message user-msg">
                <span className="msg-avatar">YOU</span>
                <div className="msg-bubble">
                  <p>{DEMO_RESPONSES[demoLevel].prompt}</p>
                </div>
              </div>

              <div className="demo-message coach-msg">
                <span className="msg-avatar coach-avatar">
                  <NibbleSprite size="small" mascot={demoMascot} />
                </span>
                <div className="msg-bubble">
                  <div className="msg-meta">
                    <strong>{demoAgentName}</strong>
                    <span>{DEMO_RESPONSES[demoLevel].feedbackStyle}</span>
                  </div>
                  <p>{DEMO_RESPONSES[demoLevel].coachReply}</p>
                </div>
              </div>
            </div>

            <div className="demo-info-column">
              <div className="info-block">
                <h4>
                  <Icon name="flag" size={16} /> Focus For This Level
                </h4>
                <p>{DEMO_RESPONSES[demoLevel].helperHighlight}</p>
              </div>

              <div className="info-block">
                <h4>
                  <Icon name="chart" size={16} /> Workspace Adaptation
                </h4>
                <ul>
                  <li>Custom starter scaffolds aligned with your expertise</li>
                  <li>Targeted complexity breakdowns & Big-O annotations</li>
                  <li>
                    Adjustable feedback style (Socratic, Direct, or Review)
                  </li>
                </ul>
              </div>

              <button
                type="button"
                className="demo-launch-btn"
                onClick={handlePrimaryAction}
              >
                <span>Try this in the Workspace</span>
                <Icon name="arrow" size={14} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="section-header">
          <span className="section-eyebrow">Everything You Need</span>
          <h2>A Practice Environment Built for Flow</h2>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <Icon name="shield" size={20} />
            </div>
            <h3>Opaque WebAssembly Sandbox</h3>
            <p>
              Runs genuine CPython 3 via Pyodide in an isolated Web Worker with
              its own strict CSP. Your code never hits a remote server and
              executes with zero latency.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <Icon name="sparkle" size={20} />
            </div>
            <h3>Adaptive AI Questioning</h3>
            <p>
              Select your level and feedback preferences during sign-in. Your AI
              coach guides you step-by-step through algorithmic roadblocks
              without spoiling solutions.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <Icon name="chart" size={20} />
            </div>
            <h3>Asymptotic Complexity Visuals</h3>
            <p>
              Explore dedicated panels for time/space complexity graphs,
              dataflow transformations, and structured problem goals alongside
              the full Monaco editor.
            </p>
          </div>
        </div>
      </section>

      {/* Architecture / Privacy Section */}
      <section id="architecture" className="arch-section">
        <div className="arch-card">
          <div className="arch-content">
            <span className="section-eyebrow">
              Zero Servers. Total Privacy.
            </span>
            <h2>Runs completely on your machine.</h2>
            <p>
              ByteBlocks compiles Python directly to WebAssembly in your
              browser. Code autosaves safely to your browser’s local storage,
              and your AI coaching preferences persist securely in session
              storage.
            </p>
            <div className="arch-metrics">
              <div className="metric">
                <span className="metric-val">0 ms</span>
                <span className="metric-label">Server Latency</span>
              </div>
              <div className="metric">
                <span className="metric-val">100%</span>
                <span className="metric-label">Client-Side Isolation</span>
              </div>
              <div className="metric">
                <span className="metric-val">Python 3</span>
                <span className="metric-label">Pyodide WebAssembly</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="cta-section">
        <h2>Start thinking in code today.</h2>
        <p>
          Sign in, choose your coaching style, and conquer your next algorithmic
          milestone.
        </p>
        <button
          type="button"
          className="hero-primary-btn"
          onClick={handlePrimaryAction}
        >
          <Icon name="play" size={15} />
          <span>
            {isAuthenticated ? 'Open Practice Workspace' : 'Get Started Free'}
          </span>
        </button>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <div className="footer-left">
          <span className="brand-dot-tiny">●</span>
          <span>ByteBlocks — Single-file Python practice workspace</span>
        </div>
        <div className="footer-right">
          <span>Private · In-Browser · WebAssembly</span>
        </div>
      </footer>
    </div>
  )
}
