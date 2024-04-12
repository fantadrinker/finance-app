import { useEffect } from 'react'
import Table from 'react-bootstrap/Table'
import { ActivityRow } from '../api'
import { Dropdown, Spinner } from 'react-bootstrap'

export enum ActivityActionType {
  DELETE = 'DELETE',
  UPDATE = 'UPDATE',
  SEE_RELATED = 'SEE_RELATED',
}
interface ActivityAction {
  type: ActivityActionType
  text: string
  onClick: (val: ActivityRow) => void
}

interface ActivitiesTableProps {
  activities: ActivityRow[]
  loading?: boolean
  onScrollToEnd?: () => void
  options?: {
    showCategories?: boolean
    actions: ActivityAction[]
  }
}

export function ActivitiesTable({ activities, options, loading, onScrollToEnd }: ActivitiesTableProps) {
  useEffect(() => {
    if (!onScrollToEnd) {
      return
    }
    
    window.onscroll = () => {
      if (
        !loading &&
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 1
      ) {
        onScrollToEnd()
      }
    }
    return () => {
      window.onscroll = null
    }
  }, [loading, onScrollToEnd])

  let colCount = 4
  if (options?.showCategories) {
    colCount++
  }
  if (options?.actions) {
    colCount++
  }

  return (
    <Table striped bordered hover width="100%" data-testid="activity-table">
      <thead>
        <tr>
          <td className="w-32">Date</td>
          <td className="w-40">Account</td>
          <td>Description</td>
          {options?.showCategories && <td className="w-20">Category</td>}
          <td className="w-20">Amount</td>
          {options?.actions && <td>Actions</td>}
        </tr>
      </thead>
      <tbody>
        
        {activities.map(activity => (
          <tr key={activity.id}>
            <td>{activity.date}</td>
            <td>{activity.account}</td>
            <td>{activity.desc}</td>
            {options?.showCategories && <td>{activity.category}</td>}
            <td>{activity.amount}</td>
            {options?.actions && (
              <td>
                <Dropdown>
                  <Dropdown.Toggle variant="success" id="dropdown-basic" data-testid="activity-action-dropdown">
                    Actions
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    {options.actions.map(action => (
                      <Dropdown.Item key={`${activity.id}_${action.type}`} role="button" onClick={() => action.onClick(activity)}>
                        {action.text}
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                </Dropdown>
              </td>
            )}
          </tr>
        ))}
        {loading && (
          <tr>
            <td colSpan={colCount}>
              <Spinner role="status" animation="border" />
            </td>
          </tr>
        )}
      </tbody>
    </Table>
  )
}
