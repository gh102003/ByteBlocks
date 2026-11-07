import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js'
import type { Plugin } from 'vite'

// This endpoint is for the local prototype. Production hosts must supply an
// authenticated, rate-limited equivalent; preview deliberately doesn't mint tokens.
export function voicePlugin(env: Record<string, string>): Plugin {
  return {
    name: 'byteblocks-voice',
    configureServer(server) {
      server.middlewares.use(
        '/api/voice/session',
        async (request, response) => {
          response.setHeader('Cache-Control', 'no-store')
          response.setHeader('Content-Type', 'application/json')
          const origin = request.headers.origin
          if (
            origin &&
            origin !== `http://${request.headers.host}` &&
            origin !== `https://${request.headers.host}`
          ) {
            response.statusCode = 403
            response.end(
              JSON.stringify({ error: 'Cross-origin session request denied.' }),
            )
            return
          }
          if (request.method !== 'POST') {
            response.statusCode = 405
            response.setHeader('Allow', 'POST')
            response.end(JSON.stringify({ error: 'Use POST.' }))
            return
          }
          if (!env.ELEVENLABS_API_KEY || !env.ELEVENLABS_AGENT_ID) {
            response.statusCode = 503
            response.end(
              JSON.stringify({
                error:
                  'Voice is not configured. Set ELEVENLABS_API_KEY and ELEVENLABS_AGENT_ID, then restart Vite.',
              }),
            )
            return
          }
          try {
            const client = new ElevenLabsClient({
              apiKey: env.ELEVENLABS_API_KEY,
            })
            const session =
              await client.conversationalAi.conversations.getWebrtcToken({
                agentId: env.ELEVENLABS_AGENT_ID,
              })
            response.end(JSON.stringify({ conversationToken: session.token }))
          } catch {
            response.statusCode = 502
            response.end(
              JSON.stringify({
                error:
                  'Could not start ElevenLabs voice. Check your account access and quota, then retry.',
              }),
            )
          }
        },
      )
    },
  }
}
