import { createContext, useEffect, useState } from "react";
import { useAuth0TokenSilent } from "../hooks";
import { getMappings } from "../api";

interface CategoriesContextValues {
  allCategories: string[];
  refetch: () => void;
}

export const CategoriesContext = createContext<CategoriesContextValues>({
  allCategories: [],
  refetch: () => {}
})

export function CategoriesContextProviderWrapper({
  children
}: {
  children: any
}) {
  const token = useAuth0TokenSilent()
  const [allCategories, setAllCategories] = useState<string[]>([])
  useEffect(() => {
    fetchCategories(token)
  }, [token])

  const fetchCategories = (token: string | null) => {
    if (!token) {
      return
    }
    getMappings(token)
      .then((data) => {
        setAllCategories(data.map(({ category }) => category))
      })
      .catch((error) => {
        console.log(error)
      })
  }

  return <CategoriesContext.Provider value={{
    allCategories,
    refetch: () => fetchCategories(token)
  }} >
    {children}
  </CategoriesContext.Provider>
}