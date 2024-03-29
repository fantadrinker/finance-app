import React, { useCallback, useState } from 'react'
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
import { Table } from 'react-bootstrap'

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
        month: start_date,
        amount: categories.reduce((acc, cur) => {
          const amount = cur.amount
          return acc + (amount > 0 ? amount : 0)
        }, 0),
      }
    })
}

export const MonthlyCard = ({ insights }: MonthlyCardProps) => {
  // TODO: call an api to get the top categories for recent months
  const [activeIndex, setActiveIndex] = useState(-1)
  const [hoveredIndex, setHoveredIndex] = useState(-1)

  const handleMouseEnter = useCallback((_: any, index: number) => {
    setHoveredIndex(index)
  }, [])

  const slicedInsights = insights.sort((a, b) => {
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

  const topCategories = isExpanded
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
              style={{ maxWidth: '360px', maxHeight: '360px' }}
              onClick={() => setActiveIndex(-1)}
            >
              <h3>Top spending categories for {data[activeIndex].month}</h3>
              <Table>
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {topCategories.map(({ category, amount }) => (
                    <tr key={category}>
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
    </Card>
  )
}
