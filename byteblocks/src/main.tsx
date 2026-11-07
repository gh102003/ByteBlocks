import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Auth0Provider } from '@auth0/auth0-react'
import App from './App'
import 'katex/dist/katex.min.css'
import './index.css'

const domain = import.meta.env.VITE_AUTH0_DOMAIN
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID
const root = createRoot(document.getElementById('root')!)

if (!domain || !clientId) {
  root.render(
    <main className="auth-configuration-error">
      <h1>Authentication needs configuration</h1>
      <p>
        Set <code>VITE_AUTH0_DOMAIN</code> and <code>VITE_AUTH0_CLIENT_ID</code>{' '}
        before starting ByteBlocks.
      </p>
    </main>,
  )
} else {
  root.render(
    <StrictMode>
      <Auth0Provider
        domain={domain}
        clientId={clientId}
        authorizationParams={{
          redirect_uri: window.location.origin,
        }}
      >
        <App />
      </Auth0Provider>
    </StrictMode>,
  )
}
