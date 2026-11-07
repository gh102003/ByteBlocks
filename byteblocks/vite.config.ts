import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { voicePlugin } from './server/voice.ts'
import { auth0PreferencesPlugin } from './server/auth0-preferences.ts'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    voicePlugin(loadEnv(mode, process.cwd(), '')),
    auth0PreferencesPlugin(loadEnv(mode, process.cwd(), '')),
  ],
}))
