import React, { useEffect, useState } from 'react'
import Modal from 'react-bootstrap/Modal'
import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/Button'
import { useAuth0TokenSilent } from '../hooks'
import { ActivityRow, getRelatedActivities } from '../api'
import { ActivitiesTable } from './ActivitiesTable'

interface RelatedActivitiesModalProps {
  show: boolean
  closeModal: () => void
  activityId: string
  submit: (newCategory: string, newDescription: string) => void
}

const RelatedActivitiesModal = ({
  show,
  closeModal,
  activityId,
}: RelatedActivitiesModalProps) => {

  const token = useAuth0TokenSilent()
  const [relatedActivities, setRelatedActivities] = useState<Array<ActivityRow>>([])

  useEffect(() => {
    if (!token || !activityId) {
      return
    }
    // fetch related activities
    getRelatedActivities(token, activityId).then(({ data }) => {
      console.log(data)
      setRelatedActivities(data)
    }).catch(err => {
      console.log(err)
    })
  }, [token, activityId])

  return (
    <Modal show={show} onHide={closeModal}>
      <Modal.Header closeButton>
        <Modal.Title>Update Category Mapping</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Label>Description Text</Form.Label>
        <ActivitiesTable activities={relatedActivities} />
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={closeModal}>Close</Button>
      </Modal.Footer>
    </Modal>
  )
}

export default RelatedActivitiesModal
