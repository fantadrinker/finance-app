import { useContext, useState } from "react";
import { ActivityRow, postActivitiesJSON } from "../api";
import { useAuth0TokenSilent } from "../hooks";
import { downloadFinanceData } from "../helpers";
import { Button, Modal } from "react-bootstrap";
import { ActivitiesTable } from "./ActivitiesTable";
import { MultiSelectContext } from "../Contexts/MultiSelectContext";

interface UploadPreviewModalProps {
  show: boolean;
  closeModal: () => void;
  activities: ActivityRow[];
  setToastMessage: (msg: string) => void
}

export function UploadPreviewModal({
  show,
  closeModal,
  activities,
  setToastMessage
}: UploadPreviewModalProps) {
  const {
    selectedIds
  } = useContext(MultiSelectContext)

  const [processingFile, setProcessingFile] = useState<boolean>(false)
  const token = useAuth0TokenSilent()

  const processActivitiesJSON = async () => {
    if (!token) {
      setToastMessage('not authenticated')
      return
    }

    setProcessingFile(true)
    const selectedActivities = activities.filter(({id}) => selectedIds.has(id))
    try {
      await postActivitiesJSON(token, selectedActivities)
      setProcessingFile(false)
      if (!selectedActivities) {
        closeModal()
      }
      setToastMessage('success')
      closeModal()
    } catch (e) {
      setToastMessage('something went wrong')
    }
  }

  const downloadAsCsv = async (event: React.FormEvent) => {
    downloadFinanceData(activities ?? [])
  }

  return ( 
      <Modal
        show={!!show}
        onHide={closeModal}
        size='lg'
      >
        <Modal.Header closeButton>
          <Modal.Title>Preview Activities</Modal.Title>
        </Modal.Header>
        <Modal.Body className="max-h-[60vh] overflow-scroll">
          <ActivitiesTable
            activities={activities}
          />
        </Modal.Body>
        <Modal.Footer>
          <span>
            {selectedIds.size} Activities Selected
          </span>
          <Button onClick={closeModal}>Close</Button>
          <Button onClick={processActivitiesJSON} disabled={!!processingFile && selectedIds.size > 0}>Process Selected Activities</Button>
          <Button onClick={downloadAsCsv} disabled={!!processingFile}>Download as CSV</Button>
        </Modal.Footer>
      </Modal>
  )
}