import { useEffect } from 'react'
import Table from 'react-bootstrap/Table'
import { ActivityRow } from '../api'
import { Button, Dropdown, Spinner } from 'react-bootstrap'

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
  hasMore?: boolean
  loading?: boolean
  onScrollToEnd?: () => void
  options?: {
    showCategories?: boolean
    actions: ActivityAction[]
  }
}

export function ActivitiesTable({ activities, hasMore, options, loading, onScrollToEnd }: ActivitiesTableProps) {
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
          <td className="lg:w-32 md:w-16">Date</td>
          <td className="lg:w-40 md:w-20">Account</td>
          <td className="">Description</td>
          {options?.showCategories && <td className="lg:w-20 md:w-10">Category</td>}
          <td className="w-20">Amount</td>
          {options?.actions && <td>Actions</td>}
        </tr>
      </thead>
      <tbody>
        
        {activities.map(activity => (
          <tr key={activity.id}>
            <td><span className="inline-block whitespace-nowrap text-truncate overflow-hidden lg:w-28 md:w-20">{activity.date}</span></td>
            <td><span className="inline-block whitespace-nowrap text-truncate overflow-hidden lg:w-32 md:w-20">{activity.account}</span></td>
            <td><span className="inline-block whitespace-nowrap text-truncate overflow-hidden lg:w-56 md:w-40">{activity.desc}</span></td>
            {options?.showCategories && <td><span className="inline-block whitespace-nowrap text-truncate overflow-hidden lg:w-28 md:w-20">{activity.category}</span></td>}
            <td><span className="inline-block whitespace-nowrap text-truncate lg:w-16 md:w-12">{activity.amount}</span></td>
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
        {hasMore && !loading && (
          <tr>
            <td colSpan={colCount}>
              <Button onClick={onScrollToEnd}>Load More</Button>
            </td>
          </tr>
        )}
      </tbody>
    </Table>
  )
}
