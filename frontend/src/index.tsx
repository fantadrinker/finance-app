import React from 'react'
import ReactDOM from 'react-dom/client'
import {
  AppState,
  Auth0Provider,
  Auth0ProviderOptions,
} from '@auth0/auth0-react'
import { BrowserHistory, createBrowserHistory } from 'history'
import './index.css'
import App from './App'
import reportWebVitals from './reportWebVitals'
import { getConfig } from './config'
import 'bootstrap/dist/css/bootstrap.min.css'

const onRedirectCallback = (appState: AppState) => {
  let history: BrowserHistory = createBrowserHistory()
  history.push(
    appState && appState.returnTo ? appState.returnTo : window.location.pathname
  )
}

// Please see https://auth0.github.io/auth0-react/interfaces/Auth0ProviderOptions.html
// for a full list of the available properties on the provider
const config = getConfig()

const providerConfig: Auth0ProviderOptions = {
  domain: config.domain,
  clientId: config.clientId,
  onRedirectCallback,
  authorizationParams: {
    redirect_uri:
      process.env.NODE_ENV === 'production'
        ? `${window.location.origin}/finance-app`
        : window.location.origin,
    ...(config.audience ? { audience: config.audience } : null),
  },
  cacheLocation: 'localstorage',
}

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(
  <Auth0Provider {...providerConfig}>
    <React.StrictMode>
      <App />
    </React.StrictMode>
  </Auth0Provider>
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
