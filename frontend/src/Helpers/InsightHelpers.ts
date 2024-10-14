import { map, pipe, sum } from "ramda"
import { CategoryBreakdown, Insight } from "../api"

export function cmpInsights(a: Insight, b: Insight) {
  if (!a.start_date || !b.start_date) return 0
  return new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
}

export function transformInsightToMonthlyBreakdown(insight: Insight) {
  return {
    month: insight.start_date || '00-00-00',
    startDate: insight.start_date,
    endDate: insight.end_date,
    amount: pipe(
      map((cat: CategoryBreakdown) => cat.amount),
      sum
    )(insight.categories)
  }
}
