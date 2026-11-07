import { useAuth0 } from '@auth0/auth0-react'

export function AuthNav() {
  const { user, isAuthenticated, isLoading, loginWithRedirect, logout } =
    useAuth0()

  if (isLoading) {
    return (
      <span className="avatar" aria-label="Loading authentication">
        ...
      </span>
    )
  }

  if (!isAuthenticated) {
    return (
      <button
        type="button"
        className="auth-login-button"
        onClick={() => void loginWithRedirect()}
      >
        Log In
      </button>
    )
  }

  const initials =
    user?.name
      ?.split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'YOU'

  return (
    <div className="auth-profile">
      {user?.picture ? (
        <img
          src={user.picture}
          alt={user.name || 'User avatar'}
          className="avatar auth-avatar-img"
          title={user.name || user.email || 'User'}
        />
      ) : (
        <span className="avatar" title={user?.name || user?.email || 'User'}>
          {initials}
        </span>
      )}
      <button
        type="button"
        className="auth-logout-button"
        onClick={() =>
          void logout({
            logoutParams: { returnTo: window.location.origin },
          })
        }
      >
        Log Out
      </button>
    </div>
  )
}
