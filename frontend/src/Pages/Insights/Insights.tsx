import { useState, useEffect } from 'react'
import Spinner from 'react-bootstrap/Spinner'
import { Link } from 'react-router-dom'
import { getInsights, Insight } from '../../api'
import { CategoryCard } from '../../Components/CategoryCard'
import { MonthlyCard } from '../../Components/MonthlyCard'
import { useAuth0WithTokenSilent } from '../../hooks'

/**
 * TODO: 1. add a stacked bar chart to show the breakdown of each category https://recharts.org/en-US/examples/StackedBarChart
 * @param param0
 * @returns
 */

export const Insights = () => {
  const { user_id, token } = useAuth0WithTokenSilent()
  const [insights, setInsights] = useState<Array<Insight>>([])
  const [loading, setLoading] = useState<boolean>(false)
  const isLoggedIn = !!token && !!user_id

  useEffect(() => {
    if (!isLoggedIn) {
      return
    }
    setLoading(true)
    // fetch data from /insights endpoint
    getInsights(user_id, token)
      .then(result => {
        setInsights(result)
      })
      .catch(err => {
        console.log(err)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [isLoggedIn, token, user_id])

  if (!isLoggedIn) {
    return (
      <div>
        Not authenticated, please <Link to="/login">Log in </Link>
      </div>
    )
  }

  return insights.length === 0 || loading ? (
    <Spinner animation="border" role="status" />
  ) : (
    <div
      style={{
        display: 'flex',
        flexFlow: 'row wrap',
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: '20px',
        gap: '10px',
      }}
    >
      <CategoryCard insights={insights} />
      <MonthlyCard insights={insights} />
    </div>
  )
}
