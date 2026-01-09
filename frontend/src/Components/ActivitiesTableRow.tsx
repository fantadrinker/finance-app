import { useContext, useState } from "react"
import { Badge, Dropdown, Form } from 'react-bootstrap'
import { ActivityRow, patchActivity } from "../api"
import { ActivitiesContext } from "../Contexts/ActivitiesContext"
import { MultiSelectContext } from "../Contexts/MultiSelectContext"
import { useAuth0TokenSilent } from "../hooks"
import { ActivityAction } from "./ActivitiesTable"
import { CategorySelect } from "./CategorySelect"

interface ActivityTableRowProps {
  activity: ActivityRow
  size?: 's' | 'm' | 'l'
  showCategories?: boolean
  actions?: ActivityAction[]
  showPredictions?: boolean
}

export function ActivityTableRow(props: ActivityTableRowProps) {
  const { activity, size, showCategories, showPredictions, actions } = props
  const token = useAuth0TokenSilent()
  const {selectedIds, selectNewActivity, unselectNewActivity} = useContext(MultiSelectContext)
  const { refresh } = useContext(ActivitiesContext)
  const [editingDescription, setEditingDescription] = useState<string | null>(null)
  return (
          <tr>
            {size !== 's' && (
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
            )}
            <td><span className="inline-block whitespace-nowrap text-truncate overflow-hidden lg:w-28 md:w-20">{activity.date}</span></td>
            {size !== 's' && (
              <td><span className="inline-block whitespace-nowrap text-truncate overflow-hidden lg:w-32 md:w-20">{activity.account}</span></td>
            )}
            <td> {editingDescription? (
              <input 
                value={editingDescription}
                onChange={(e) => setEditingDescription(e.target.value)}
                onBlur={() => {
                  if (token) {
                    patchActivity(token, activity.id, { desc: editingDescription} )
                      .then(refresh)
                  }
                  setEditingDescription(null)
                }}
                type="text" /> ): (
              <span 
                className="inline-block whitespace-nowrap text-truncate overflow-hidden lg:w-56 md:w-40"
                onClick={() => setEditingDescription(activity.desc)}>{activity.desc}</span>
                )}
            </td>
            {showCategories && <td>
              <span className="inline-block whitespace-nowrap text-truncate overflow-hidden lg:w-28 md:w-20">
                <CategorySelect
                  category={activity.category}
                  defaultLabel="Uncategorized"
                  onCategoryChange={(category) => {
                    if (token) {
                      patchActivity(token, activity.id, { category } )
                      .then(refresh)
                    }
                  }}
                />
              </span>
            {showPredictions && activity.predicted.length > 0 && activity.predicted.map((val) => {
                const isPredictedApplied = activity.category === val
                return (<Badge
                  className="cursor-pointer"
                  // TODO: figure out what to do when user clicks this
                  // onClick={() => setLocalActivities(updateActivityCategory(localActivities, activity.id, val))}
                  bg={isPredictedApplied? "primary": "secondary"}>
                    {val}
                  </Badge>)
              })}
            </td>}
            <td><span className="inline-block whitespace-nowrap text-truncate lg:w-16 md:w-12">{activity.amount}</span></td>
            {actions && (
              <td>
                <Dropdown>
                  <Dropdown.Toggle variant="success" id="dropdown-basic" data-testid="activity-action-dropdown">
                    Actions
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    {actions.map(action => (
                      <Dropdown.Item key={`${activity.id}_${action.type}`} role="button" onClick={() => action.onClick(activity)}>
                        {action.text}
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                </Dropdown>
              </td>
            )}
          </tr>
  )

}
