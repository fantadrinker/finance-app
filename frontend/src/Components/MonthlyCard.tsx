import { useCallback, useMemo, useState } from 'react'
import Card from 'react-bootstrap/Card'
import {
  Tooltip,
  BarChart,
  YAxis,
  XAxis,
  Bar,
  CartesianGrid,
  Cell,
} from 'recharts'
import { Insight } from '../api'
import { Modal, Table } from 'react-bootstrap'
import { ActivitiesTable } from './ActivitiesTable'
import { useFinanceDataFetcher } from '../Pages/Home/effects'
import { useAuth0TokenSilent } from '../hooks'

interface MonthlyBreakdown {
  month: string
  amount: number
}

interface MonthlyCardProps {
  insights: Array<Insight>
}

function calculateMonthlyBreakdown(
  insights: Array<Insight>,
): Array<MonthlyBreakdown> {
  return insights
    .map(({ start_date, categories }) => {
      return {
        month: start_date || '00-00-00',
        amount: categories.reduce((acc, cur) => {
          const amount = cur.amount
          return acc + (amount > 0 ? amount : 0)
        }, 0),
      }
    })
}

interface ExpandCategoryActivityProps {
  category: string
  month: string
  expanded: boolean
}

export const MonthlyCard = ({ insights }: MonthlyCardProps) => {
  // TODO: call an api to get the top categories for recent months
  const token = useAuth0TokenSilent()
  const [activeIndex, setActiveIndex] = useState(-1)
  const [hoveredIndex, setHoveredIndex] = useState(-1)
  const [expandCategoryActivity, setExpandCategoryActivity] = useState<ExpandCategoryActivityProps>({
    category: '',
    month: '',
    expanded: false,
  })

  const {
    monthStart: expandCategoryMonthStart,
    monthEnd: expandCategoryMonthEnd,
  } = useMemo(() => {
    if (!expandCategoryActivity.month) return { monthStart: new Date(), monthEnd: new Date() }
    const date = new Date(expandCategoryActivity.month)
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)
    return {
      monthStart,
      monthEnd,
    }
  }, [expandCategoryActivity.month])

  const handleMouseEnter = useCallback((_: any, index: number) => {
    setHoveredIndex(index)
  }, [])

  const serError = useMemo(() => (e: string) => {
    console.log(e)
  }, [])

  const { financeData, loading: loadingActivities } = useFinanceDataFetcher(token, serError, {
    refetchOnChange: true,
    limit: expandCategoryActivity.expanded? 20: 0,
    category: expandCategoryActivity.category,
    // todo: calculate start and end date for the month
    startDate: expandCategoryMonthStart.toISOString().split('T')[0],
    endDate: expandCategoryMonthEnd.toISOString().split('T')[0],
  })

  const slicedInsights = insights.sort((a, b) => {
    if (!a.start_date || !b.start_date) return 0
    return new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
  }).slice(0, 6)

  const data = calculateMonthlyBreakdown(slicedInsights)

  const isExpanded = activeIndex !== -1

  const handleClickBarChart = (_: any, index: number) => {
    // expands card and show a list of top categories in the month
    // should also support a toggle to show the trend of a specific
    // category over time.
    if (activeIndex === index) {
      setActiveIndex(-1)
    } else {
      setActiveIndex(index)
    }
  }

  function showMoreInModal(category: string, month: string) {
    console.log(`show more for ${category} in ${month}`)
    setExpandCategoryActivity({ category, month, expanded: true })
  }
  const cardStyles = isExpanded
    ? {
        flexGrow: 2,
        maxWidth: '800px',
        transition: 'all 0.2s linear 0s',
      }
    : {
        flexGrow: 1,
        maxWidth: '400px',
        transition: 'all 0.2s linear 0s',
      }

  const selectedAllCategories = isExpanded
    ? insights[activeIndex].categories
    : null

  const topCategories = (isExpanded && selectedAllCategories)
    ? selectedAllCategories
        .sort((a, b) => {
          return b.amount - a.amount
        })
        .slice(0, 5)
    : []

  return (
    <Card style={cardStyles}>
      <Card.Body>
        <Card.Title>Monthly Trends</Card.Title>
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-evenly',
            cursor: isExpanded ? 'pointer' : 'default',
          }}
        >
          <BarChart width={360} height={360} data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Bar
              dataKey="amount"
              fill="#8884d8"
              onClick={handleClickBarChart}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={() => setHoveredIndex(-1)}
            >
              {data.map((_, index) => (
                <Cell
                  cursor="pointer"
                  fill={
                    index === activeIndex
                      ? '#82ca9d'
                      : index === hoveredIndex
                      ? '#87a9b5'
                      : '#8884d8'
                  }
                  key={`cell-${index}`}
                />
              ))}
            </Bar>
          </BarChart>
          {isExpanded && (
            <div
              className="mx-4 w-[300px] h-[300px]"
              style={{ maxWidth: '360px', maxHeight: '360px' }}
            >
              <h4>Top spending categories for {data[activeIndex].month}</h4>
              <Table>
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {topCategories.map(({ category, amount }) => (
                    <tr key={category} onClick={() => showMoreInModal(category, data[activeIndex].month)}>
                      <td>{category}</td>
                      <td>{amount}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </div>
      </Card.Body>
      <Modal show={expandCategoryActivity.expanded} onHide={() => setExpandCategoryActivity({ expanded: false , category: '', month: ''})}>
        <Modal.Header closeButton>
          <Modal.Title>Activities for {expandCategoryActivity.category} in {expandCategoryActivity.month}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <ActivitiesTable activities={financeData} loading={loadingActivities} />
        </Modal.Body>
      </Modal>
    </Card>
  )
}
