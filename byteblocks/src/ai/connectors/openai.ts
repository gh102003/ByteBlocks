import { createOpenAI } from '@ai-sdk/openai'
import type { ChatConnector, ConnectorSettings } from '../connector'

export function createOpenAIConnector({
  apiKey,
  model = 'gpt-4.1-mini',
  baseURL,
  fetch: customFetch,
  chatCompletions = false,
}: ConnectorSettings): ChatConnector {
  const configurationError = apiKey
    ? undefined
    : 'Add VITE_OPENAI_API_KEY to .env, then restart the dev server to connect the coach.'

  return {
    label: chatCompletions ? 'AI coach' : `OpenAI · ${model}`,
    configurationError,
    // Send full history on every turn, including stopped or partial replies.
    providerOptions: { openai: { store: false } },
    createModel() {
      if (configurationError) throw new Error(configurationError)
      const provider = createOpenAI({ apiKey, baseURL, fetch: customFetch })
      return chatCompletions ? provider.chat(model) : provider.responses(model)
    },
  }
}
