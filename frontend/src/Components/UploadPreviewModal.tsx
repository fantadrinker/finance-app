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
    selectedActivities
  } = useContext(MultiSelectContext)

  const [processingFile, setProcessingFile] = useState<boolean>(false)
  const token = useAuth0TokenSilent()

  const processActivitiesJSON = async () => {
    if (!token) {
      setToastMessage('not authenticated')
      return
    }

    setProcessingFile(true)
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
        size='xl'
      >
        <Modal.Header closeButton>
          <Modal.Title>Preview Activities</Modal.Title>
        </Modal.Header>
        <Modal.Body className="max-h-[60vh] overflow-scroll">
          <ActivitiesTable
            activities={activities}
            options={{
              addActivity: true,
              showCategories: true,
            }}
          />
        </Modal.Body>
        <Modal.Footer>
          <span>
            {selectedActivities.length} Activities Selected
          </span>
          <Button onClick={closeModal}>Close</Button>
          <Button onClick={processActivitiesJSON} disabled={!!processingFile || selectedActivities.length === 0}>Process Selected Activities</Button>
          <Button onClick={downloadAsCsv} disabled={!!processingFile}>Download as CSV</Button>
        </Modal.Footer>
      </Modal>
  )
}