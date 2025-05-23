import { useCallback, useEffect, useMemo, useState } from 'react'
import { CategoryBreakdown, getActivitiesByCategory, Insight } from '../api'
import { useAuth0TokenSilent } from '../hooks'
import { prop } from 'ramda'
import { Form, Spinner } from 'react-bootstrap'
import { Cell, Legend, Pie, PieChart, Sector, Tooltip } from 'recharts'
import { COLORS_GPT } from '../helpers'
import { ActivitiesTable } from './ActivitiesTable'

const MONTHS_SELECT_ALL = 'All'

const OTHERS_CATEGORY = 'Others'
interface Activity {
  id: string
  date: string
  account: string
  amount: number
  category: string
  desc: string
}

interface CategoryCardProps {
  insights: Array<Insight>
  selectedCategory: string
  onSelectCategory: (category: string) => void
  numCategories: number
}

function calculateCategoryBreakdown(
  insights: Array<Insight>,
  displayTop: number | null
): Array<CategoryBreakdown> {
  const allCategories = insights
    .reduce((acc: Array<CategoryBreakdown>, cur: Insight) => {
      cur.categories.forEach(({ category, amount }) => {
        if (amount > 0) {
          const existing = acc.find(cur => cur.category === category)
          if (existing) {
            existing.amount += amount
          } else {
            acc.push({
              category,
              amount,
            })
          }
        }
      })
      return acc
    }, [])
    .map(cur => {
      return {
        ...cur,
        amount: Math.round(cur.amount * 100) / 100,
      }
    })
    .filter(cur => cur.amount > 0)
  allCategories.sort((a, b) => b.amount - a.amount)
  if (!displayTop) {
    return allCategories
  }
  const others: CategoryBreakdown = {
    category: 'Others',
    amount: allCategories
      .slice(displayTop)
      .reduce((acc, cur) => acc + cur.amount, 0),
  }
  return [...allCategories.slice(0, displayTop), others]
}

interface SectorProps {
  cx: number
  cy: number
  midAngle: number
  innerRadius: number
  outerRadius: number
  startAngle: number
  endAngle: number
  fill: string
  payload: any
  percent: number
  value: number
}

const activeSlice = (props: SectorProps) => {
  // expand radius by 20%, keep fill color
  return <Sector {...props} outerRadius={props.outerRadius * 1.2} />
}

export function CategoryBreakdownBody({
  insights,
  selectedCategory,
  onSelectCategory,
  numCategories,
}: CategoryCardProps) {
  const token = useAuth0TokenSilent()

  const [categoryBreakdown, setCategoryBreakdown] = useState<
    Array<CategoryBreakdown>
  >([])

  const [selectedMonth, setSelectedMonth] = useState<string>('')

  const [activities, setActivities] = useState<Array<Activity>>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [hoveredIndex, setHoveredIndex] = useState<number>(-1)

  const handleMouseEnter = useCallback((_: any, index: number) => {
    setHoveredIndex(index)
  }, [])

  const allMonthsList = useMemo(() => {
    return insights
      .filter(insight => insight.categories.length > 0)
      .map(prop('start_date'))
  }, [insights])

  const selectedInsight = useMemo(() => {
    return insights.find(insight => insight.start_date === selectedMonth)
  }, [insights, selectedMonth])

  useEffect(() => {
    setCategoryBreakdown(
      calculateCategoryBreakdown(
        selectedInsight ? [selectedInsight] : insights,
        numCategories
      )
    )
  }, [insights, selectedInsight, numCategories])

  const handleClick = (event: any) => {
    // todo: type event
    const categoriesToFetch =
      event.name === OTHERS_CATEGORY
        ? categoryBreakdown.slice(0, 5).map(cur => cur.category)
        : [event.name]
    onSelectCategory(event.name)
    setLoading(true)

    if (token === null) {
      console.error('token is null')
      return
    }
    getActivitiesByCategory(
      token,
      categoriesToFetch,
      event.name === OTHERS_CATEGORY,
      selectedInsight !== undefined
        ? {
            startDate: selectedInsight.start_date,
            endDate: selectedInsight.end_date,
          }
        : undefined
    )
      .then(activities => {
        setActivities(activities.data)
      })
      .finally(() => setLoading(false))
  }

  const isExpanded = selectedCategory.length > 0

  const selectedIndex = categoryBreakdown.findIndex(
    cur => cur.category === selectedCategory
  )

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        cursor: isExpanded ? 'pointer' : 'default',
      }}
    >
      <div className="flex flex-col">
        <Form.Select
          aria-label="month"
          role="list"
          value={selectedMonth}
          onChange={e => setSelectedMonth(e.target.value)}
        >
          {[MONTHS_SELECT_ALL, ...allMonthsList].map((month, index) => (
            <option value={month} key={index}>
              {month}
            </option>
          ))}
        </Form.Select>
        <PieChart width={360} height={360}>
          <Pie
            dataKey="value"
            isAnimationActive={false}
            data={categoryBreakdown.map(({ category, amount }) => ({
              name: category,
              value: amount,
            }))}
            activeShape={activeSlice}
            activeIndex={selectedIndex === -1 ? hoveredIndex : selectedIndex}
            cx="50%"
            cy="50%"
            outerRadius={80}
            fill="#8884d8"
            label
            onClick={handleClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={() => setHoveredIndex(-1)}
            style={{ cursor: 'pointer' }}
          >
            {categoryBreakdown.map(({ category }, index) => (
              <Cell
                key={`cell-${index}`}
                fill={
                  isExpanded &&
                  category !== selectedCategory &&
                  index !== hoveredIndex
                    ? 'grey'
                    : COLORS_GPT[index % COLORS_GPT.length]
                }
              />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </div>
      {isExpanded && (
        <div
          style={{ maxWidth: '360px', maxHeight: '360px' }}
          onClick={() => onSelectCategory('')}
        >
          <h5>
            Top Activities for {selectedCategory} in {selectedMonth}{' '}
          </h5>
          {loading ? (
            <Spinner animation="border" />
          ) : (
            <ActivitiesTable activities={activities} size="s" />
          )}
        </div>
      )}
    </div>
  )
}
