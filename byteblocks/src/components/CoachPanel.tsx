import { useChat } from '@ai-sdk/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import Markdown from 'react-markdown'
import type { UIMessage } from 'ai'
import { getChatConnector } from '../ai/connector'
import type { ChatConnector } from '../ai/connector'
import { createCoachTransport } from '../ai/transport'
import type { CoachContext } from '../ai/transport'
import type { UserPreferences } from '../preferences'
import { Icon } from './Icon'

function getInitialCoachMessages(prefs?: UserPreferences | null): UIMessage[] {
  const level = prefs?.level
  const style = prefs?.feedbackStyle
  const levelLabel = level ? level.charAt(0).toUpperCase() + level.slice(1) : ''
  const styleLabel =
    style === 'socratic'
      ? 'Socratic hints'
      : style === 'direct'
        ? 'direct feedback'
        : style === 'detailed'
          ? 'detailed explanations'
          : style === 'code-review'
            ? 'production code review'
            : ''

  let welcomeText =
    'Hey! Let’s work through Two Sum. Ask me about your code, share an idea, or run it and we’ll explore the results together.'

  if (level === 'senior') {
    welcomeText = `Hey! I'm calibrated for ${levelLabel} level with ${styleLabel}. Let’s evaluate Two Sum: inspect the dictionary approach, time/space amortized bounds, and edge cases with duplicates or memory overhead.`
  } else if (level === 'beginner') {
    welcomeText = `Hey! Welcome to Python practice. I'm calibrated for ${levelLabel} level with ${styleLabel}. Let’s work through Two Sum step-by-step. Try running the code first to see how it works!`
  } else if (level) {
    welcomeText = `Hey! I'm calibrated for ${levelLabel} level with ${styleLabel}. Let’s work through Two Sum. Ask me about your code, share an idea, or run it and we’ll explore the results together.`
  }

  return [
    {
      id: 'welcome',
      role: 'assistant',
      parts: [
        {
          type: 'text',
          text: welcomeText,
        },
      ],
    },
  ]
}

