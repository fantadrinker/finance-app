import { createContext, useEffect, useState } from "react";
import { useAuth0TokenSilent } from "../hooks";
import { getMappings, postMappings } from "../api";

interface CategoriesContextValues {
  allCategories: string[];
  loading: boolean,
  refetch: () => void;
  addMapping: (cat: string, desc: string) => Promise<boolean>
}

export const CategoriesContext = createContext<CategoriesContextValues>({
  allCategories: [],
  loading: false,
  refetch: () => {},
  addMapping: async (cat, desc) => {return false}
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
    refetch: () => fetchCategories(token),
    addMapping: async (cat: string, desc: string) => {
      const postResponse = await postMappings(token, {
        description: desc,
        category: cat,
      })
      if (!postResponse.ok) {
        throw Error("error updating category mapping, api response not ok")
      }
      fetchCategories(token)
      return true
    }
  }} >
    {children}
  </CategoriesContext.Provider>
}
