import { expect, test } from 'vitest'
import { streamText } from 'ai'
import { createOpenAIConnector } from '../src/ai/connectors/openai'

test('worker connector sends chat history and reads streamed chat completions', async () => {
  let requestBody: Record<string, unknown> | undefined
  let requestUrl = ''
  const connector = createOpenAIConnector({
    apiKey: 'worker',
    baseURL: 'https://worker.example/v1',
    chatCompletions: true,
    fetch: async (input, init) => {
      requestUrl = String(input)
      requestBody = JSON.parse(String(init?.body))
      const chunk = {
        id: 'test',
        object: 'chat.completion.chunk',
        created: 1,
        model: 'gemini-2.5-flash-lite',
        choices: [
          {
            index: 0,
            delta: { content: 'Hello from Gemini' },
            finish_reason: null,
          },
        ],
      }
      const finish = {
        ...chunk,
        choices: [{ index: 0, delta: {}, finish_reason: 'stop' }],
      }
      return new Response(
        `data: ${JSON.stringify(chunk)}\n\ndata: ${JSON.stringify(finish)}\n\ndata: [DONE]\n\n`,
        {
          headers: { 'Content-Type': 'text/event-stream' },
        },
      )
    },
  })
  const result = streamText({
    model: connector.createModel(),
    instructions: 'Be helpful',
    messages: [
      { role: 'user', content: 'Hi' },
      { role: 'assistant', content: 'Hello' },
      { role: 'user', content: 'Continue' },
    ],
  })
  expect(await result.text).toBe('Hello from Gemini')
  expect(requestUrl).toBe('https://worker.example/v1/chat/completions')
  expect(requestBody?.messages).toEqual([
    { role: 'system', content: 'Be helpful' },
    { role: 'user', content: 'Hi' },
    { role: 'assistant', content: 'Hello' },
    { role: 'user', content: 'Continue' },
  ])
})
