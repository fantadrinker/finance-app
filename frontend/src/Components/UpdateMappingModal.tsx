import React, { useEffect, useRef, useState } from 'react'
import Modal from 'react-bootstrap/Modal'
import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/Button'
import { ActivityRow, getActivitiesWithDescription } from '../api'
import { useAuth0TokenSilent } from '../hooks'
import { ActivitiesTable } from './ActivitiesTable'

interface UpdateMappingModalProps {
  show: boolean
  closeModal: () => void
  currentCategory: string
  currentDescription: string
  allCategories: string[]
  submit: (newCategory: string, newDescription: string) => void
}

const UpdateMappingModal = ({
  show,
  closeModal,
  currentCategory,
  currentDescription,
  allCategories,
  submit, // TODO: remove this, call api directly
}: UpdateMappingModalProps) => {
  const auth = useAuth0TokenSilent()
  const [newCategory, setNewCategory] = useState<string>(currentCategory)
  const [selectedCategory, setSelectedCategory] = useState<string>(
    allCategories.length > 0 ? currentCategory : ''
  )
  const [newDescription, setNewDescription] =
    useState<string>(currentDescription)

  const [activitiesMatchingDesc, setActivitiesMatchingDesc] = useState<
    ActivityRow[]
  >([])

  const queuedActivityCall = useRef<number | null>(null)

  // updates state when props change
  useEffect(() => {
    setNewCategory('')
    setSelectedCategory(currentCategory)
    setNewDescription(currentDescription)
  }, [currentCategory, currentDescription, allCategories])

  function handleDescriptionChange(e: any) {
    const desc = e.target.value
    setNewDescription(desc)
    if (queuedActivityCall.current) {
      clearTimeout(queuedActivityCall.current)
    }
    if (!auth || desc.length === 0) {
      setActivitiesMatchingDesc([])
      return
    }
    queuedActivityCall.current = setTimeout(() => {
      getActivitiesWithDescription(auth, desc)
        .then(result => {
          setActivitiesMatchingDesc(result.data)
        })
        .catch(err => {
          console.log(err)
        })
    }, 500)
  }

  const selectCategories = allCategories.includes(currentCategory)
    ? allCategories
    : allCategories.concat([currentCategory])

  return (
    <Modal show={show} onHide={closeModal}>
      <Modal.Header closeButton>
        <Modal.Title>Update Category Mapping</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Label htmlFor="description">Description Text</Form.Label>
        <Form.Control
          type="text"
          role="textbox"
          aria-label="description"
          placeholder={currentDescription}
          value={newDescription ?? ''}
          onChange={handleDescriptionChange}
        />
        <Form.Label htmlFor="category">Existing Categories</Form.Label>
        <Form.Select
          aria-label="category"
          role="list"
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
        >
          {selectCategories.map((cat, index) => (
            <option value={cat} key={index}>
              {cat}
            </option>
          ))}
          <option value="">new category</option>
        </Form.Select>
        {selectedCategory === '' && (
          <>
            <Form.Label>New Category</Form.Label>
            <Form.Control
              type="text"
              role="textbox"
              aria-label="new category"
              placeholder="new category value"
              value={newCategory ?? ''}
              onChange={e => setNewCategory(e.target.value)}
              data-testid="new-category-input"
            />
          </>
        )}
        {activitiesMatchingDesc.length > 0 && (
          <>
            <Form.Label>Activities with this description</Form.Label>
            <ActivitiesTable activities={activitiesMatchingDesc} />
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button
          onClick={() =>
            submit(
              newDescription ?? currentDescription,
              selectedCategory === ''
                ? newCategory ?? currentCategory
                : selectedCategory
            )
          }
        >
          Update Mapping
        </Button>
        <Button onClick={closeModal}>Close</Button>
      </Modal.Footer>
    </Modal>
  )
}

export default UpdateMappingModal
