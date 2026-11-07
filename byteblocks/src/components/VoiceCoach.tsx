import { useEffect, useRef, useState } from 'react'
import {
  ConversationProvider,
  useConversationClientTool,
  useConversationControls,
  useConversationInput,
  useConversationMode,
  useConversationStatus,
} from '@elevenlabs/react'
import type { UIMessage } from 'ai'
import type { CoachContext } from '../ai/transport'
import {
  createVoiceTools,
  mentorVoice,
  voiceInstructions,
  voiceSnapshot,
} from '../ai/voice'
import type { VoiceAccess } from '../ai/voice'
import { resolveMentorLevel } from '../ai/mentorLevel'
import { mascotForLevel, mascotName } from './mascot'

type Props = {
  context: CoachContext
  messages: UIMessage[]
  access: VoiceAccess
  onTranscript: (role: 'user' | 'assistant', text: string) => void
}

function VoiceControls({ context, messages, access }: Props) {
  const { startSession, endSession, sendContextualUpdate } =
    useConversationControls()
  const { status } = useConversationStatus()
  const { isSpeaking } = useConversationMode()
  const { isMuted, setMuted } = useConversationInput()
  const [requesting, setRequesting] = useState(false)
  const [error, setError] = useState('')
  const pending = useRef<AbortController | null>(null)
  const snapshot = voiceSnapshot(context, messages)
  const instructions = voiceInstructions(context)
  const voice = mentorVoice(context)
  const level = resolveMentorLevel(
    context.preferences?.level,
    context.code,
    context.execution,
  )
  const mentorName = mascotName(mascotForLevel(level))
  const tools = createVoiceTools(() => snapshot, access)
  useConversationClientTool('read_workspace', tools.read_workspace)
  useConversationClientTool('read_challenge_stage', tools.read_challenge_stage)
  useConversationClientTool('read_execution', tools.read_execution)
  useConversationClientTool('read_test_results', tools.read_test_results)
  useConversationClientTool('run_code', tools.run_code)
  useConversationClientTool('stop_execution', tools.stop_execution)
  useConversationClientTool('check_stage', tools.check_stage)

  useEffect(
    () => () => {
      pending.current?.abort()
      endSession()
    },
    [endSession],
  )

  useEffect(() => {
    if (status !== 'connected') return
    const timer = setTimeout(() => {
      sendContextualUpdate(
        `Updated mentor instructions and workspace snapshot:\n${instructions}\n${snapshot}`,
      )
    }, 500)
    return () => clearTimeout(timer)
  }, [snapshot, instructions, status, sendContextualUpdate])

  const start = async () => {
    if (pending.current || status === 'connected' || status === 'connecting')
      return
    const controller = new AbortController()
    pending.current = controller
    setRequesting(true)
    setError('')
    try {
      const response = await fetch('/api/voice/session', {
        method: 'POST',
        signal: controller.signal,
      })
      if (!response.headers.get('content-type')?.includes('application/json'))
        throw new Error(
          'Voice needs the local Vite server or a deployed voice session endpoint.',
        )
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Could not start voice.')
      if (typeof data.conversationToken !== 'string')
        throw new Error('Invalid voice session response.')
      if (controller.signal.aborted) return
      startSession({
        conversationToken: data.conversationToken,
        connectionType: 'webrtc',
        overrides: { tts: { voiceId: voice.voiceId } },
        dynamicVariables: {
          mentor_name: mentorName,
          coach_instructions: instructions,
          workspace_context: snapshot,
        },
      })
    } catch (cause) {
      if (!controller.signal.aborted)
        setError(
          cause instanceof Error ? cause.message : 'Could not start voice.',
        )
    } finally {
      if (!controller.signal.aborted) setRequesting(false)
      if (pending.current === controller) pending.current = null
    }
  }

  const active = status === 'connected' || status === 'connecting' || requesting
  return (
    <div className="voice-coach" aria-label="Realtime voice coach">
      <div className="voice-controls">
        <button
          type="button"
          onClick={
            active
              ? () => {
                  pending.current?.abort()
                  pending.current = null
                  setRequesting(false)
                  endSession()
                }
              : () => void start()
          }
        >
          {active ? 'End voice' : 'Start voice'}
        </button>
        {status === 'connected' && (
          <button
            type="button"
            aria-pressed={isMuted}
            onClick={() => setMuted(!isMuted)}
          >
            {isMuted ? 'Unmute mic' : 'Mute mic'}
          </button>
        )}
        <span role="status">
          {requesting || status === 'connecting'
            ? 'Connecting…'
            : status === 'connected'
              ? isMuted
                ? 'Mic muted'
                : isSpeaking
                  ? 'Speaking…'
                  : 'Listening…'
              : `Realtime voice · ${mentorName} · can read and run your work`}
        </span>
      </div>
      {error && (
        <p className="coach-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

export function VoiceCoach(props: Props) {
  const [error, setError] = useState('')
  return (
    <ConversationProvider
      onConnect={() => setError('')}
      onMessage={(message) =>
        props.onTranscript(
          message.source === 'user' ? 'user' : 'assistant',
          message.message,
        )
      }
      onError={() =>
        setError(
          'Voice connection failed. Check microphone permission, account access, and your connection, then retry.',
        )
      }
    >
      <VoiceControls {...props} />
      {error && (
        <p className="coach-error" role="alert">
          {error}
        </p>
      )}
    </ConversationProvider>
  )
}
