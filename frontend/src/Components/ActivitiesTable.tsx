import { useContext, useEffect, useMemo, useState } from 'react'
import { v4 as uuidV4 } from 'uuid'
import Table from 'react-bootstrap/Table'
import { ActivityRow } from '../api'
import { Button, Dropdown, Form, Spinner } from 'react-bootstrap'
import { MultiSelectContext } from '../Contexts/MultiSelectContext'

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
    actions?: ActivityAction[]
    addActivity?: boolean
  }
}

export function ActivitiesTable({ 
  activities, 
  hasMore, 
  options, 
  loading, 
  onScrollToEnd 
}: ActivitiesTableProps) {

  const {selectedIds, updateSelectedActivities, selectNewActivity, unselectNewActivity} = useContext(MultiSelectContext)

  const [newActivities, setNewActivities] = useState<ActivityRow[]>([])

  const [editingActivity, setEditingActivity] = useState<ActivityRow>({
    id: '',
    account: '',
    date: '',
    category: '', 
    amount: 0, 
    desc: ''
  })

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

  const allActivities = useMemo(() => [...activities, ...newActivities], [activities, newActivities])
  const isAllSelected = useMemo(() => {
    return allActivities.length > 0 && allActivities.every(({id}) => selectedIds.has(id))
  }, [selectedIds, allActivities])

  let colCount = 4
  if (options?.showCategories) {
    colCount++
  }
  if (options?.actions) {
    colCount++
  }

  const addNewActivities = () => {
    const {
      date,
      account,
      category,
      amount,
      desc
    } = editingActivity
    if (date === '' || desc === '' || amount === 0) {
      // this shouldn't happen
      return
    }

    setNewActivities([...newActivities, {
      id: uuidV4(),
      date,
      account: account ?? "",
      category: category ?? desc,
      amount,
      desc,
    }])
    setEditingActivity({
      id: '',
      account: '',
      date: '',
      category: '', 
      amount: 0, 
      desc: ''
    })
  }

  return (
    <Table striped bordered hover width="100%" data-testid="activity-table">
      <thead>
        <tr>
          <td className="w-4"><Form.Check
            type="checkbox"
            checked={isAllSelected}
            onChange={(event) => {
              if (event.target.checked) {
                updateSelectedActivities([...activities, ...newActivities]) 
              }
              else {
                updateSelectedActivities([])
              }
            }} 
          /></td>
          <td className="lg:w-32 md:w-16">Date</td>
          <td className="lg:w-40 md:w-20">Account</td>
          <td className="">Description</td>
          {options?.showCategories && <td className="lg:w-20 md:w-10">Category</td>}
          <td className="w-20">Amount</td>
          {options?.actions && <td>Actions</td>}
        </tr>
      </thead>
      <tbody>
        {options?.addActivity && (<tr>
          <td>
            <Form.Control type="checkbox" value={1} />
          </td>
          <td>
            <Form.Control 
              type="date" 
              value={editingActivity.date} 
              onChange={(e) => setEditingActivity({
                ...editingActivity,
                date: e.target.value
              })} />
          </td>
          <td>
            <Form.Control 
              type="text" 
              value={editingActivity.account}
              onChange={(e) => setEditingActivity({
                ...editingActivity,
                account: e.target.value
              })}
            />
          </td>
          <td>
            <Form.Control 
              type="text" 
              value={editingActivity.desc}
              onChange={(e) => setEditingActivity({
                ...editingActivity,
                desc: e.target.value,
              })}
            />
          </td>
          {options?.showCategories && (<td>
            <Form.Control type="text" 
              value={editingActivity.category}
              onChange={(e) => setEditingActivity({
                ...editingActivity,
                category: e.target.value
              })}
            />
          </td>)}
          <td>
            <Form.Control 
              type="number" 
              value={editingActivity.amount}
              onChange={(e) => setEditingActivity({
                ...editingActivity,
                amount: parseInt(e.target.value, 10)
              })}
            />
          </td>
          <td>
            <Button onClick={addNewActivities} >Add</Button>
          </td>
        </tr>)}

        {allActivities.map(activity => (
          <tr key={activity.id}>
            <td><Form.Check 
              type="checkbox" 
              checked={selectedIds.has(activity.id)} 
              onChange={(event) => {
                if (event.target.checked && !selectedIds.has(activity.id)) {
                  selectNewActivity(activity)
                } else if (!event.target.checked && selectedIds.has(activity.id)) {
                  unselectNewActivity(activity.id)
                }
              }} 
            /></td>
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
            <td colSpan={colCount} className="text-center">
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
