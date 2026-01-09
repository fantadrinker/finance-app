import { useContext, useEffect, useRef, useState } from 'react'
import Modal from 'react-bootstrap/Modal'
import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/Button'
import { ActivityRow, getActivitiesWithDescription } from '../api'
import { useAuth0TokenSilent } from '../hooks'
import { ActivitiesTable } from './ActivitiesTable'
import { CategorySelect } from './CategorySelect'
import { CategoriesContext } from '../Contexts/CategoriesContext'

interface UpdateMappingModalProps {
  show: boolean
  closeModal: () => void
  currentCategory: string
  currentDescription: string
}

const UpdateMappingModal = ({
  show,
  closeModal,
  currentCategory,
  currentDescription,
}: UpdateMappingModalProps) => {
  const auth = useAuth0TokenSilent()

  const [newCategory, setNewCategory] = useState<string>(currentCategory)

  const { allCategories, addMapping } = useContext(CategoriesContext)

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
    setActivitiesMatchingDesc([])
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

  const submit = async (newDesc: string, newCat: string) => {
    try {
      addMapping(newCat, newDesc).then(() => {
        closeModal()
      })
    } catch (err) {
      console.log(err)
      console.log(`Error updating category mapping${err.message}`)
    }
    return false
  }


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
        <CategorySelect
          category={selectedCategory}
          onCategoryChange={setSelectedCategory}
          defaultLabel="New Category"
        />
        {!selectedCategory && (
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
