import configJson from './auth_config.json'

interface AuthConfig {
  domain: string
  clientId: string
  audience?: string
}

export function getConfig(): AuthConfig {
  // Configure the audience here. By default, it will take whatever is in the config
  // (specified by the `audience` key) unless it's the default value of "YOUR_API_IDENTIFIER" (which
  // is what you get sometimes by using the Auth0 sample download tool from the quickstart page, if you
  // don't have an API).
  // If this resolves to `null`, the API page changes to show some helpful info about what to do
  // with the audience.
  const audience_base: string | null =
    configJson.audience_base && configJson.audience_base !== 'YOUR_API_IDENTIFIER'
      ? configJson.audience_base
      : null

  const audience = `${audience_base}${process.env.NODE_ENV === 'production' ? 'Prod': 'Test'}`

  return {
    domain: configJson.domain,
    clientId: configJson.clientId,
    ...(audience ? { audience } : null),
  }
}

export const BASE_NAME = process.env.NODE_ENV === 'production' ? '/finance-app' : ''
