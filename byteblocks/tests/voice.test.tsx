import { afterEach, expect, test, vi } from 'vitest'
import { page } from 'vitest/browser'
import { render } from 'vitest-browser-react'
import {
  createVoiceTools,
  voiceInstructions,
  voiceSnapshot,
} from '../src/ai/voice'
import { VoiceCoach } from '../src/components/VoiceCoach'
import type { CoachContext } from '../src/ai/transport'

const sdk = vi.hoisted(() => ({
  startSession: vi.fn(),
  endSession: vi.fn(),
  sendContextualUpdate: vi.fn(),
  setMuted: vi.fn(),
  register: vi.fn(),
}))
vi.mock('@elevenlabs/react', () => ({
  ConversationProvider: ({ children }: { children: React.ReactNode }) =>
    children,
  useConversationControls: () => sdk,
  useConversationStatus: () => ({ status: 'disconnected' }),
  useConversationMode: () => ({ isSpeaking: false }),
  useConversationInput: () => ({ isMuted: false, setMuted: sdk.setMuted }),
  useConversationClientTool: sdk.register,
}))
const context: CoachContext = {
  code: 'print(2)',
  problem: 'Current stage: print a number',
  execution: { status: 'success', output: [{ kind: 'stdout', text: '1' }] },
  blocks: [{ id: 'one', type: 'var_set', varName: 'target', value: '2' }],
}
const access = {
  readStage: () => ({ stage: 2 }),
  readExecution: () => ({ source: 'print(1)', matchesCurrentCode: false }),
  readTests: () => ({ matchesCurrentCode: false, passed: false }),
  runCode: vi.fn(() => 'Started current editor code'),
  stopExecution: vi.fn(() => 'Stopped'),
  checkStage: vi.fn(() => 'Started checks'),
}
afterEach(() => {
  vi.restoreAllMocks()
  vi.clearAllMocks()
})

test('voice tools cannot accept replacement code or mutate the editor', () => {
  const tools = createVoiceTools(() => voiceSnapshot(context, []), access)
  // Malicious tool parameters are ignored: only the trusted current-code action runs.
  Reflect.apply(tools.run_code, undefined, [{ code: 'print("replacement")' }])
  expect(access.runCode).toHaveBeenCalledExactlyOnceWith()
  expect(Object.keys(tools)).toEqual([
    'read_workspace',
    'read_challenge_stage',
    'read_execution',
    'read_test_results',
    'run_code',
    'stop_execution',
    'check_stage',
  ])
  expect(JSON.parse(tools.read_execution()).matchesCurrentCode).toBe(false)
  expect(JSON.parse(tools.read_test_results()).passed).toBe(false)
  expect(JSON.parse(tools.read_challenge_stage()).stage).toBe(2)
})

test('voice receives the shared workspace, history, and voice-specific boundaries', () => {
  const snapshot = JSON.parse(
    voiceSnapshot(context, [
      {
        id: 'message',
        role: 'user',
        parts: [{ type: 'text', text: 'Help with stage two' }],
      },
    ]),
  )
  expect(snapshot.code).toBe(context.code)
  expect(snapshot.blocks).toEqual(context.blocks)
  expect(snapshot.conversation[0].text).toBe('Help with stage two')
  const prompt = voiceInstructions(context)
  expect(prompt).toContain(context.problem)
  expect(prompt).toContain(
    'Only claim to have run code after a successful run_code tool call',
  )
  expect(prompt).toContain('Never change code, blocks')
  expect(prompt).toContain('Never emit, quote, spell out')
  expect(prompt).not.toContain('BLOCKS IS A HARD OUTPUT REQUIREMENT')
})

test('voice context excludes visual byteblocks JSON', () => {
  const snapshot = JSON.parse(
    voiceSnapshot(context, [
      {
        id: 'message',
        role: 'assistant',
        parts: [
          {
            type: 'text',
            text: 'This dictionary approach is O(n). byteblocks [{"type":"dict_create","varName":"lookup","startsEmpty":true}]',
          },
        ],
      },
    ]),
  )
  expect(snapshot.conversation[0].text).toBe(
    'This dictionary approach is O(n).',
  )
})

test('voice connects only after an explicit click, using a temporary token and current context', async () => {
  const original = globalThis.fetch
  const fetcher = vi
    .spyOn(globalThis, 'fetch')
    .mockImplementation((input, init) => {
      if (input === '/api/voice/session')
        return Promise.resolve(
          Response.json({ conversationToken: 'temporary-token' }),
        )
      return original(input, init)
    })
  const view = await render(
    <VoiceCoach
      context={context}
      messages={[]}
      access={access}
      onTranscript={vi.fn()}
    />,
  )
  expect(sdk.startSession).not.toHaveBeenCalled()
  expect(fetcher).not.toHaveBeenCalled()
  await page.getByRole('button', { name: 'Start voice', exact: true }).click()
  await expect.poll(() => sdk.startSession.mock.calls.length).toBe(1)
  const options = sdk.startSession.mock.calls[0][0]
  expect(options.connectionType).toBe('webrtc')
  expect(options.conversationToken).toBe('temporary-token')
  expect(JSON.parse(options.dynamicVariables.workspace_context).code).toBe(
    context.code,
  )
  expect(fetcher).toHaveBeenCalledWith(
    '/api/voice/session',
    expect.objectContaining({ method: 'POST' }),
  )
  await view.unmount()
  expect(sdk.endSession).toHaveBeenCalled()
})

test('voice displays endpoint failures and allows retry without connecting', async () => {
  const original = globalThis.fetch
  vi.spyOn(globalThis, 'fetch').mockImplementation((input, init) =>
    input === '/api/voice/session'
      ? Promise.resolve(
          Response.json({ error: 'Voice is not configured.' }, { status: 503 }),
        )
      : original(input, init),
  )
  await render(
    <VoiceCoach
      context={context}
      messages={[]}
      access={access}
      onTranscript={vi.fn()}
    />,
  )
  await page.getByRole('button', { name: 'Start voice', exact: true }).click()
  await expect
    .element(page.getByRole('alert'))
    .toMatchTextContent('Voice is not configured.')
  expect(sdk.startSession).not.toHaveBeenCalled()
  await expect
    .element(page.getByRole('button', { name: 'Start voice', exact: true }))
    .toBeEnabled()
})
