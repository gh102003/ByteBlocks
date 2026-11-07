import { afterEach, describe, expect, test, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { render } from 'vitest-browser-react'
import { createOpenAIConnector } from '../src/ai/connectors/openai'
import type { CoachContext } from '../src/ai/transport'
import type { UserPreferences } from '../src/preferences'
import { CoachPanel } from '../src/components/CoachPanel'
import '../src/index.css'
import '../src/App.css'

const connector = createOpenAIConnector({
  apiKey: 'test-key',
  model: 'test-model',
  baseURL: 'https://provider.example/v1',
})
const context: CoachContext = {
  code: 'print(two_sum([2, 7], 9))',
  execution: {
    status: 'success',
    output: [{ kind: 'stdout', text: '[0, 1]\n' }],
  },
  blocks: [{ id: 'example-1', type: 'var_set', varName: 'target', value: '9' }],
}

const blockPreferences: UserPreferences = {
  level: 'intermediate',
  feedbackStyle: 'detailed',
  goal: 'algorithms',
  tone: 'pragmatic',
  adviceFormat: 'blocks',
  completedAt: '2026-01-01T00:00:00.000Z',
}

// Exercise the actual OpenAI connector and SDK parser without paid API calls.
function responseStream() {
  let controller: ReadableStreamDefaultController<Uint8Array>
  let cancelled = false
  const stream = new ReadableStream<Uint8Array>({
    start(current) {
      controller = current
    },
    cancel() {
      cancelled = true
    },
  })
  const event = (data: unknown) =>
    controller.enqueue(
      new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`),
    )
  event({
    type: 'response.created',
    response: { id: 'response-test', created_at: 1, model: 'test-model' },
  })
  event({
    type: 'response.output_item.added',
    output_index: 0,
    item: { id: 'message-test', type: 'message' },
  })
  return {
    get cancelled() {
      return cancelled
    },
    response: new Response(stream, {
      headers: { 'Content-Type': 'text/event-stream' },
    }),
    text(delta: string) {
      event({
        type: 'response.output_text.delta',
        item_id: 'message-test',
        delta,
      })
    },
    finish() {
      event({
        type: 'response.output_item.done',
        output_index: 0,
        item: { id: 'message-test', type: 'message' },
      })
      event({
        type: 'response.completed',
        response: { usage: { input_tokens: 10, output_tokens: 10 } },
      })
      controller.close()
    },
  }
}

async function send(text: string) {
  await page.getByRole('textbox', { name: 'Message the coach' }).fill(text)
  await page.getByRole('button', { name: 'Send message' }).click()
}

function mockProvider() {
  const originalFetch = globalThis.fetch
  const provider = vi.fn<typeof fetch>()
  vi.spyOn(globalThis, 'fetch').mockImplementation((url, options) =>
    String(url).startsWith('https://provider.example/')
      ? provider(url, options)
      : originalFetch(url, options),
  )
  return provider
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('AI coach', () => {
  test('selects a distinct assistant identity for each experience level', async () => {
    const screen = await render(
      <CoachPanel
        context={{
          ...context,
          preferences: { ...blockPreferences, level: 'intermediate' },
        }}
        connector={connector}
      />,
    )
    await expect.element(page.getByText('Bite', { exact: true })).toBeVisible()
    await screen.rerender(
      <CoachPanel
        context={{
          ...context,
          preferences: { ...blockPreferences, level: 'senior' },
        }}
        connector={connector}
      />,
    )
    await expect.element(page.getByText('Chop', { exact: true })).toBeVisible()
  })

  test('streams Markdown and sends history with the latest code and output directly to the provider', async () => {
    const first = responseStream()
    const second = responseStream()
    const requests = mockProvider()
      .mockResolvedValueOnce(first.response)
      .mockResolvedValueOnce(second.response)
    const screen = await render(
      <CoachPanel context={context} connector={connector} />,
    )
    await send('Why use a dictionary?')
    await expect
      .element(page.getByRole('button', { name: 'Stop response' }))
      .toBeVisible()
    first.text('A **dictionary** avoids repeated scans.')
    await expect
      .element(page.getByText('avoids repeated scans.', { exact: false }))
      .toBeVisible()
    // The stream is still open: this proves replies render incrementally.
    expect(
      document.querySelector('.message-markdown strong')?.textContent,
    ).toBe('dictionary')
    first.text('\n\n```python\nseen = {}\n```\n\n<img src=x onerror=alert(1)>')
    first.finish()
    await expect
      .element(page.getByRole('button', { name: 'Send message' }))
      .toBeVisible()
    expect(
      document.querySelector('.message-markdown pre code')?.textContent,
    ).toContain('seen = {}')
    expect(document.querySelector('.coach-messages img')).toBeNull()
    expect(requests.mock.calls[0][0]).toBe(
      'https://provider.example/v1/responses',
    )
    const options = requests.mock.calls[0][1]!
    expect(new Headers(options.headers).get('Authorization')).toBe(
      'Bearer test-key',
    )
    const body = JSON.parse(options.body as string)
    expect(body.model).toBe('test-model')
    expect(body.stream).toBe(true)
    expect(body.store).toBe(false)
    expect(JSON.stringify(body.input)).toContain('print(two_sum([2, 7], 9))')
    expect(JSON.stringify(body.input)).toContain('[0, 1]')
    expect(JSON.stringify(body.input)).toContain('example-1')
    expect(JSON.stringify(body.input)).toContain('set a variable')
    expect(JSON.stringify(body.input)).toContain('YOUR ROLE AND BOUNDARIES')
    expect(JSON.stringify(body.input)).toContain(
      'Do not answer unrelated requests',
    )
    expect(body.tools ?? []).toEqual([])

    await screen.rerender(
      <CoachPanel
        connector={connector}
        context={{
          code: 'print("edited")',
          execution: {
            status: 'error',
            output: [{ kind: 'stderr', text: 'NameError: missing' }],
          },
        }}
      />,
    )
    await send('What changed?')
    await vi.waitFor(() => expect(requests).toHaveBeenCalledTimes(2))
    const next = JSON.stringify(
      JSON.parse(requests.mock.calls[1][1]!.body as string).input,
    )
    expect(next).toContain('edited')
    expect(next).toContain('NameError: missing')
    expect(next).not.toContain('print(two_sum')
    expect(next).toContain('Why use a dictionary?')
    expect(next).toContain('avoids repeated scans.')
    expect(next).toContain('What changed?')
    second.text('Your code changed.')
    second.finish()
    await expect
      .element(page.getByText('Your code changed.', { exact: true }))
      .toBeVisible()
  })

  test('reports API errors and retries the failed turn without duplicating the question', async () => {
    const retry = responseStream()
    const requests = mockProvider()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            error: {
              message: 'Invalid API key',
              type: 'invalid_request_error',
            },
          }),
          { status: 401, headers: { 'Content-Type': 'application/json' } },
        ),
      )
      .mockResolvedValueOnce(retry.response)
    await render(<CoachPanel context={context} connector={connector} />)
    await send('Explain my result.')
    await expect
      .element(page.getByRole('alert'))
      .toMatchTextContent('OpenAI rejected the API key')
    await page.getByRole('button', { name: 'Retry', exact: true }).click()
    await vi.waitFor(() => expect(requests).toHaveBeenCalledTimes(2))
    retry.text('The indices are zero and one.')
    retry.finish()
    await expect
      .element(page.getByText('The indices are zero and one.', { exact: true }))
      .toBeVisible()
    await expect.element(page.getByRole('alert')).not.toBeInTheDocument()
    expect(document.querySelectorAll('.message-user')).toHaveLength(1)
    expect(
      JSON.stringify(
        JSON.parse(requests.mock.calls[1][1]!.body as string).input,
      ),
    ).toContain('Explain my result.')
  })

  test('enforces the blocks preference in the rendered reply', async () => {
    const reply = responseStream()
    mockProvider().mockResolvedValueOnce(reply.response)
    await render(
      <CoachPanel
        context={{ ...context, preferences: blockPreferences }}
        connector={connector}
      />,
    )
    await send('Show me how to set a target.')
    reply.text(
      'Use this block:\n\n```byteblocks\n[{"type":"var_set","varName":"target","value":"9"}]\n```\n\n```python\ntarget = 9\n```',
    )
    reply.finish()
    await expect
      .element(page.getByLabelText('Read-only block example'))
      .toBeVisible()
    await expect
      .element(page.getByLabelText('Read-only block example'))
      .toMatchTextContent('target = 9')
    expect(document.querySelector('.message-markdown pre')).toBeNull()
    expect(
      document.querySelector('.message-markdown')?.textContent,
    ).not.toContain('target = 9')
  })

  test('stops an in-flight response, preserves partial text, and can send again', async () => {
    const partial = responseStream()
    const next = responseStream()
    const requests = mockProvider()
      .mockResolvedValueOnce(partial.response)
      .mockResolvedValueOnce(next.response)
    await render(<CoachPanel context={context} connector={connector} />)
    await send('Give me a hint.')
    partial.text('Start with the complement.')
    await expect
      .element(page.getByText('Start with the complement.', { exact: true }))
      .toBeVisible()
    const signal = requests.mock.calls[0][1]!.signal!
    await page.getByRole('button', { name: 'Stop response' }).click()
    await vi.waitFor(() => expect(signal.aborted).toBe(true))
    await vi.waitFor(() => expect(partial.cancelled).toBe(true))
    await expect
      .element(page.getByRole('button', { name: 'Send message' }))
      .toBeVisible()
    await expect
      .element(page.getByRole('log', { name: 'Nibble conversation' }))
      .toMatchTextContent('Start with the complement.')
    await page
      .getByRole('textbox', { name: 'Message the coach' })
      .fill('One more hint.')
    await userEvent.keyboard('{Enter}')
    next.text('Look at the earlier numbers.')
    next.finish()
    await expect
      .element(page.getByText('Look at the earlier numbers.', { exact: true }))
      .toBeVisible()
    expect(requests).toHaveBeenCalledTimes(2)
  })

  test('shows setup instructions and disables sending when the key is missing', async () => {
    const requests = mockProvider()
    await render(
      <CoachPanel
        context={context}
        connector={createOpenAIConnector({ apiKey: '' })}
      />,
    )
    await page.getByRole('textbox', { name: 'Message the coach' }).fill('Hello')
    await expect
      .element(page.getByRole('alert'))
      .toMatchTextContent('Add VITE_OPENAI_API_KEY')
    await expect
      .element(page.getByRole('button', { name: 'Send message' }))
      .toBeDisabled()
    expect(requests).not.toHaveBeenCalled()
  })
})
