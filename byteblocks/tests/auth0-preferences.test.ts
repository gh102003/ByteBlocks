import { afterEach, describe, expect, test, vi } from 'vitest'
import {
  loadAuth0Preferences,
  saveAuth0Preferences,
} from '../src/auth0Preferences'
import { DEFAULT_PREFERENCES } from '../src/preferences'

afterEach(() => vi.unstubAllGlobals())

describe('Auth0 preference storage client', () => {
  test('loads the signed-in learner preferences with an access token', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify(DEFAULT_PREFERENCES), { status: 200 }),
      )
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      loadAuth0Preferences(async () => 'access-token'),
    ).resolves.toEqual(DEFAULT_PREFERENCES)
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/preferences', {
      headers: { Authorization: 'Bearer access-token' },
    })
  })

  test('updates preferences with an access token and no browser-visible secret', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response('{}', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    await saveAuth0Preferences(DEFAULT_PREFERENCES, async () => 'access-token')

    expect(fetchMock).toHaveBeenCalledWith('/api/auth/preferences', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer access-token',
      },
      body: JSON.stringify(DEFAULT_PREFERENCES),
    })
  })
})
