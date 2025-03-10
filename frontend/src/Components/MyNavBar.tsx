import { Link, useLocation } from 'react-router-dom'
import Nav from 'react-bootstrap/Nav'
import Navbar from 'react-bootstrap/Navbar'
import NavDropdown from 'react-bootstrap/NavDropdown'
import Container from 'react-bootstrap/Container'

import { useAuth0 } from '@auth0/auth0-react'
import { BASE_NAME } from '../config'

const MyNavBar = () => {
  const { user, isAuthenticated, loginWithRedirect, logout } = useAuth0()

  const location = useLocation()

  const isPathActive = (path: string): boolean => {
    return location.pathname === path
  }

  const logoutWithRedirect = () =>
    logout({
      logoutParams: {
        returnTo: `${window.location.origin}${BASE_NAME}`
      },
    })
  return (
    <Navbar expand="lg">
      <Container>
        <Navbar.Brand>Finance Calculator</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          {isAuthenticated && (
            <Nav className="me-auto">
              <Nav.Link as="span" href="/">
                <Link
                  to="/upload"
                  style={
                    isPathActive('/upload') ? {} : { textDecoration: 'none' }
                  }
                >
                  Upload
                </Link>
              </Nav.Link>
              <Nav.Link as="span" href="/">
                <Link
                  to="/"
                  style={isPathActive('/') ? {} : { textDecoration: 'none' }}
                >
                  Home
                </Link>
              </Nav.Link>
              <Nav.Link as="span" href="/">
                <Link
                  to="/activities"
                  style={isPathActive('/activities') ? {} : { textDecoration: 'none' }}
                >
                  Activities
                </Link>
              </Nav.Link>
              <Nav.Link as="span" href="/preferences">
                <Link
                  to="/preferences"
                  style={
                    isPathActive('/preferences')
                      ? {}
                      : { textDecoration: 'none' }
                  }
                >
                  Preferences
                </Link>
              </Nav.Link>
              <Nav.Link as="span" href="/insights">
                <Link
                  to="/insights"
                  style={
                    isPathActive('/insights') ? {} : { textDecoration: 'none' }
                  }
                >
                  Insights
                </Link>
              </Nav.Link>
              <Nav.Link as="span" href="/wishlist">
                <Link
                  to="/wishlist"
                  style={
                    isPathActive('/wishlist') ? {} : { textDecoration: 'none' }
                  }
                >
                  Wishlists
                </Link>
              </Nav.Link>
            </Nav>
          )}
          <Nav>
            {isAuthenticated ? (
              <NavDropdown
                title={user?.name ?? 'No user name'}
                id="basic-nav-dropdown"
              >
                <NavDropdown.Item onClick={logoutWithRedirect}>
                  Logout
                </NavDropdown.Item>
              </NavDropdown>
            ) : (
              <Nav.Link onClick={() => loginWithRedirect()}>Log in</Nav.Link>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  )
}

export default MyNavBar
