import { createContext } from "react";
import { ActivityRow } from "../api";


interface ActivitiesContextProviderWrapperProps {
  children: any
}

interface ActivitiesContextValues {
  activities: ActivityRow[]
  refresh: () => Promise<void>
  setActivities: (activities: ActivityRow[]) => void
}

export const ActivitiesContext = createContext<ActivitiesContextValues>({
  activities: [],
  refresh: async () => {},
  setActivities: () => {}
})

export function ActivitiesContextProviderWrapper({
  children
}: ActivitiesContextProviderWrapperProps) {
  const activities: ActivityRow[] = []
  const refresh = async () => {}
  const setActivities = () => {}
  return (
    <ActivitiesContext.Provider value={{
      activities,
      refresh,
      setActivities
    }}>
    {children}
    </ActivitiesContext.Provider>
  )
}