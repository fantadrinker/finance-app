import { render, screen } from '../test-utils'
import userEvent from '@testing-library/user-event'
import * as auth0Helper from '../hooks'
import UpdateMappingModal from './UpdateMappingModal'

jest.mock('../hooks')

test('should show modal when show is true', () => {
  auth0Helper.useAuth0TokenSilent.mockReturnValue('test token')

  render(<UpdateMappingModal 
    show={true} 
    closeModal={() => {}}
    currentCategory="test category"
    currentDescription="test description"
    allCategories={['test category']}
    submit={() => {}} 
  />)
  const modalElement = screen.getByRole('dialog')
  expect(modalElement).toBeInTheDocument()
  const descriptionBox = screen.getByRole('textbox', { name: /description/i })
  expect(descriptionBox).toBeInTheDocument()

  const categoryBox = screen.getByRole('list', { name: /category/i })
  expect(categoryBox).toBeInTheDocument()
})

test('should not show modal when show is false', () => {
  auth0Helper.useAuth0TokenSilent.mockReturnValue('test token')

  render(<UpdateMappingModal 
    show={false} 
    closeModal={() => {}}
    currentCategory="test category"
    currentDescription="test description"
    allCategories={['test category']}
    submit={() => {}} 
  />)
  const modalElement = screen.queryByRole('dialog')
  expect(modalElement).not.toBeInTheDocument()
})

test('should show new category input box when new category is selected', () => {
  auth0Helper.useAuth0TokenSilent.mockReturnValue('test token')

  render(<UpdateMappingModal 
    show={true} 
    closeModal={() => {}}
    currentCategory="test category"
    currentDescription="test description"
    allCategories={['test category']}
    submit={() => {}} 
  />)
  const categoryBox = screen.getByRole('list', { name: /category/i })
  expect(categoryBox).toBeInTheDocument()
  let newCategoryBox = screen.queryByRole('textbox', { name: /new category/i })
  expect(newCategoryBox).not.toBeInTheDocument()

  const newCategoryOption = screen.getByRole('option', { name: /new category/i })
  expect(newCategoryOption).toBeInTheDocument()
  userEvent.selectOptions(categoryBox, 'new category')
  newCategoryBox = screen.getByRole('textbox', { name: /new category/i })
  expect(newCategoryBox).toBeInTheDocument()
})