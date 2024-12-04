import { map, pipe, prop, sum, take, values } from 'ramda'
import { CategoryBreakdown, Insight } from '../api'

export function cmpInsights(a: Insight, b: Insight) {
  if (!a.start_date || !b.start_date) return 0
  return new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
}

// TODO: add tests for this
export function transformInsightToMonthlyBreakdown(insight: Insight) {
  const topCategories = getTopCategories(insight, 5)
  const categoryBreakdown = insight.categories.reduce(
    (acc: Record<string, string>, curr) => {
      if (!curr.category || !topCategories.includes(curr.category)) {
        return acc
      }
      return {
        ...acc,
        [curr.category]: curr.amount,
      }
    },
    {}
  )

  const totalAmount = pipe(
    map((cat: CategoryBreakdown) => cat.amount),
    sum
  )(insight.categories)
  return {
    ...categoryBreakdown,
    Other: totalAmount - pipe(values, sum)(categoryBreakdown),
    month: insight.start_date || '00-00-00',
    startDate: insight.start_date,
    endDate: insight.end_date,
    amount: totalAmount,
    breakdown: {
      ...categoryBreakdown,
      Other: totalAmount - pipe(values, sum)(categoryBreakdown),
    },
  }
}

export function getTopCategories(insight: Insight, x?: number) {
  const sortedCategories = insight.categories
    .toSorted((a, b) => b.amount - a.amount)
    .map(prop('category'))

  return typeof x === 'number' ? take(x, sortedCategories) : sortedCategories
}
