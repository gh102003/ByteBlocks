/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_OPENAI_API_KEY?: string
  readonly VITE_AI_PROVIDER?: string
  readonly VITE_AI_MODEL?: string
  readonly VITE_AI_BASE_URL?: string
}

declare module 'monaco-editor/languages/definitions/python/register'
declare module 'monaco-editor/editor/contrib/*'
declare module 'monaco-editor/editor/browser/coreCommands'
