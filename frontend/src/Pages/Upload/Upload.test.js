import { waitFor, render, screen } from '../../test-utils'
import * as auth0Helper from '../../hooks'
import * as API from '../../api'
import { Upload } from './Upload'

jest.mock('../../hooks')
jest.mock('../../api')

beforeEach(() => {
  API.getUploads.mockReturnValue(new Promise(resolve => resolve([])))
})

describe('Upload page, user logged in', () => {
  beforeEach(() => {
    auth0Helper.useAuth0TokenSilent.mockReturnValue('test token')
  })
  test('should prompt user for file upload', async () => {
    render(<Upload />)
    await waitFor(() =>
      expect(auth0Helper.useAuth0TokenSilent).toHaveBeenCalled()
    )
    await waitFor(async () => {
      const fileUpload = await screen.findByRole('file')
      const submitButton = screen.getByRole('submit')
      expect(fileUpload).toBeInTheDocument()
      expect(submitButton).toBeInTheDocument()
      expect(submitButton).toBeDisabled()
    })
    // TODO: later mock the upload file, then check if button is enabled
  })
  test('should show user previous uploads if there is any', async () => {
    API.getUploads.mockReturnValue(
      new Promise(resolve =>
        resolve([
          {
            start_date: '2021-01-01',
            end_date: '2021-01-31',
            checksum: '1234567890',
          },
        ])
      )
    )
    render(<Upload />)
    await waitFor(() =>
      expect(auth0Helper.useAuth0TokenSilent).toHaveBeenCalled()
    )
    expect(await screen.findByText(/2021-01-01/i)).toBeInTheDocument()
    expect(await screen.findByText(/2021-01-31/i)).toBeInTheDocument()
  })
})
