import React from 'react'
import Table from 'react-bootstrap/Table'
import { ActivityRow } from '../api'

interface ActivitiesTableProps {
  activities: Array<ActivityRow>
}

export function ActivitiesTable({
  activities,
}: ActivitiesTableProps) {
  return (
    <Table>
      <thead>
        <tr>
          <td>date</td>
          <td>account</td>
          <td>description</td>
          <td>amount</td>
        </tr>
      </thead>
      <tbody>
        {activities.map(activity => (
          <tr key={activity.id}>
            <td>{activity.date}</td>
            <td>{activity.account}</td>
            <td>{activity.desc}</td>
            <td>{activity.amount}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  )
}
