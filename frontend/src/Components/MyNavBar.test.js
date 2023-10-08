import { render, screen } from '../test-utils'
import MyNavBar from './MyNavBar'

test('shows log in link only when not logged in', () => {
  render(<MyNavBar />)
  const linkElement = screen.getByText(/log in/i)
  expect(linkElement).toBeInTheDocument()
})

