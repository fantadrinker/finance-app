import { useEffect, useState } from 'react'
import Modal from 'react-bootstrap/Modal'
import Button from 'react-bootstrap/Button'
import { useAuth0WithTokenSilent } from '../hooks'
import { ActivityRow, getRelatedActivities } from '../api'
import { ActivitiesTable } from './ActivitiesTable'

interface RelatedActivitiesModalProps {
  show: boolean
  closeModal: () => void
  activityId?: string
}

const RelatedActivitiesModal = ({
  show,
  closeModal,
  activityId,
}: RelatedActivitiesModalProps) => {
  const { token, user_id } = useAuth0WithTokenSilent()
  const [loading, setLoading] = useState<boolean>(false)
  const [relatedActivities, setRelatedActivities] = useState<
    Array<ActivityRow>
  >([])

  useEffect(() => {
    if (!token || !activityId || !user_id) {
      return
    }
    // fetch related activities
    setLoading(true)
    getRelatedActivities(user_id, token, activityId)
      .then(({ data }) => {
        setRelatedActivities(data)
        setLoading(false)
      })
      .catch(err => {
        console.log(err)
      })
  }, [token, activityId])

  return (
    <Modal show={show} onHide={closeModal}>
      <Modal.Header closeButton>
        <Modal.Title>Related Activities</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading && <p>Loading...</p>}
        {!loading && relatedActivities.length > 0 && (<ActivitiesTable activities={relatedActivities} />)}
        {!loading && relatedActivities.length === 0 && (<p>No related activities found</p>)}
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={closeModal}>Close</Button>
      </Modal.Footer>
    </Modal>
  )
}

export default RelatedActivitiesModal
