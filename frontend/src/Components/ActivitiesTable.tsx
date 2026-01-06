import {useContext, useEffect, useMemo, useState } from 'react'
import { v4 as uuidV4 } from 'uuid'
import Table from 'react-bootstrap/Table'
import { ActivityRow } from '../api'
import { Button, Form, Spinner } from 'react-bootstrap'
import { MultiSelectContext } from '../Contexts/MultiSelectContext'
import { ActivityTableRow } from './ActivitiesTableRow'

export enum ActivityActionType {
  DELETE = 'DELETE',
  UPDATE = 'UPDATE',
  SEE_RELATED = 'SEE_RELATED',
}

export interface ActivityAction {
  type: ActivityActionType
  text: string
  onClick: (val: ActivityRow) => void
}

interface ActivitiesTableProps {
  activities: ActivityRow[]
  hasMore?: boolean
  loading?: boolean
  size?: 's' | 'm' | 'l'
  onScrollToEnd?: () => void
  options?: {
    showCategories?: boolean
    actions?: ActivityAction[]
    addActivity?: boolean
    onActivityCategoryChange?: (activity: ActivityRow, newCategory: string) => void
    refetch?: () => void
  }
}

export function ActivitiesTable({ 
  activities, 
  hasMore, 
  options, 
  loading, 
  onScrollToEnd,
  size,
}: ActivitiesTableProps) {

  const {selectedIds, updateSelectedActivities} = useContext(MultiSelectContext)

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
          {size !== 's' && (
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
          )}
          <td className="lg:w-32 md:w-16">Date</td>
          {size !== 's' && (
            <td className="lg:w-40 md:w-20">Account</td>
          )}
          <td className="">Description</td>
          {options?.showCategories && <td className="lg:w-20 md:w-10">Category</td>}
          <td className="w-20">Amount</td>
          {options?.actions && <td>Actions</td>}
        </tr>
      </thead>
      <tbody>
        {options?.addActivity && (<tr>
          {size !== 's' && (
            <td>
              <Form.Control type="checkbox" value={1} />
            </td>
          )}
         <td>
            <Form.Control 
              type="date" 
              value={editingActivity.date} 
              onChange={(e) => setEditingActivity({
                ...editingActivity,
                date: e.target.value
              })} />
          </td>
          {size !== 's' && (
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
          )}
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
          <ActivityTableRow activity={activity}
            key={activity.id}
            onActivityCategoryChange={options?.onActivityCategoryChange}
            actions={options?.actions ?? []}
            showCategories={options?.showCategories ?? false}
            refetch={options?.refetch}
          />
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