export function CoachPanel({
  context,
  connector: suppliedConnector,
}: {
  context: CoachContext
  connector?: ChatConnector
}) {
  const effectivePreferences = context.preferences
  const connector = useMemo(
    () => suppliedConnector ?? getChatConnector(),
    [suppliedConnector],
  )
  const transport = useMemo(
    () =>
      createCoachTransport(connector, () => ({
        ...context,
        preferences: effectivePreferences,
      })),
    [connector, context, effectivePreferences],
  )
  const initialMessages = useMemo(
    () => getInitialCoachMessages(effectivePreferences),
    [effectivePreferences],
  )
  const { messages, sendMessage, regenerate, stop, status, error } = useChat({
    transport,
    messages: initialMessages,
  })
  const [draft, setDraft] = useState('')
  const coachEnd = useRef<HTMLDivElement>(null)
  const busy = status === 'submitted' || status === 'streaming'

  useEffect(() => {
    coachEnd.current?.scrollIntoView({ block: 'nearest' })
  }, [messages, status, error])

  const submitMessage = (event: FormEvent) => {
    event.preventDefault()
    if (!draft.trim() || busy || connector.configurationError) return
    void sendMessage({ text: draft.trim() })
    setDraft('')
  }

  return (
    <section className="panel coach-panel" aria-label="AI coach">
      <div className="panel-toolbar coach-toolbar">
        <div className="coach-title">
          <span className="coach-mark">
            <Icon name="sparkle" size={17} />
          </span>
          <strong>AI coach</strong>
          <span className="coach-subtitle">
            {effectivePreferences
              ? `Calibrated for ${effectivePreferences.level} (${effectivePreferences.feedbackStyle})`
              : 'A little nudge goes a long way.'}
          </span>
        </div>
        <span className="sample-badge" title={connector.label}>
          {connector.configurationError
            ? 'Not connected'
            : effectivePreferences
              ? effectivePreferences.level.toUpperCase()
              : 'Ready'}
        </span>
      </div>
      <div
        className="coach-messages"
        role="log"
        aria-label="Coach conversation"
        aria-live="polite"
        aria-busy={busy}
      >
        <div className="conversation-date">
          <span />
          LET’S FIGURE IT OUT
          <span />
        </div>
        {messages.map((message) => (
          <div
            className={`message message-${message.role === 'assistant' ? 'coach' : 'user'}`}
            key={message.id}
          >
            <span
              className={`message-avatar ${message.role === 'assistant' ? 'coach-message-avatar' : ''}`}
            >
              {message.role === 'assistant' ? (
                <Icon name="sparkle" size={15} />
              ) : (
                'Y'
              )}
            </span>
            <div className="message-content">
              <div className="message-label">
                {message.role === 'assistant' ? 'ByteBlocks coach' : 'You'}
                {message.role === 'assistant' && effectivePreferences && (
                  <span className="calibrated-tag">
                    {effectivePreferences.feedbackStyle.toUpperCase()}
                  </span>
                )}
              </div>
              {message.parts.map((part, index) =>
                part.type === 'text' ? (
                  message.role === 'assistant' ? (
                    <div className="message-markdown" key={index}>
                      <Markdown
                        skipHtml
                        disallowedElements={['img']}
                        components={{
                          a: ({ children, href }) => (
                            <a href={href} target="_blank" rel="noreferrer">
                              {children}
                            </a>
                          ),
                        }}
                      >
                        {part.text}
                      </Markdown>
                    </div>
                  ) : (
                    <p key={index}>{part.text}</p>
                  )
                ) : null,
              )}
            </div>
          </div>
        ))}
        {messages.length === 1 && (
          <div className="suggested-prompts">
            <button onClick={() => setDraft('Why use a dictionary here?')}>
              Why use a dictionary?
              <Icon name="arrow" size={13} />
            </button>
            <button
              onClick={() =>
                setDraft(
                  effectivePreferences?.level === 'senior'
                    ? 'Help me evaluate the memory tradeoffs.'
                    : effectivePreferences?.level === 'beginner'
                      ? 'Guide me step-by-step through the loop.'
                      : 'Help me understand the complexity.',
                )
              }
            >
              {effectivePreferences?.level === 'senior'
                ? 'Evaluate memory tradeoffs'
                : effectivePreferences?.level === 'beginner'
                  ? 'Step-by-step guide'
                  : 'Explore the complexity'}
              <Icon name="arrow" size={13} />
            </button>
          </div>
        )}
        {busy && (
          <p className="coach-status" role="status">
            <span className="status-dot pulsing" />
            {status === 'submitted'
              ? 'Coach is thinking…'
              : 'Coach is replying…'}
          </p>
        )}
        {(connector.configurationError || error) && (
          <div className="coach-error" role="alert">
            <Icon name="info" size={14} />
            <span>{connector.configurationError || error?.message}</span>
            {error && !connector.configurationError && (
              <button onClick={() => void regenerate()} disabled={busy}>
                Retry
              </button>
            )}
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
              {effectivePreferences
                ? `main.py + ${effectivePreferences.feedbackStyle} mode`
                : 'main.py + latest output'}
            </span>
            {busy ? (
              <button
                key="stop"
                type="button"
                aria-label="Stop response"
                onClick={() => void stop()}
              >
                <Icon name="stop" size={13} />
              </button>
            ) : (
              <button
                key="send"
                type="submit"
                aria-label="Send message"
                disabled={!draft.trim() || !!connector.configurationError}
              >
                <Icon name="arrowUp" size={17} />
              </button>
            )}
          </div>
        </form>
        <p className="coach-disclaimer">
          <span className="tiny-dot" />
          {connector.label} · AI can make mistakes
        </p>
      </div>
    </section>
  )
}
