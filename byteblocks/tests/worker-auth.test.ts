import { describe, expect, test, vi } from 'vitest'
import { getWorkerAccessToken } from '../src/ai/workerAuth'
import type { Auth0ContextInterface } from '@auth0/auth0-react'

const asGetToken = (fn: unknown) =>
  fn as Auth0ContextInterface['getAccessTokenSilently']
const asLogin = (fn: unknown) =>
  fn as Auth0ContextInterface['loginWithRedirect']

describe('Worker authentication', () => {
  test('uses the token requested during login without a second audience request', async () => {
    const getToken = vi.fn().mockResolvedValue('access-token')
    const login = vi.fn()
    await expect(
      getWorkerAccessToken(
        asGetToken(getToken),
        asLogin(login),
        'https://byteblocks-api',
      ),
    ).resolves.toBe('access-token')
    expect(getToken).toHaveBeenCalledWith()
    expect(login).not.toHaveBeenCalled()
  })

  test.each([
    'login_required',
    'consent_required',
    'interaction_required',
    'missing_refresh_token',
    'invalid_grant',
  ])('starts interactive sign-in for %s', async (error) => {
    const getToken = vi.fn().mockRejectedValue({ error })
    const login = vi.fn().mockResolvedValue(undefined)
    await expect(
      getWorkerAccessToken(
        asGetToken(getToken),
        asLogin(login),
        'https://byteblocks-api',
      ),
    ).rejects.toThrow('Sign in to continue.')
    expect(login).toHaveBeenCalledWith({
      authorizationParams: { audience: 'https://byteblocks-api' },
      appState: {
        returnTo: `${window.location.pathname}${window.location.search}${window.location.hash}`,
      },
    })
  })

  test('propagates unrelated errors without redirecting', async () => {
    const error = new Error('Network failure')
    const login = vi.fn()
    await expect(
      getWorkerAccessToken(
        asGetToken(vi.fn().mockRejectedValue(error)),
        asLogin(login),
        'https://byteblocks-api',
      ),
    ).rejects.toBe(error)
    expect(login).not.toHaveBeenCalled()
  })
})
