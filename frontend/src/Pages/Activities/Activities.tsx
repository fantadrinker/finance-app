import Form from "react-bootstrap/Form";
import { ActivitiesTable, ActivityActionType } from "../../Components/ActivitiesTable";
import { useEffect, useState } from "react";
import { useAuth0TokenSilent } from "../../hooks";
import { ActivityRow, getActivities, getDeletedActivities, getUnmappedActivities } from "../../api";
import { Link } from "react-router-dom";

enum ViewType {
  Default = 'default',
  Deleted = 'deleted',
  Unmapped = 'unmapped'
}

export function Activities() {
  const token = useAuth0TokenSilent()
  const [viewType, setViewType] = useState<ViewType>(ViewType.Default)
  const [activities, setActivities] = useState<ActivityRow[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  
  useEffect(() => {
    if (!token) {
      return
    }
    setActivities([])
    setLoading(true)
    if (viewType === ViewType.Deleted) {
      getDeletedActivities(token).then((resp) => {
        setActivities(resp.data)
        setLoading(false)
      })
    } else if (viewType === ViewType.Unmapped) {
      getUnmappedActivities(token).then((resp) => {
        setActivities(resp.data)
        setLoading(false)
      })
    } else {
      getActivities(token, null, {
        size: 20
      }).then((resp) => {
        setActivities(resp.data)
        setLoading(false)
      })
    }
  }, [viewType, token])

  if (!token) {
    return (
      <div>
        Not authenticated, please <Link to="/login">Log in </Link>
      </div>
    )
  }

  return (<>
    <Form>
      <Form.Group>
        <Form.Label>View</Form.Label>
        <Form.Select value={viewType} onChange={(e) => setViewType(e.target.value as ViewType)}>
          <option value={ViewType.Default}>Latest</option>
          <option value={ViewType.Deleted}>Deleted</option>
          <option value={ViewType.Unmapped}>Unmapped</option>
        </Form.Select>
      </Form.Group>
    </Form>
    <ActivitiesTable 
      activities={activities} 
      loading={loading}
      options={{
        showCategories: true,
        actions: [
          {
            type: ActivityActionType.UPDATE,
            text: 'Update Mapping',
            onClick: () => {} // todo: open update modal
          },
          {
            type: ActivityActionType.DELETE,
            text: 'Delete',
            onClick: () => {} //todo: delete activitye
          }
        ]
      }}
    />
  </>
  )
}