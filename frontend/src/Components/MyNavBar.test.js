import { render, screen } from '../test-utils'
import auth0 from '@auth0/auth0-react'
import MyNavBar from './MyNavBar'

jest.mock('@auth0/auth0-react')

test('shows log in link only when not logged in', () => {
  auth0.useAuth0.mockReturnValue({
    isAuthenticated: false,
    logout: jest.fn(),
    loginWithRedirect: jest.fn(),
    user: {
      name: 'test user',
      email: ''
    }
  })

  render(<MyNavBar />)
  const linkElement = screen.getByText(/log in/i)
  expect(linkElement).toBeInTheDocument()
})

test('shows log out link only when logged in', () => {
  auth0.useAuth0.mockReturnValue({
    isAuthenticated: true,
    logout: jest.fn(),
    loginWithRedirect: jest.fn(),
    user: {
      name: 'test user',
      email: 'test123@testemail.com'
    }
  })

  render(<MyNavBar />)
  const linkElement = screen.getByText(/test user/i)
  expect(linkElement).toBeInTheDocument()
})

