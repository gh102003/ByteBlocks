import type { Auth0ContextInterface } from '@auth0/auth0-react'

type GetToken = Auth0ContextInterface['getAccessTokenSilently']
type Login = Auth0ContextInterface['loginWithRedirect']

export async function getWorkerAccessToken(
  getToken: GetToken,
  login: Login,
  audience: string,
): Promise<string | undefined> {
  try {
    return await getToken()
  } catch (error) {
    const code =
      typeof error === 'object' && error !== null && 'error' in error
        ? error.error
        : undefined
    if (
      [
        'login_required',
        'consent_required',
        'interaction_required',
        'missing_refresh_token',
        'invalid_grant',
      ].includes(String(code))
    ) {
      await login({
        authorizationParams: { audience },
        appState: {
          returnTo: `${window.location.pathname}${window.location.search}${window.location.hash}`,
        },
      })
      throw new Error('Sign in to continue.')
    }
    throw error
  }
}
