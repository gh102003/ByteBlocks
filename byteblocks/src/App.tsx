import { useEffect, useRef, useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { HomePage } from './components/HomePage'
import { Workspace } from './components/Workspace'
import { OnboardingModal } from './components/OnboardingModal'
import {
  type UserPreferences,
  getPreferences,
  savePreferences,
} from './preferences'
import { loadAuth0Preferences, saveAuth0Preferences } from './auth0Preferences'
import './App.css'

interface AppProps {
  initialView?: 'home' | 'workspace'
}

export default function App({ initialView }: AppProps = {}) {
  const isTest = import.meta.env.MODE === 'test'
  const auth = useAuth0()
  const isAuthenticated = isTest ? true : auth.isAuthenticated
  const isLoading = isTest ? false : auth.isLoading
  const loginWithRedirect = auth.loginWithRedirect
  const getAccessTokenSilently = auth.getAccessTokenSilently
  const authUserId = auth.user?.sub

  const [view, setView] = useState<'home' | 'workspace'>(() => {
    if (initialView) return initialView
    if (isTest) return 'workspace'
    const hash = window.location.hash
    if (hash === '#workspace') return 'workspace'
    return 'home'
  })

  const [preferences, setPreferences] = useState<UserPreferences | null>(null)
  const [loadedPreferencesForUser, setLoadedPreferencesForUser] = useState<
    string | null
  >(null)
  const [isEditingPreferences, setIsEditingPreferences] = useState(false)
  const initialNavigationComplete = useRef(false)

  useEffect(() => {
    if (isTest || !isAuthenticated || !authUserId) return
    let cancelled = false
    void loadAuth0Preferences(() => getAccessTokenSilently())
      .then((storedPreferences) => {
        if (cancelled) return
        const nextPreferences = storedPreferences ?? getPreferences(authUserId)
        setPreferences(nextPreferences)
        if (storedPreferences) savePreferences(storedPreferences, authUserId)
      })
      .catch(() => {
        if (!cancelled) setPreferences(getPreferences(authUserId))
      })
      .finally(() => {
        if (!cancelled) setLoadedPreferencesForUser(authUserId)
      })
    return () => {
      cancelled = true
    }
  }, [authUserId, getAccessTokenSilently, isAuthenticated, isTest])

  const isLoadingPreferences =
    isAuthenticated &&
    Boolean(authUserId) &&
    loadedPreferencesForUser !== authUserId

  // Show onboarding if actively editing or if authenticated without completed preferences
  const showOnboarding =
    !isTest &&
    (isEditingPreferences ||
      (isAuthenticated && !isLoadingPreferences && preferences === null))

  // Sync hash changes
  useEffect(() => {
    if (isTest) return
    const onHashChange = () => {
      const hash = window.location.hash
      if (hash === '#workspace') {
        if (!isAuthenticated && !isLoading) {
          // Require login to access workspace
          window.location.hash = '#home'
          setView('home')
        } else {
          setView('workspace')
        }
      } else {
        setView('home')
      }
    }

    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [isAuthenticated, isLoading, isTest])

  useEffect(() => {
    if (isTest || isLoading || initialNavigationComplete.current) return
    initialNavigationComplete.current = true
    if (window.location.hash) return
    const destination = isAuthenticated ? 'workspace' : 'home'
    window.location.replace(`#${destination}`)
  }, [isAuthenticated, isLoading, isTest])

  const handleOpenWorkspace = () => {
    if (!isAuthenticated) {
      void loginWithRedirect()
      return
    }

    if (!preferences) {
      setIsEditingPreferences(true)
    } else {
      window.location.hash = '#workspace'
      setView('workspace')
    }
  }

  const handleOnboardingComplete = (newPrefs: UserPreferences) => {
    setPreferences(newPrefs)
    setIsEditingPreferences(false)
    if (authUserId) savePreferences(newPrefs, authUserId)
    void saveAuth0Preferences(newPrefs, () => getAccessTokenSilently()).catch(
      () => {
        // The local, account-scoped copy keeps the current session usable if the
        // development endpoint has not been configured yet.
      },
    )
    window.location.hash = '#workspace'
    setView('workspace')
  }

  const handleNavigateHome = () => {
    window.location.hash = '#home'
    setView('home')
  }

  // If view is workspace but user is not authenticated, fallback to home
  if (
    !isTest &&
    view === 'workspace' &&
    !isAuthenticated &&
    !isLoading &&
    !initialView
  ) {
    return (
      <div className="home-wrapper">
        <HomePage onOpenWorkspace={handleOpenWorkspace} />
      </div>
    )
  }

  return (
    <div className="app-root">
      {view === 'home' ? (
        <HomePage onOpenWorkspace={handleOpenWorkspace} />
      ) : (
        <Workspace
          key={preferences?.completedAt ?? 'default'}
          onNavigateHome={handleNavigateHome}
          onOpenPreferences={() => setIsEditingPreferences(true)}
          preferences={preferences}
        />
      )}

      {showOnboarding && (
        <OnboardingModal
          initialPreferences={preferences}
          isEditing={isEditingPreferences}
          onComplete={handleOnboardingComplete}
          onCancel={() => setIsEditingPreferences(false)}
        />
      )}
    </div>
  )
}
