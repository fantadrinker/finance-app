import { Button, ButtonGroup, Modal } from "react-bootstrap";
import { ActivityRow } from "../api"
import { ActivitiesTable } from "./ActivitiesTable";

interface SelectedActivitiesModalProps {
  activities: ActivityRow[];
  show: boolean;
  closeModal: () => void
}

export function SelectedActivitiesModal({
  activities,
  show,
  closeModal
}: SelectedActivitiesModalProps) {
  return (
    <Modal show={show} onHide={closeModal}>
      <Modal.Header>Selected Activities</Modal.Header>
      <Modal.Body>
        <ActivitiesTable 
          activities={activities}
        />
      </Modal.Body>
      <Modal.Footer>
        <ButtonGroup>
          <Button>Delete</Button>
          <Button>Categorize</Button>
          <Button onClick={closeModal}>Close</Button>
        </ButtonGroup>
      </Modal.Footer>
    </Modal>
  )
}