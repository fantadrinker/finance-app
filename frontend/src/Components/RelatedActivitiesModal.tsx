import { useContext, useEffect, useState } from 'react'
import Modal from 'react-bootstrap/Modal'
import Button from 'react-bootstrap/Button'
import { useAuth0TokenSilent } from '../hooks'
import { ActivityRow, deleteActivity, getRelatedActivities } from '../api'
import { ActivitiesTable } from './ActivitiesTable'
import { MultiSelectContext } from '../Contexts/MultiSelectContext'

interface RelatedActivitiesModalProps {
  show: boolean
  closeModal: (flag?: boolean) => void
  activity?: ActivityRow
}

const RelatedActivitiesModal = ({
  show,
  closeModal,
  activity,
}: RelatedActivitiesModalProps) => {
  const token = useAuth0TokenSilent()
  const [loading, setLoading] = useState<boolean>(false)
  const [relatedActivities, setRelatedActivities] = useState<
    Array<ActivityRow>
  >([])
  
  const {selectedIds} = useContext(MultiSelectContext)

  useEffect(() => {
    if (!token || !activity?.id) {
      return
    }
    // fetch related activities
    setLoading(true)
    getRelatedActivities(token, activity.id)
      .then(({ data }) => {
        setRelatedActivities(data)
        setLoading(false)
      })
      .catch(err => {
        console.log(err)
      })
  }, [token, activity])

  const deleteSelected = async () => {
    if (!token || !selectedIds || selectedIds.size === 0) {
      return
    }
    const allSelectedIds = selectedIds.keys().filter(id => [activity?.id, ...relatedActivities.map((activity) => activity.id)].includes(id))
    try {
      await Promise.all(allSelectedIds.map((id) => deleteActivity(token, id)))
    } catch (e) {
      console.error("error while deleting activity" , e)
    }

    closeModal(true)
  }

  return (
    <Modal show={show} onHide={() => closeModal(false)}>
      <Modal.Header closeButton>
        <Modal.Title>Related Activities</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Modal.Dialog>Current Activity</Modal.Dialog>
        {activity && <ActivitiesTable activities={[activity]} />}
        {loading && <p>Loading...</p>}
        {!loading && relatedActivities.length > 0 && (<ActivitiesTable activities={relatedActivities} />)}
        {!loading && relatedActivities.length === 0 && (<p>No related activities found</p>)}
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={deleteSelected}>Delete</Button>
        <Button onClick={() => closeModal(false)}>Close</Button>
      </Modal.Footer>
    </Modal>
  )
}

export default RelatedActivitiesModal
