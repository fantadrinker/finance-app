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
import { CategoryBreakdown, Insight } from '../api'
import {  Table } from 'react-bootstrap'
import { flatten, keys, map, pipe, prop, sort, take, uniq } from 'ramda'
import { cmpInsights, transformInsightToMonthlyBreakdown } from '../Helpers/InsightHelpers'
import { getRandomColorMap } from '../helpers'
import { FilteredActivitiesModal } from './FilteredActivitiesModal'

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

  const allCategories = useMemo(() => {
    return pipe(
      map(pipe(
        prop('breakdown'),
        keys
      )),
      flatten,
      uniq
    )(monthlyData)
  }, [monthlyData])

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
  const colorMapForCategories = getRandomColorMap(allCategories)

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
            {allCategories.map((category) => {
              return (<Bar
                key={category}
                dataKey={category}
                stackId={1}
                fill={colorMapForCategories[category]}
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
                        : colorMapForCategories[category]
                    }
                    key={`cell-${index}`}
                  />
                ))}
              </Bar>)

            })}
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
                  <tr key="total">
                    <td>Total</td>
                    <td>{monthlyData[activeIndex].amount}</td>
                  </tr>
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

      {expandCategoryMonthEnd && expandCategoryMonthStart && expandCategoryActivity.category && (
        <FilteredActivitiesModal
          open={expandCategoryActivity.expanded}
          closeModal={() => setExpandCategoryActivity({ expanded: false, category: '', month: ''})}
          category={expandCategoryActivity.category}
          startDate={expandCategoryMonthStart}
          endDate={expandCategoryMonthEnd}
        />
      )}
    </Card>
  )
}
