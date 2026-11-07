import type { JSONValue, LanguageModel } from 'ai'
import { createOpenAIConnector } from './connectors/openai'

export type ConnectorSettings = {
  apiKey: string
  model?: string
  baseURL?: string
}

export type ChatConnector = {
  label: string
  configurationError?: string
  providerOptions?: Record<string, Record<string, JSONValue>>
  createModel: () => LanguageModel
}

// Add another AI SDK provider here; the transport and chat UI stay the same.
const connectors: Record<string, () => ChatConnector> = {
  openai: () =>
    createOpenAIConnector({
      apiKey: import.meta.env.VITE_OPENAI_API_KEY?.trim() || '',
      model: import.meta.env.VITE_AI_MODEL?.trim() || undefined,
      baseURL: import.meta.env.VITE_AI_BASE_URL?.trim() || undefined,
    }),
}

export function getChatConnector(): ChatConnector {
  const provider = import.meta.env.VITE_AI_PROVIDER?.trim() || 'openai'
  const factory = connectors[provider]
  if (!factory) {
    const configurationError = `Unknown AI provider "${provider}". Add its connector in src/ai/connector.ts.`
    return {
      label: provider,
      configurationError,
      createModel() {
        throw new Error(configurationError)
      },
    }
  }
  return factory()
}
