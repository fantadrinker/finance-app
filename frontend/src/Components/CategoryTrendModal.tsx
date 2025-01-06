import { useEffect, useState } from "react";
import { Button, Modal } from "react-bootstrap";
import { ActivityRow, getActivities, getInsights } from "../api";
import { useAuth0TokenSilent } from "../hooks";
import { CartesianGrid, Legend, Line, LineChart, Tooltip, XAxis, YAxis } from "recharts";
import { CategoricalChartFunc } from "recharts/types/chart/generateCategoricalChart";
import { ActivitiesTable } from "./ActivitiesTable";

interface CategoryTrendModalProps {
  show: boolean
  category: string | null
  closeModal: () => void
}

interface CategoryStat {
  month: string
  amount: number
}

function useCategoryTrend(category: string | null) {
  const token = useAuth0TokenSilent()
  const [loading, setLoading] = useState<boolean>(false)
  const [categoryTrend, setCategoryTrend] = useState<CategoryStat[]>([])
  useEffect(() => {
    if (!category) {
      setCategoryTrend([])
      return
    }
    if (!token) {
      console.error('missing auth token')
      return
    }
    const startDate = new Date()
    const currMonth = startDate.getMonth()
    startDate.setMonth(currMonth - 6, 1)
    const startDateStr = startDate.toISOString().split('T')[0]
    setLoading(true)
    getInsights(token, startDateStr, [category])
      .then((insights) => {
        setLoading(false)
        setCategoryTrend(insights.map(({start_date, categories}) => {
          return {
            month: start_date ?? startDateStr,
            amount: categories.reduce((amt, breakdown) => {
              if (breakdown.category === category) {
                return amt + breakdown.amount
              }
              return amt
            }, 0)
          }
        }))
      })
      .catch((err) => {
        console.error(err)
      })
  }, [token, category])
  return {
    loading,
    categoryTrend
  }
}

export function useMonthlyActivities(category: string | null) {
  const token = useAuth0TokenSilent()
  const [month, setMonth] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [activities, setActivities] = useState<ActivityRow[]>([])

  useEffect(() => {
    if (!token || !month || !category) {
      setActivities([])
      return
    }
    
    setLoading(true)

    const endDate = new Date(month)
    endDate.setMonth(endDate.getMonth() + 2, 0)

    getActivities(token, null, {
      size: 10,
      category,
      startDate: month,
      endDate: endDate.toISOString().split('T')[0]
    }).then((response) => {
      setActivities(response.data)
      setLoading(false)
    }).catch((err) => {
      console.error(err)
    })

  }, [token, month, setLoading, category])

  return {
    activities,
    month,
    setMonth,
    loading
  }
}

export function CategoryTrendModal(props: CategoryTrendModalProps) {
  const {
    show,
    category,
    closeModal
  } = props

  const {
    loading: loadingTrend,
    categoryTrend
  } = useCategoryTrend(category)

  const {
    activities,
    loading: loadingActivities,
    setMonth,
    month
  } = useMonthlyActivities(category)

  const handleChartClick: CategoricalChartFunc = (state) => {
    setMonth(state.activeLabel ?? null)
  }

  return (<Modal show={show} onHide={closeModal}>
    <Modal.Header>
      <h2>Trends for {category}</h2>
    </Modal.Header>
    <Modal.Body>
      {loadingTrend? (<p>loading...</p>): (
        <LineChart 
          width={400} 
          height={400} 
          data={categoryTrend} 
          onClick={handleChartClick}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="amount" />
        </LineChart>
      )}
      {loadingActivities? (
        <p>loading...</p>
      ): (
        <div>
          <h2>Activities for {month}</h2>
          <ActivitiesTable 
            activities={activities}
          />
        </div>
      )}
    </Modal.Body>
    <Modal.Footer>
      <Button onClick={closeModal}>
        Close
      </Button>
    </Modal.Footer>
  </Modal>)
}