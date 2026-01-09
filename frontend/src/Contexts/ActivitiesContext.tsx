import { createContext, useEffect } from "react";
import { ActivityRow, deleteActivity } from "../api";
import { useAuth0TokenSilent } from "../hooks";
import { useFinanceDataFetcher } from "../Pages/Home/effects";


interface ActivitiesContextProviderWrapperProps {
  categories: string[] // categories to filter by
  minAmount?: number // minimum amount, default to null/negative max
  maxAmount?: number // maximum amount, default to null/max
  dateStart?: string // date formatted as YYYY-mm-dd
  dateEnd?: string // date formatted as YYYY-mm-dd
  children: any
}

interface ActivitiesContextValues {
  activities: ActivityRow[]
  refresh: () => void
  setActivities: (activities: ActivityRow[]) => void
  loading: boolean
  hasMore: boolean,
  fetchMore: () => void,
  clearData: () => void,
  deleteActivity: (id: string) => Promise<void>
}

export const ActivitiesContext = createContext<ActivitiesContextValues>({
  activities: [],
  refresh: () => {},
  setActivities: () => {},
  loading: false,
  hasMore: false,
  fetchMore: () => {},
  clearData: () => {},
  deleteActivity: async (id: string) => {}
})

export function ActivitiesContextProviderWrapper({
  categories,
  minAmount,
  maxAmount,
  dateStart,
  dateEnd,
  children
}: ActivitiesContextProviderWrapperProps) {
  const token = useAuth0TokenSilent()
  const { financeData, loading, hasMore, fetchMore, reFetch, clearData } =
    useFinanceDataFetcher(token, console.error, { 
      category: categories[0], // TODO: pass in multiple categories 
      limit: 20, // this is an initial limit
      startDate: dateStart,
      endDate: dateEnd
    })
  const setActivities = () => {}

  useEffect(() => {
    clearData()
    reFetch()
  }, [categories])

  const deleteAndFetch = async (id: string) => {
    if (!token) {
      return
    }
    try {
      const response = await deleteActivity(token, id)
      if (response.ok) {
        reFetch(true, financeData.length)
      }
    } catch (err) {
      console.log(err)
    }
  }
  return (
    <ActivitiesContext.Provider value={{
      activities: financeData,
      refresh: () => reFetch(true, financeData.length),
      loading,
      hasMore,
      fetchMore,
      clearData,
      setActivities,
      deleteActivity: (id: string) => deleteAndFetch(id)
    }}>
    {children}
    </ActivitiesContext.Provider>
  )
}
