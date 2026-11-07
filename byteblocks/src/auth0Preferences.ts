import type { UserPreferences } from './preferences'

const PREFERENCES_ENDPOINT = '/api/auth/preferences'

type GetAccessTokenSilently = () => Promise<string | undefined>

async function request(
  getAccessTokenSilently: GetAccessTokenSilently,
  init?: RequestInit,
): Promise<Response> {
  const token = await getAccessTokenSilently()
  if (!token) throw new Error('Could not get an Auth0 access token.')
  const response = await fetch(PREFERENCES_ENDPOINT, {
    ...init,
    headers: {
      ...init?.headers,
      Authorization: `Bearer ${token}`,
    },
  })
  if (!response.ok && response.status !== 404) {
    throw new Error('Could not save your learning preferences.')
  }
  return response
}

export async function loadAuth0Preferences(
  getAccessTokenSilently: GetAccessTokenSilently,
): Promise<UserPreferences | null> {
  const response = await request(getAccessTokenSilently)
  if (response.status === 404) return null
  return (await response.json()) as UserPreferences
}

export async function saveAuth0Preferences(
  preferences: UserPreferences,
  getAccessTokenSilently: GetAccessTokenSilently,
): Promise<void> {
  await request(getAccessTokenSilently, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(preferences),
  })
}
