import { within, waitFor, render, screen, fireEvent } from '../../test-utils'
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
  })

  test("if logged in and no activities is logged, shows the correct prompt", async () => {
    render(<Home />)
    await waitFor(() => expect(auth0Helper.useAuth0TokenSilent).toHaveBeenCalled())
    const spinnerElement = screen.getByRole('status')
    await waitFor(() => expect(spinnerElement).toBeInTheDocument()) // wait for spinner to show
    expect(await screen.findByText(/no data to display/i)).toBeInTheDocument()
  })

  test("if logged in and has activities, shows activity table", async () => {
    API.getActivities.mockReturnValue(new Promise((resolve) => resolve({
      data: [
        {
          "id": "1",
          "date": "2021-01-01",
          "category": "test activity",
          "desc": "test description",
          "account": "0123",
          "amount": 100,
        },
        {
          "id": "2",
          "date": "2021-01-02",
          "category": "test activity 2",
          "desc": "test description 2",
          "account": "0123",
          "amount": 200,
        }
      ],
      nextKey: ''
    })))
    render(<Home />)
    await waitFor(() => expect(auth0Helper.useAuth0TokenSilent).toHaveBeenCalled())
    // find by test id for activity table row. assert count
    expect(await screen.findByRole('status')).toBeInTheDocument()
    await waitFor(() => {
      const actTable = screen.getByTestId('activity-table')
      expect(actTable).toBeInTheDocument()
      expect(actTable).toHaveTextContent('test activity')
    })
  })

  test("if logged in but activity request fails, shows failure message", async () => {
    API.getActivities.mockReturnValue(new Promise((resolve, reject) => reject('test error')))
    render(<Home />)
    await waitFor(() => expect(screen.getByText(/failed to load activities/i)).toBeInTheDocument())
  })

  test("clicking on delete sends delete request to the server", async () => {
    API.deleteActivity.mockReturnValue(new Promise((resolve) => resolve({ ok: true })))
    API.getActivities.mockReturnValue(new Promise((resolve) => resolve({
      data: [
        {
          "id": "1",
          "date": "2021-01-01",
          "category": "test activity",
          "desc": "test description",
          "account": "0123",
          "amount": 100,
        },
        {
          "id": "2",
          "date": "2021-01-02",
          "category": "test activity 2",
          "desc": "test description 2",
          "account": "0123",
          "amount": 200,
        }
      ],
      nextKey: ''
    })))
    render(<Home />)
    const actTable = await screen.findByTestId('activity-table')
    expect(actTable).toBeInTheDocument()
    const deleteButtons = await within(actTable).findAllByText(/delete/i)
    deleteButtons[0].click()
    await waitFor(() => expect(API.deleteActivity).toHaveBeenCalledWith('test token', '1'))
  })

  test("scrolling to the bottom of the page sends request to the server for more activities", async () => {
    API.getActivities.mockReturnValue(new Promise((resolve) => resolve({
      data: [
        {
          "id": "2",
          "date": "2021-01-02",
          "category": "test activity 2",
          "desc": "test description 2",
          "account": "0123",
          "amount": 200,
        }
      ],
      nextKey: 'test next key'
    })))
    render(<Home />)
    await screen.findByTestId('activity-table')
    fireEvent.scroll(window, { target: { scrollY: 1000 } })
    await waitFor(() => expect(screen.getAllByText(/test activity 2/i)).toHaveLength(2))
    expect(API.getActivities).toHaveBeenCalledWith('test token', 'test next key')
  })
})

