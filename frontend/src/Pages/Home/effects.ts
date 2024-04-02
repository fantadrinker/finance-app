import { useEffect, useState } from "react"
import { ActivityRow, getActivities } from "../../api"

export const useFinanceDataFetcher = (
  token: string | null,
  setError: (e: string) => void
) => {
  const [financeData, setFinanceData] = useState<Array<ActivityRow>>([])
  const [nextKey, setNextKey] = useState<string | null>(null)
  const [fetchNextKey, setFetchNextKey] = useState<string | null>(null)

  const [loading, setLoading] = useState<boolean>(false)

  function fetchData(fromStart: boolean, limit: number = 20) {
    if (token) {
      setLoading(true)
      getActivities(token, fromStart? null: fetchNextKey, limit)
        .then(({ data, nextKey }) => {
          const newData = fromStart? data: [...financeData, ...data]
          setFinanceData(newData)
          setNextKey(nextKey)
        })
        .catch(err => {
          setError(`failed to load activities`)
          console.log(`error fetching activities: ${err}`)
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }

  useEffect(() => {
    if (token) {
      setLoading(true)
      getActivities(token, fetchNextKey)
        .then(({ data, nextKey }) => {
          setFinanceData(existingData => [...existingData, ...data])
          setNextKey(nextKey)
        })
        .catch(err => {
          setError(`failed to load activities`)
          console.log(`error fetching activities: ${err}`)
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }, [token, fetchNextKey, setError])

  return {
    financeData,
    loading,
    hasMore: !!nextKey,
    fetchMore: () => {
      setFetchNextKey(nextKey)
    },
    reFetch: (fromStart: boolean = false, limit: number = 20) => fetchData(fromStart, limit),
  }
}