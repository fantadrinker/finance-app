import { useCallback } from 'react'
import { useAuth0TokenSilent } from '../hooks'
import { useFinanceDataFetcher } from '../Pages/Home/effects'
import { deleteActivity } from '../api'
import { Modal } from 'react-bootstrap'
import { ActivitiesTable, ActivityActionType } from './ActivitiesTable'

interface FilteredActivitiesModalProps {
  open: boolean
  closeModal: () => void
  category: string
  startDate: string
  endDate: string
}

export function FilteredActivitiesModal({
  open,
  closeModal,
  category,
  startDate,
  endDate,
}: FilteredActivitiesModalProps) {
  const token = useAuth0TokenSilent()
  const setError = useCallback((e: string) => console.log(e), [])
  const {
    financeData,
    loading: loadingActivities,
    reFetch: refetchActivities,
  } = useFinanceDataFetcher(token, setError, {
    refetchOnChange: true,
    limit: 20,
    category,
    startDate,
    endDate,
  })

  function deleteAndFetchActivities(activityId: string) {
    if (!token) return
    deleteActivity(token, activityId)
      .then(response => {
        if (!response.ok) {
          console.log('Failed to delete activity')
          return
        }
        refetchActivities(true, 20)
      })
      .catch(err => {
        console.log(err)
      })
  }

  return (
    <Modal show={open} onHide={closeModal} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          Activities for {category} from {startDate} to {endDate}{' '}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <ActivitiesTable
          activities={financeData}
          loading={loadingActivities}
          options={{
            actions: [
              {
                type: ActivityActionType.DELETE,
                text: 'Delete',
                onClick: activity => deleteAndFetchActivities(activity.id),
              },
            ],
          }}
        />
      </Modal.Body>
      <Modal.Footer>
        <button onClick={closeModal}>Close</button>
      </Modal.Footer>
    </Modal>
  )
}
