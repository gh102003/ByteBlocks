import { useChat } from '@ai-sdk/react'
import {
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { FormEvent } from 'react'
import Markdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import type { UIMessage } from 'ai'
import { getChatConnector } from '../ai/connector'
import type { ChatConnector } from '../ai/connector'
import { createCoachTransport } from '../ai/transport'
import type { CoachContext } from '../ai/transport'
import type { UserPreferences } from '../preferences'
import { Icon } from './Icon'
import { AdviceBlocks } from './AdviceBlocks'
import { NibbleSprite } from './NibbleSprite'
import { mascotForLevel, mascotName } from './mascot'
import { resolveMentorLevel } from '../ai/mentorLevel'
import { VoiceCoach } from './VoiceCoach'
import type { VoiceAccess } from '../ai/voice'
import { withoutByteblocksPayload } from '../byteblocksText'

function getInitialCoachMessages(
  prefs: UserPreferences | null | undefined,
  level: Exclude<UserPreferences['level'], 'auto'>,
): UIMessage[] {
  const mascot = mascotForLevel(level)
  const name = mascotName(mascot)
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

  let welcomeText = `Hi, I’m ${name}! Let’s work through this challenge. Ask me about your code, share an idea, or run it and we’ll explore the results together.`

  if (level === 'senior') {
    welcomeText = `Hi, I’m ${name} — calibrated for ${levelLabel} level with ${styleLabel}. Let’s evaluate your current challenge and its tradeoffs.`
  } else if (level === 'beginner') {
    welcomeText = `Hi, I’m ${name}! I’m calibrated for ${levelLabel} level with ${styleLabel}. Let’s work through this challenge step-by-step. Try running the code first to see how it works!`
  } else if (level) {
    welcomeText = `Hi, I’m ${name} — calibrated for ${levelLabel} level with ${styleLabel}. Let’s work through this challenge. Ask me about your code, share an idea, or run it and we’ll explore the results together.`
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

function withoutAdviceBlocks(text: string): string {
  return withoutByteblocksPayload(text)
}

function withoutNonBlockCode(text: string): string {
  return text.replace(/```(?!byteblocks\b)[\s\S]*?```/gi, '').trim()
}

export type CoachHandle = { checkWork: () => void }

export function CoachPanel({
  context,
  connector: suppliedConnector,
  coachRef,
  onAssessment,
  onAvailability,
  onOpenPreferences,
  voiceAccess,
}: {
  context: CoachContext
  connector?: ChatConnector
  coachRef?: React.Ref<CoachHandle>
  onAssessment?: (result: 'advance' | 'bonus' | 'skip') => void
  onAvailability?: (busy: boolean, unavailable: boolean) => void
  onOpenPreferences?: () => void
  voiceAccess?: VoiceAccess
}) {
  const effectivePreferences = context.preferences
  const resolvedLevel = resolveMentorLevel(
    effectivePreferences?.level,
    context.code,
    context.execution,
    effectivePreferences?.learningProfile,
  )
  const mascot = mascotForLevel(resolvedLevel)
  const agentName = mascotName(mascot)
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
    () => getInitialCoachMessages(effectivePreferences, resolvedLevel),
    [effectivePreferences, resolvedLevel],
  )
  const assessmentPending = useRef(false)
  const {
    messages,
    setMessages,
    sendMessage,
    regenerate,
    stop,
    status,
    error,
  } = useChat({
    transport,
    messages: initialMessages,
    onFinish: ({ message, isAbort, isError }) => {
      if (!assessmentPending.current) return
      assessmentPending.current = false
      if (isAbort || isError) return
      const text = message.parts
        .filter((part) => part.type === 'text')
        .map((part) => part.text)
        .join('')
      const result = text.match(/\[\[PROGRESS:(advance|bonus|skip)\]\]/)?.[1]
      if (result === 'advance' || result === 'bonus' || result === 'skip')
        onAssessment?.(result)
    },
    onError: () => {
      assessmentPending.current = false
    },
  })
  const [draft, setDraft] = useState('')
  const coachEnd = useRef<HTMLDivElement>(null)
  const busy = status === 'submitted' || status === 'streaming'

  useImperativeHandle(
    coachRef,
    () => ({
      checkWork: () => {
        if (busy || connector.configurationError) return
        assessmentPending.current = true
        void sendMessage({
          text: 'I passed the test cases. Please give me feedback on my solution and, if this is the final stage, decide whether to offer the bonus.',
        })
      },
    }),
    [busy, connector.configurationError, sendMessage],
  )

  useEffect(() => {
    onAvailability?.(busy, !!connector.configurationError)
  }, [busy, connector.configurationError, onAvailability])

  useEffect(() => {
    const container = coachEnd.current?.parentElement
    if (container) container.scrollTop = container.scrollHeight
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
          <NibbleSprite size="small" mascot={mascot} />
          <strong>{agentName}</strong>
          <span className="coach-subtitle">
            {effectivePreferences
              ? effectivePreferences.level === 'auto'
                ? `Auto-adapting as you build skills · ${resolvedLevel} guidance`
                : `Your ${resolvedLevel} mentor`
              : 'Your pocket-sized Python guide.'}
          </span>
        </div>
        {onOpenPreferences && (
          <button
            type="button"
            className="coach-settings-button"
            onClick={onOpenPreferences}
          >
            Change mentor
          </button>
        )}
      </div>
      <div
        className="coach-messages"
        role="log"
        aria-label={`${agentName} conversation`}
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
                <NibbleSprite size="small" mascot={mascot} />
              ) : (
                'Y'
              )}
            </span>
            <div className="message-content">
              <div className="message-label">
                {message.role === 'assistant' ? agentName : 'You'}
              </div>
              {message.parts.map((part, index) =>
                part.type === 'text' ? (
                  <div className="message-markdown" key={index}>
                    <Markdown
                      skipHtml
                      remarkPlugins={[remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                      disallowedElements={['img']}
                      components={{
                        a: ({ children, href }) => (
                          <a href={href} target="_blank" rel="noreferrer">
                            {children}
                          </a>
                        ),
                      }}
                    >
                      {message.role === 'assistant'
                        ? effectivePreferences?.adviceFormat === 'blocks'
                          ? withoutNonBlockCode(
                              withoutAdviceBlocks(
                                part.text.replace(
                                  /\[\[PROGRESS:(?:advance|bonus|skip)\]\]/g,
                                  '',
                                ),
                              ),
                            )
                          : withoutAdviceBlocks(
                              part.text.replace(
                                /\[\[PROGRESS:(?:advance|bonus|skip)\]\]/g,
                                '',
                              ),
                            )
                        : part.text}
                    </Markdown>
                    {message.role === 'assistant' && (
                      <AdviceBlocks text={part.text} />
                    )}
                  </div>
                ) : null,
              )}
            </div>
          </div>
        ))}
        {messages.length === 1 && (
          <div className="suggested-prompts">
            <button onClick={() => setDraft('How should I start this stage?')}>
              How should I start?
              <Icon name="arrow" size={13} />
            </button>
            <button
              onClick={() =>
                setDraft(
                  resolvedLevel === 'senior'
                    ? 'Help me evaluate the memory tradeoffs.'
                    : resolvedLevel === 'beginner'
                      ? 'Guide me step-by-step through the loop.'
                      : 'Help me understand the complexity.',
                )
              }
            >
              {resolvedLevel === 'senior'
                ? 'Evaluate memory tradeoffs'
                : resolvedLevel === 'beginner'
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
              ? `${agentName} is thinking…`
              : `${agentName} is writing a reply…`}
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
        {voiceAccess && (
          <VoiceCoach
            context={context}
            messages={messages}
            access={voiceAccess}
            onTranscript={(role, text) =>
              setMessages((previous) => [
                ...previous,
                {
                  id: crypto.randomUUID(),
                  role,
                  parts: [{ type: 'text', text }],
                },
              ])
            }
          />
        )}
        <form className="coach-composer" onSubmit={submitMessage}>
          <textarea
            aria-label="Message the coach"
            placeholder={`Ask ${agentName} a question, or think out loud…`}
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
              main.py + latest output
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
