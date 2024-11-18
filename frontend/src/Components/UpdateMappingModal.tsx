import { useEffect, useRef, useState } from 'react'
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
  submit: (newCategory: string, newDescription: string) => Promise<boolean>
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

  const [isProcessingSubmit, setIsProcessingSubmit] = useState<boolean>(false)

  const [activitiesMatchingDesc, setActivitiesMatchingDesc] = useState<
    ActivityRow[]
  >([])

  const [isLoadingActivities, setIsLoadingActivities] = useState<boolean>(false)

  const queuedActivityCall = useRef<number | null>(null)

  // updates state when props change
  useEffect(() => {
    setNewCategory('')
    setSelectedCategory(currentCategory)
    setNewDescription(currentDescription)
  }, [currentCategory, currentDescription, allCategories])

  useEffect(() => {
    if (!show || !auth || newDescription.length === 0) {
      return
    }
    if (queuedActivityCall.current) {
      clearTimeout(queuedActivityCall.current)
    }
    // fetch activities with description
    queuedActivityCall.current = window.setTimeout(() => {
      setActivitiesMatchingDesc([])
      setIsLoadingActivities(true)
      getActivitiesWithDescription(auth, newDescription)
        .then(result => {
          setActivitiesMatchingDesc(result.data)
        })
        .catch(err => {
          console.log(err)
        })
        .finally(() => {
          setIsLoadingActivities(false)
        })
    }, 500)

  }, [show, auth, newDescription])

  const selectCategories = (currentCategory === "" || allCategories.includes(currentCategory))
    ? allCategories
    : allCategories.concat([currentCategory])

  return (
    <Modal size="lg" show={show} onHide={closeModal}>
      <Modal.Header closeButton>
        <Modal.Title>Update Category Mapping</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Label htmlFor="description">Description Text</Form.Label>
        <Form.Control
          type="text"
          aria-label="description"
          placeholder={currentDescription}
          value={newDescription ?? ''}
          onChange={(e) => setNewDescription(e.target.value)}
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
              aria-label="new category"
              placeholder="new category value"
              value={newCategory ?? ''}
              onChange={e => setNewCategory(e.target.value)}
              data-testid="new-category-input"
            />
          </>
        )}

        <div className='mt-3 max-h-96 overflow-y-scroll'>
          {isLoadingActivities && <p>Loading activities...</p>}
          {activitiesMatchingDesc.length > 0 && (
            <>
              <Form.Label>Activities with this description</Form.Label>
              <ActivitiesTable
                activities={activitiesMatchingDesc}
                options={{
                  showCategories: true
                }}
              />
            </>
          )}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button
          disabled={isProcessingSubmit}
          onClick={() => {
            setIsProcessingSubmit(true)
            submit(
              newDescription ?? currentDescription,
              selectedCategory === ''
                ? newCategory ?? currentCategory
                : selectedCategory
            ).then((shouldClose) => {
              setIsProcessingSubmit(false)
              if(shouldClose) closeModal()
            })
          }}
        >
          Update Mapping
        </Button>
        <Button onClick={closeModal}>Close</Button>
      </Modal.Footer>
    </Modal>
  )
}

export default UpdateMappingModal
