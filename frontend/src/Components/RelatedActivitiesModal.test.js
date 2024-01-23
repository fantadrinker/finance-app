import { render, screen } from '../test-utils'
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
  API.getRelatedActivities.mockReturnValue(new Promise(resolve => resolve([])))
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

test('should show loading when loading', () => {
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

  
})