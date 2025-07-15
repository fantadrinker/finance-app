import { Button, ButtonGroup, Modal } from "react-bootstrap";
import { ActivityRow, deleteActivity } from "../api"
import { ActivitiesTable } from "./ActivitiesTable";
import { useCallback, useContext, useState } from "react";
import { MultiSelectContext } from "../Contexts/MultiSelectContext";
import { useAuth0TokenSilent } from "../hooks";

interface SelectedActivitiesModalProps {
  activities: ActivityRow[];
  show: boolean;
  closeModal: (message?: string) => void
}

export function SelectedActivitiesModal({
  activities,
  show,
  closeModal
}: SelectedActivitiesModalProps) {
  const auth = useAuth0TokenSilent()
  const {
    selectedActivities
  } = useContext(MultiSelectContext)


  const [loading, setLoading] = useState<boolean>(false)

  const [error, setError] = useState<string | undefined>(undefined)

  const bulkDelete = useCallback(() => {
    if (!auth) {
      console.error('missing auth token')
      setError('missing auth token')
      return
    }
    setLoading(true)
    const results = selectedActivities.map(({id}) => deleteActivity(auth, id))
    Promise.all(results).then(() => {
      closeModal("delete successful")
    }).catch((err) => {
      console.error(err)
      setError(err)
    }).finally(() => {
      setLoading(false)
    })
  }, [auth, selectedActivities, closeModal])
  return (
    <Modal show={show} onHide={closeModal} size="lg" >
      <Modal.Header>Selected Activities</Modal.Header>
      <Modal.Body>
        {error !== undefined && (<Modal.Dialog>{error}</Modal.Dialog>)}
        <ActivitiesTable 
          activities={activities}
        />
      </Modal.Body>
      <Modal.Footer>
        <ButtonGroup>
          <Button disabled={loading} onClick={bulkDelete}>Delete</Button>
          <Button disabled={loading} >Categorize</Button>
          <Button disabled={loading} onClick={() => closeModal()}>Close</Button>
        </ButtonGroup>
      </Modal.Footer>
    </Modal>
  )
}