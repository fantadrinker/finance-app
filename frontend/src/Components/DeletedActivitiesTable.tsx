import React from 'react';
import { ActivityRow } from '../api';
import { ActivitiesTable } from './ActivitiesTable';

interface DeletedActivitiesTableProps {
  loadData: () => Promise<ActivityRow[]>
}

export const DeletedActivitiesTable = ({
  loadData
}: DeletedActivitiesTableProps) => {
  const [activities, setActivities] = React.useState<ActivityRow[]>([])

  React.useEffect(() => {
    loadData()
      .then(setActivities)
      .catch(err => {
        console.log(`error fetching deleted activities: ${err}`)
      })
  }, [loadData])

  return (
    <div>
      <h1>Deleted Activities</h1>
      <p>Deleted activities will be listed here.</p>
      {activities.length > 0? <ActivitiesTable activities={activities} />: <p>No deleted activities found.</p>}
    </div>
  )
}

export default DeletedActivitiesTable