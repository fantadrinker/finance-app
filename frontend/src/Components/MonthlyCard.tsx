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
import { CategoryBreakdown, deleteActivity, Insight } from '../api'
import { Modal, Table } from 'react-bootstrap'
import { ActivitiesTable, ActivityActionType } from './ActivitiesTable'
import { useFinanceDataFetcher } from '../Pages/Home/effects'
import { useAuth0WithTokenSilent } from '../hooks'
import { map, pipe, sort, take } from 'ramda'
import { cmpInsights, transformInsightToMonthlyBreakdown } from '../Helpers/InsightHelpers'

interface MonthlyCardProps {
  insights: Array<Insight>
}

interface ExpandCategoryActivityProps {
  category: string
  month: string
  expanded: boolean
}

export const MonthlyCard = ({ insights }: MonthlyCardProps) => {
  // TODO: call an api to get the top categories for recent months
  const { token , user_id} = useAuth0WithTokenSilent()
  const [activeIndex, setActiveIndex] = useState(-1)
  const [hoveredIndex, setHoveredIndex] = useState(-1)
  const [expandCategoryActivity, setExpandCategoryActivity] = useState<ExpandCategoryActivityProps>({
    category: '',
    month: '',
    expanded: false,
  })

  const isExpanded = useMemo(() => activeIndex !== -1, [activeIndex])
  const sortedInsights = useMemo(() => sort(cmpInsights, insights), [insights])
  const monthlyData = useMemo(() => 
    pipe(
      (insights: Insight[]) => take(6, insights),
      map(transformInsightToMonthlyBreakdown)
    )(sortedInsights)
  , [sortedInsights])

  const {
    monthStart: expandCategoryMonthStart,
    monthEnd: expandCategoryMonthEnd,
  } = useMemo(() => {
    const selectedMonthData = monthlyData.find(({ month }) => month === expandCategoryActivity.month)
    return {
      monthStart: selectedMonthData?.startDate,
      monthEnd: selectedMonthData?.endDate,
    }
  }, [monthlyData, expandCategoryActivity])

  const topCategories = useMemo(() => 
    isExpanded
      ? pipe(
        sort<CategoryBreakdown>((a, b) => b.amount - a.amount),
        (c: CategoryBreakdown[]) => take(5, c)
      )(sortedInsights[activeIndex].categories)
      : []
  , [isExpanded, sortedInsights, activeIndex])

  const handleMouseEnter = useCallback((_: any, index: number) => {
    setHoveredIndex(index)
  }, [])

  const serError = useMemo(() => (e: string) => {
    console.log(e)
  }, [])

  const { 
    financeData, 
    loading: loadingActivities, 
    reFetch: refetchActivities 
  } = useFinanceDataFetcher(user_id ?? null, token, serError, {
    refetchOnChange: true,
    limit: expandCategoryActivity.expanded? 20: 0,
    category: expandCategoryActivity.category,
    startDate: expandCategoryMonthStart,
    endDate: expandCategoryMonthEnd,
  })

  function deleteAndFetchActivities(activityId: string) {
    if (!token || !user_id) return
    deleteActivity(user_id, token, activityId).then((response) => {
      if (!response.ok) {
        console.log('Failed to delete activity')
        return
      }
      refetchActivities(true, 20)
    }).catch(err => {
      console.log(err)
    })
  }

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
          <BarChart width={360} height={360} data={monthlyData}>
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
              {monthlyData.map((_, index) => (
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
              <h4>Top spending categories for {monthlyData[activeIndex].month}</h4>
              <Table>
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {topCategories.map(({ category, amount }) => (
                    <tr key={category} onClick={() => showMoreInModal(category, monthlyData[activeIndex].month)}>
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
      <Modal 
        show={expandCategoryActivity.expanded} 
        onHide={() => setExpandCategoryActivity({ expanded: false , category: '', month: ''})}
        size='lg'
      >
        <Modal.Header closeButton>
          <Modal.Title>Activities for {expandCategoryActivity.category} in {expandCategoryActivity.month}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <ActivitiesTable 
            activities={financeData} 
            loading={loadingActivities} 
            options={{
              actions: [
                {
                  type: ActivityActionType.DELETE,
                  text: 'Delete',
                  onClick: (activity) => deleteAndFetchActivities(activity.id)
                }
              ]
            }}
          />
        </Modal.Body>
        <Modal.Footer>
          <button onClick={() => setExpandCategoryActivity({ expanded: false, category: '', month: ''})}>Close</button>
        </Modal.Footer>
      </Modal>
    </Card>
  )
}
