import { render, screen, within } from '../test-utils'
import * as auth0Helper from '../hooks'
import * as API from '../api'
import RelatedActivitiesModal from './RelatedActivitiesModal'

jest.mock('../hooks')
jest.mock('../api')

beforeEach(() => {
  API.getActivities.mockReturnValue(
    new Promise(resolve =>
      resolve({
        data: [],
        nextKey: '',
      })
    )
  )
  API.getRelatedActivities.mockReturnValue(new Promise(resolve => resolve({data: []})))
})

test('should show modal when show is true', () => {
  auth0Helper.useAuth0TokenSilent.mockReturnValue('test token')

  render(
    <RelatedActivitiesModal
      show={true}
      closeModal={() => {}}
      activityId="test id"
    />
  )
  const modalElement = screen.getByRole('dialog')
  expect(modalElement).toBeInTheDocument()
})

test('should show loading when loading', async () => {
  auth0Helper.useAuth0TokenSilent.mockReturnValue('test token')

  render(
    <RelatedActivitiesModal
      show={true}
      closeModal={() => {}}
      activityId="test id"
    />
  )
  const loadingText = screen.getByText('Loading...')
  expect(loadingText).toBeInTheDocument()
  await screen.findByText(/No related activities found/)
})

test('should show related activities table if data were returned', async () => {
  API.getRelatedActivities.mockReturnValue(
    new Promise(resolve =>
      resolve({
        data: [
          {
            id: '1',
            date: '2021-01-01',
            category: 'test activity',
            desc: 'test description',
            account: '0123',
            amount: 100,
          },
          {
            id: '2',
            date: '2021-01-02',
            category: 'test activity 2',
            desc: 'test description 2',
            account: '0123',
            amount: 100,
          },
        ],
      })
    )
  )
  auth0Helper.useAuth0TokenSilent.mockReturnValue('test token')

  render(
    <RelatedActivitiesModal
      show={true}
      closeModal={() => {}}
      activityId="test id"
    />
  )
  const table = await screen.findByRole('table')
  expect(table).toBeInTheDocument()
  const rows = within(table).getAllByRole('row')
  expect(rows.length).toBe(3) // 1 header row + 2 data rows
})
