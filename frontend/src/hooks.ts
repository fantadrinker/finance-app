import { useEffect, useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'

export function useAuth0WithTokenSilent(): {
  token: string | null
  user_id: string | null
 } {
  const { user, isAuthenticated, getAccessTokenSilently } = useAuth0()

  const [token, setToken] = useState<string | null>(null)
  useEffect(() => {
    if (isAuthenticated) {
      getAccessTokenSilently().then(accessToken => {
        setToken(accessToken)
      }).catch(err => {
        console.error(err)
      })
    } else {
      setToken(null)
    }
  }, [getAccessTokenSilently, isAuthenticated])
  return {
    token,
    user_id: user?.sub ?? null
  }
}
