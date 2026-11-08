import { afterEach, expect, test, vi } from 'vitest'
import { page } from 'vitest/browser'
import { render } from 'vitest-browser-react'
import { Conversation } from '@elevenlabs/react'
import { VoiceCoach } from '../src/components/VoiceCoach'
import { DEFAULT_PREFERENCES } from '../src/preferences'

const context = {
  code: 'print(42)',
  execution: { status: 'idle' as const, output: [] },
}
const access = {
  readStage: () => ({ stage: 1 }),
  readExecution: () => ({}),
  readTests: () => ({}),
  runCode: () => 'started',
  stopExecution: () => 'stopped',
  checkStage: () => 'checking',
}
afterEach(() => {
  vi.restoreAllMocks()
})

// Exercise the real provider and hooks: a mocked useConversationInput missed
// the SDK throwing when setMuted was called before startSession.
test('the real SDK provider reaches the session endpoint before any conversation exists', async () => {
  const original = globalThis.fetch
  const fetcher = vi
    .spyOn(globalThis, 'fetch')
    .mockImplementation((input, init) =>
      input === '/api/voice/session'
        ? Promise.resolve(
            Response.json({ error: 'Endpoint reached' }, { status: 503 }),
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
  await page
    .getByRole('button', { name: 'Start voice chat', exact: true })
    .click()
  await expect
    .element(page.getByRole('alert'))
    .toMatchTextContent('Endpoint reached')
  expect(fetcher).toHaveBeenCalledWith(
    '/api/voice/session',
    expect.objectContaining({ method: 'POST' }),
  )
})

test.each([
  {
    level: 'beginner' as const,
    code: 'print(42)',
    voiceId: '1lXLcaBSLzgfQ2dCVmRt',
  },
  {
    level: 'intermediate' as const,
    code: 'print(42)',
    voiceId: 'JBFqnCBsd6RMkjVDRZzb',
  },
  {
    level: 'senior' as const,
    code: 'print(42)',
    voiceId: 'nPczCjzI2devNBz1zQrb',
  },
  {
    level: 'auto' as const,
    code: 'def solve(): pass',
    voiceId: 'JBFqnCBsd6RMkjVDRZzb',
  },
])(
  'the real SDK starts $level with its mentor voice and allows retry after failure',
  async ({ level, code, voiceId }) => {
    const original = globalThis.fetch
    vi.spyOn(globalThis, 'fetch').mockImplementation((input, init) =>
      input === '/api/voice/session'
        ? Promise.resolve(Response.json({ conversationToken: 'test-token' }))
        : original(input, init),
    )
    const start = vi
      .spyOn(Conversation, 'startSession')
      .mockRejectedValue(new Error('Simulated connection failure'))
    await render(
      <VoiceCoach
        context={{
          ...context,
          code,
          preferences: { ...DEFAULT_PREFERENCES, level },
        }}
        messages={[]}
        access={access}
        onTranscript={vi.fn()}
      />,
    )
    await page
      .getByRole('button', { name: 'Start voice chat', exact: true })
      .click()
    await expect
      .element(page.getByRole('alert'))
      .toMatchTextContent('Voice connection failed')
    const options = start.mock.calls[0][0]
    expect(Object.keys(options.clientTools ?? {})).toHaveLength(7)
    expect(options.dynamicVariables?.workspace_context).toContain(code)
    expect(options.overrides?.tts?.voiceId).toBe(voiceId)
    expect(options.conversationToken).toBe('test-token')
    await page
      .getByRole('button', { name: 'Start voice chat', exact: true })
      .click()
    await expect.poll(() => start.mock.calls.length).toBe(2)
  },
)
