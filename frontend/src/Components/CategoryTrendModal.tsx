import { useEffect, useState } from "react";
import { Modal } from "react-bootstrap";
import { getInsights } from "../api";
import { useAuth0TokenSilent } from "../hooks";

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
    const startDate = new Date(currDate.setMonth(currDate.getMonth() - 4))
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
    {JSON.stringify(categoryTrend)}
  </Modal>)
}