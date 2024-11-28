import { useState } from "react";
import { ActivityRow, postActivitiesJSON } from "../api";
import { useAuth0TokenSilent } from "../hooks";
import { downloadFinanceData } from "../helpers";
import { Button, Modal } from "react-bootstrap";
import { ActivitiesTable } from "./ActivitiesTable";

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
  const [processingFile, setProcessingFile] = useState<boolean>(false)
  const token = useAuth0TokenSilent()

  const processActivitiesJSON = async () => {
    if (!token) {
      setToastMessage('not authenticated')
      return
    }

    setProcessingFile(true)
    try {
      await postActivitiesJSON(token, activities ?? [])
      setProcessingFile(false)
      if (activities) {
        closeModal()
      }
      setToastMessage('success')
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
          <Button onClick={closeModal}>Close</Button>
          <Button onClick={processActivitiesJSON} disabled={!!processingFile}>Process File</Button>
          <Button onClick={downloadAsCsv} disabled={!!processingFile}>Download as CSV</Button>
        </Modal.Footer>
      </Modal>
  )
}