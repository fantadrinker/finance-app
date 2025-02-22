import { createContext, useEffect, useState } from "react";
import { useAuth0TokenSilent } from "../hooks";
import { getMappings } from "../api";

interface CategoriesContextValues {
  allCategories: string[];
  loading: boolean,
  refetch: () => void;
}

export const CategoriesContext = createContext<CategoriesContextValues>({
  allCategories: [],
  loading: false,
  refetch: () => {}
})

export function CategoriesContextProviderWrapper({
  children
}: {
  children: any
}) {
  const token = useAuth0TokenSilent()
  const [allCategories, setAllCategories] = useState<string[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  useEffect(() => {
    fetchCategories(token)
  }, [token])

  const fetchCategories = (token: string | null) => {
    if (!token) {
      return
    }
    setLoading(true)
    getMappings(token)
      .then((data) => {
        setAllCategories(data.map(({ category }) => category))
      })
      .catch((error) => {
        console.log(error)
      })
      .finally(() => {
        setLoading(false)
      })
  }

  return <CategoriesContext.Provider value={{
    allCategories,
    loading,
    refetch: () => fetchCategories(token)
  }} >
    {children}
  </CategoriesContext.Provider>
}