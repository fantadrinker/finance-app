import { waitFor, render, screen } from '../../test-utils'
import * as auth0Helper from '../../hooks'
import * as API from '../../api'
import Home from './Home'

jest.mock('../../hooks')
jest.mock('../../api')

beforeEach(() => {
  API.getActivities.mockReturnValue(new Promise((resolve) => resolve({
    data: [],
    nextKey: ''
  })))
  API.getMappings.mockReturnValue(new Promise((resolve) => resolve([])))
})

describe('Home, if not logged in', () => {
  beforeEach(() => {
    auth0Helper.useAuth0TokenSilent.mockReturnValue(null)
    render(<Home />)
  })
  test('should redirect user to log in', async () => {
    expect(await screen.findByText(/not authenticated/i)).toBeInTheDocument()
    expect(await screen.findByText(/log in/i)).toBeInTheDocument()
  })
})

describe('if logged in', () => {
  beforeEach(() => {
    auth0Helper.useAuth0TokenSilent.mockReturnValue('test token')
    render(<Home />)
  })

  test("if logged in and no activities is logged, shows the correct prompt", async () => {
    await waitFor(() => expect(auth0Helper.useAuth0TokenSilent).toHaveBeenCalled())
    // await waitFor(() => expect(API.getActivities).toHaveBeenCalled())
    // await waitFor(() => expect(API.getMappings).toHaveBeenCalled())
    expect(await screen.findByRole('status')).toBeInTheDocument()
    expect(await screen.findByText(/no data to display/i)).toBeInTheDocument()
  })
})

