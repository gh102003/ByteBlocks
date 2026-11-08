import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'

const metadataKey = 'byteblocks'

const levels = new Set(['auto', 'beginner', 'intermediate', 'senior'])
const feedbackStyles = new Set([
  'socratic',
  'direct',
  'detailed',
  'code-review',
])
const goals = new Set(['interview', 'pythonic', 'algorithms', 'general'])
const tones = new Set(['encouraging', 'pragmatic', 'rigorous'])
const adviceFormats = new Set(['text', 'python', 'blocks'])
const concepts = new Set([
  'arrays',
  'loops',
  'dictionaries',
  'searching',
  'stacks',
  'debugging',
])

function isPreferences(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object') return false
  const preferences = value as Record<string, unknown>
  const profile = preferences.learningProfile
  const validProfile =
    profile === undefined ||
    (!!profile &&
      typeof profile === 'object' &&
      typeof (profile as Record<string, unknown>).diagnosticComplete ===
        'boolean' &&
      Object.entries((profile as { concepts?: unknown }).concepts ?? {}).every(
        ([key, score]) =>
          concepts.has(key) &&
          typeof score === 'number' &&
          score >= 0 &&
          score <= 2,
      ))
  return (
    typeof preferences.completedAt === 'string' &&
    levels.has(String(preferences.level)) &&
    feedbackStyles.has(String(preferences.feedbackStyle)) &&
    goals.has(String(preferences.goal)) &&
    tones.has(String(preferences.tone)) &&
    adviceFormats.has(String(preferences.adviceFormat)) &&
    (preferences.customNotes === undefined ||
      (typeof preferences.customNotes === 'string' &&
        preferences.customNotes.length <= 2_000)) &&
    validProfile
  )
}

function json(response: ServerResponse, status: number, body: unknown): void {
  response.statusCode = status
  response.setHeader('Content-Type', 'application/json')
  response.setHeader('Cache-Control', 'no-store')
  response.end(JSON.stringify(body))
}

function requestBody(request: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = ''
    request.on('data', (chunk: Buffer) => {
      body += chunk
      if (body.length > 16_384) reject(new Error('Request too large'))
    })
    request.on('end', () => resolve(body))
    request.on('error', reject)
  })
}

function sameOrigin(request: IncomingMessage): boolean {
  const origin = request.headers.origin
  return (
    !origin ||
    origin === `http://${request.headers.host}` ||
    origin === `https://${request.headers.host}`
  )
}

async function currentUser(domain: string, request: IncomingMessage) {
  const authorization = request.headers.authorization
  if (!authorization?.startsWith('Bearer ')) return null
  const response = await fetch(`https://${domain}/userinfo`, {
    headers: { Authorization: authorization },
  })
  if (!response.ok) return null
  return (await response.json()) as { sub?: string }
}

async function managementToken(env: Record<string, string>): Promise<string> {
  const response = await fetch(`https://${env.AUTH0_DOMAIN}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: env.AUTH0_MANAGEMENT_CLIENT_ID,
      client_secret: env.AUTH0_MANAGEMENT_CLIENT_SECRET,
      audience: `https://${env.AUTH0_DOMAIN}/api/v2/`,
    }),
  })
  if (!response.ok) throw new Error('Could not obtain a Management API token.')
  return ((await response.json()) as { access_token: string }).access_token
}

export function auth0PreferencesPlugin(env: Record<string, string>): Plugin {
  return {
    name: 'byteblocks-auth0-preferences',
    configureServer(server) {
      server.middlewares.use(
        '/api/auth/preferences',
        async (request, response) => {
          if (!sameOrigin(request))
            return json(response, 403, {
              error: 'Cross-origin request denied.',
            })
          if (request.method !== 'GET' && request.method !== 'PUT') {
            response.setHeader('Allow', 'GET, PUT')
            return json(response, 405, { error: 'Use GET or PUT.' })
          }
          if (
            !env.AUTH0_DOMAIN ||
            !env.AUTH0_MANAGEMENT_CLIENT_ID ||
            !env.AUTH0_MANAGEMENT_CLIENT_SECRET
          ) {
            return json(response, 503, {
              error: 'Auth0 profile storage is not configured.',
            })
          }
          try {
            const user = await currentUser(env.AUTH0_DOMAIN, request)
            if (!user?.sub)
              return json(response, 401, { error: 'Authentication required.' })
            const token = await managementToken(env)
            const url = `https://${env.AUTH0_DOMAIN}/api/v2/users/${encodeURIComponent(user.sub)}`
            if (request.method === 'GET') {
              const result = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` },
              })
              if (!result.ok) throw new Error('Could not read profile.')
              const profile = (await result.json()) as {
                user_metadata?: Record<string, unknown>
              }
              const preferences = profile.user_metadata?.[metadataKey]
              return preferences
                ? json(response, 200, preferences)
                : json(response, 404, { error: 'No preferences saved.' })
            }
            const body: unknown = JSON.parse(await requestBody(request))
            if (!isPreferences(body)) {
              return json(response, 400, {
                error: 'Invalid learning preferences.',
              })
            }
            const result = await fetch(url, {
              method: 'PATCH',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ user_metadata: { [metadataKey]: body } }),
            })
            if (!result.ok) throw new Error('Could not update profile.')
            return json(response, 200, { ok: true })
          } catch {
            return json(response, 502, {
              error: 'Could not update Auth0 profile storage.',
            })
          }
        },
      )
    },
  }
}
