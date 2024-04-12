import { ActivityRow } from '../api';
import { ActivitiesTable } from './ActivitiesTable';

interface DeletedActivitiesTableProps {
  activities: ActivityRow[]
}

export const DeletedActivitiesTable = ({
  activities
}: DeletedActivitiesTableProps) => {

  return (
    <div>
      <h1>Deleted Activities</h1>
      <p>Deleted activities will be listed here.</p>
      {activities.length > 0? <ActivitiesTable activities={activities} />: <p>No deleted activities found.</p>}
    </div>
  )
}

export default DeletedActivitiesTable