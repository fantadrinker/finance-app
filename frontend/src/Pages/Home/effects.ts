import { useEffect, useState } from "react"
import { ActivityRow, getActivities } from "../../api"

export const useFinanceDataFetcher = (
  token: string | null,
  setError: (e: string) => void,
  options: {
    refetchOnChange?: boolean,
    limit: number,
    category?: string,
    startDate?: string,
    endDate?: string
  } = {
    limit: 20
  }
) => {
  const [financeData, setFinanceData] = useState<Array<ActivityRow>>([])
  const [nextKey, setNextKey] = useState<string | null>(null)
  const [fetchNextKey, setFetchNextKey] = useState<string | null>(null)

  const [loading, setLoading] = useState<boolean>(false)

  function fetchData(fromStart: boolean, limit: number = 20) {
    if (token) {
      setLoading(true)
      getActivities(token, fromStart? null: fetchNextKey, {
        size: limit,
        category: options.category,
        startDate: options.startDate,
        endDate: options.endDate
      })
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
    if (token && options.limit > 0) {
      const refetch = options.refetchOnChange 
      if (refetch) {
        setFinanceData([])
      }
      setLoading(true)
      getActivities(token, fetchNextKey, {
        size: options.limit,
        category: options.category,
        startDate: options.startDate,
        endDate: options.endDate
      })
        .then(({ data, nextKey }) => {
          setFinanceData(existingData => refetch? data: [...existingData, ...data])
          setNextKey(nextKey)
        })
        .catch(err => {
          setError(`failed to load activities`)
          console.log(`error fetching activities: ${err}`)
        })
        .finally(() => {
          setLoading(false)
        })
    } else {
      console.log("token not found")
      setNextKey(null)
    }
  }, [token, options.refetchOnChange, fetchNextKey, setError, options.limit, options.category, options.startDate, options.endDate])

  return {
    financeData,
    loading,
    hasMore: !!nextKey,
    fetchMore: () => {
      setFetchNextKey(nextKey)
    },
    reFetch: (fromStart: boolean = false, limit: number = 20) => fetchData(fromStart, limit),
    clearData: () => {
      setFinanceData([])
    }
  }
}
