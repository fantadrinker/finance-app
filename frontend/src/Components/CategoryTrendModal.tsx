import { useEffect, useState } from "react";
import { Button, Modal } from "react-bootstrap";
import { getInsights } from "../api";
import { useAuth0TokenSilent } from "../hooks";
import { CartesianGrid, Legend, Line, LineChart, Tooltip, XAxis, YAxis } from "recharts";

interface CategoryTrendModalProps {
  show: boolean
  category: string | null
  closeModal: () => void
}

interface CategoryStat {
  month: string
  amount: number
}

export function CategoryTrendModal(props: CategoryTrendModalProps) {
  const {
    show,
    category,
    closeModal
  } = props
  const token = useAuth0TokenSilent()

  const [categoryTrend, setCategoryTrend] = useState<CategoryStat[]>([])

  useEffect(() => {
    if (!show || !category) {
      setCategoryTrend([])
      return
    }
    if (!token) {
      console.error('missing auth token')
      return
    }
    const currDate = new Date()
    const startDate = new Date(currDate.setMonth(currDate.getMonth() - 6))
    const startDateStr = startDate.toISOString().split('T')[0]
    getInsights(token, startDateStr, [category])
      .then((insights) => {
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
  }, [token, show, category])

  return (<Modal show={show} onHide={closeModal}>
    <Modal.Header>
      <h2>Trends for {category}</h2>
    </Modal.Header>
    <Modal.Body>
      <LineChart width={400} height={400} data={categoryTrend}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="amount" />
      </LineChart>
    </Modal.Body>
    <Modal.Footer>
      <Button onClick={closeModal}>
        Close
      </Button>
    </Modal.Footer>
  </Modal>)
}