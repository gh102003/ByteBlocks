import { useEffect, useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { HomePage } from './components/HomePage'
import { Workspace } from './components/Workspace'
import { OnboardingModal } from './components/OnboardingModal'
import { type UserPreferences, getPreferences } from './preferences'
import './App.css'

interface AppProps {
  initialView?: 'home' | 'workspace'
}

export default function App({ initialView }: AppProps = {}) {
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0()

  const [view, setView] = useState<'home' | 'workspace'>(() => {
    if (initialView) return initialView
    const hash = window.location.hash
    if (hash === '#workspace') return 'workspace'
    return 'home'
  })

  const [preferences, setPreferences] = useState<UserPreferences | null>(() =>
    getPreferences(),
  )
  const [isEditingPreferences, setIsEditingPreferences] = useState(false)

  // Show onboarding if actively editing or if authenticated without completed preferences
  const showOnboarding =
    isEditingPreferences || (isAuthenticated && preferences === null)

  // Sync hash changes
  useEffect(() => {
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
  }, [isAuthenticated, isLoading])

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
    window.location.hash = '#workspace'
    setView('workspace')
  }

  const handleNavigateHome = () => {
    window.location.hash = '#home'
    setView('home')
  }

  // If view is workspace but user is not authenticated, fallback to home
  if (view === 'workspace' && !isAuthenticated && !isLoading && !initialView) {
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
