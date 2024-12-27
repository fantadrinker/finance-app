import { createContext, useMemo, useState } from "react";
import { ActivityRow } from "../api";

interface MultiSelectContextProviderWrapperProps {
  children: any;
}

interface MultiSelectContextValues {
  selectedIds: Set<string>;
  selectedActivities: ActivityRow[]
  selectNewActivity: (newActivity: ActivityRow) => void;
  unselectNewActivity: (id: string) => void;
  updateSelectedActivities: (newActivities: ActivityRow[]) => void;
}

export const MultiSelectContext = createContext<MultiSelectContextValues>({
  selectedIds: new Set([]),
  selectedActivities: [],
  selectNewActivity: () => {},
  unselectNewActivity: () => {},
  updateSelectedActivities: () => {}
})


export function MultiSelectContextProviderWrapper({
  children
}: MultiSelectContextProviderWrapperProps) {

  const [selectedActivities, setSelectedActivities] = useState<ActivityRow[]>([])

  const selectedIds = useMemo<Set<string>>(() => {
    return new Set(selectedActivities.map((row) => row.id))
  }, [selectedActivities])

  const selectNewActivity = (act: ActivityRow) => {
    if(selectedIds.has(act.id)) {
      return
    }
    setSelectedActivities([...selectedActivities, act])
  }

  const unselectNewActivity = (id: string) => {
    const index = selectedActivities.findIndex((act) => act.id === id)
    if (index !== -1) {
      setSelectedActivities(selectedActivities.toSpliced(index, 1))
    }
  }

  return (
    <MultiSelectContext.Provider value={{
      selectedIds, 
      selectedActivities,
      selectNewActivity,
      unselectNewActivity,
      updateSelectedActivities: setSelectedActivities
    }}>
      {children}
    </MultiSelectContext.Provider>
  )
}