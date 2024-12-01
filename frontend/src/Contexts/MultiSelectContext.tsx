import { createContext, useState } from 'react'

interface MultiSelectContextProviderWrapperProps {
  children: any
}

interface MultiSelectContextValues {
  selectedIds: Set<string>
  updateSelectedIds: (newIds: Set<string>) => void
}

export const MultiSelectContext = createContext<MultiSelectContextValues>({
  selectedIds: new Set([]),
  updateSelectedIds: () => {},
})

export function MultiSelectContextProviderWrapper({
  children,
}: MultiSelectContextProviderWrapperProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set([]))

  return (
    <MultiSelectContext.Provider
      value={{ selectedIds, updateSelectedIds: setSelectedIds }}
    >
      {children}
    </MultiSelectContext.Provider>
  )
}
