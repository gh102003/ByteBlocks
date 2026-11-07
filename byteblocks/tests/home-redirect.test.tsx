import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { page } from 'vitest/browser'
import { render } from 'vitest-browser-react'
import App from '../src/App'

const auth = vi.hoisted(() => ({
  isAuthenticated: false,
  isLoading: true,
  loginWithRedirect: vi.fn(),
}))

vi.mock('@auth0/auth0-react', () => ({ useAuth0: () => auth }))
vi.mock('../src/components/HomePage', () => ({
  HomePage: () => <div>Homepage</div>,
}))
vi.mock('../src/components/Workspace', () => ({
  Workspace: ({ onNavigateHome }: { onNavigateHome: () => void }) => (
    <div>
      Workspace page
      <button onClick={onNavigateHome}>Go home</button>
    </div>
  ),
}))
vi.mock('../src/components/OnboardingModal', () => ({
  OnboardingModal: () => <div>Onboarding</div>,
}))

beforeEach(() => {
  vi.stubEnv('MODE', 'development')
  sessionStorage.clear()
  auth.isAuthenticated = false
  auth.isLoading = true
  window.history.replaceState(null, '', window.location.pathname)
})

afterEach(() => {
  vi.unstubAllEnvs()
  window.history.replaceState(null, '', window.location.pathname)
})

describe('homepage authentication redirect', () => {
  test('redirects after an existing session is restored', async () => {
    const screen = await render(<App />)
    await expect.element(page.getByText('Homepage')).toBeVisible()
    expect(window.location.hash).toBe('')

    auth.isAuthenticated = true
    auth.isLoading = false
    await screen.rerender(<App />)

    await expect.element(page.getByText('Workspace page')).toBeVisible()
    await expect.element(page.getByText('Onboarding')).toBeVisible()
    expect(window.location.hash).toBe('#workspace')

    await page.getByRole('button', { name: 'Go home' }).click()
    await expect.element(page.getByText('Homepage')).toBeVisible()
    expect(window.location.hash).toBe('#home')
  })

  test('keeps signed-out users on the homepage', async () => {
    auth.isLoading = false
    await render(<App />)

    await expect.element(page.getByText('Homepage')).toBeVisible()
    expect(window.location.hash).toBe('#home')
  })

  test('allows signed-in users to open the homepage directly', async () => {
    auth.isAuthenticated = true
    auth.isLoading = false
    window.history.replaceState(null, '', '#home')
    await render(<App />)

    await expect.element(page.getByText('Homepage')).toBeVisible()
    expect(window.location.hash).toBe('#home')
  })
})
