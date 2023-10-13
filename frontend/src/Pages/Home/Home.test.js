import { waitFor, render, screen } from '../../test-utils'
import * as auth0Helper from '../../hooks'
import { rest } from 'msw'
import { setupServer } from 'msw/node'
import Home from './Home'

jest.mock('../../hooks')

const server = setupServer(
  rest.get('/activities', (res, ctx) => {
    return res(ctx.json([]))
  })
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('Home, if not logged in', () => {
  beforeEach(() => {
    auth0Helper.useAuth0TokenSilent.mockResolvedValue(null)
    render(<Home />)
  })
  test('should redirect user to log in', () => {
    expect(screen.getByText(/log in/i)).toBeInTheDocument()
  })
})

describe('if logged in', () => {
  beforeEach(() => {
    auth0Helper.useAuth0TokenSilent.mockResolvedValue('test token')
    render(<Home />)
  })
  test("if logged in and no activities is logged, shows the correct prompt", async () => {
    await waitFor(() => expect(auth0Helper.useAuth0TokenSilent).toHaveBeenCalled())
    await waitFor(() => expect(screen.getByText(/no data to display/i)).tobeinthedocument())
  })
})

