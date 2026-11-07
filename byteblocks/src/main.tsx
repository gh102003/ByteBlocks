import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Auth0Provider } from '@auth0/auth0-react'
import App from './App'
import 'katex/dist/katex.min.css'
import './index.css'

const domain =
  import.meta.env.VITE_AUTH0_DOMAIN || 'dev-q7opyduoai7dkbn8.us.auth0.com'
const clientId =
  import.meta.env.VITE_AUTH0_CLIENT_ID || '2JqtI9GGIGVp3dj59RlvfvMIGOojLtFD'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      cacheLocation="localstorage"
      authorizationParams={{
        redirect_uri: window.location.origin,
      }}
    >
      <App />
    </Auth0Provider>
  </StrictMode>,
)
