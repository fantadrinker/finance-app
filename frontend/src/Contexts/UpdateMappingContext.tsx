
import { createContext, useState } from "react";
import UpdateMappingModal from "../Components/UpdateMappingModal";

interface UpdateMappingContextValues {
  openModal: (cat: string, desc: string) => void
  closeModal: () => void
}

export const UpdateMappingContext = createContext<UpdateMappingContextValues>({
  openModal: (cat: string, desc: string) => {},
  closeModal: () => {}
})

export function UpdateMappingContextProviderWrapper({
  children
}: {
  children: any
}) {
  const [showModal, setShowModal] = useState(false)
  const [category, setCategory] = useState<string | null>(null)
  const [description, setDescription] = useState<string | null>(null)

  return <UpdateMappingContext.Provider value={{
    openModal: (cat, desc) => {
      setCategory(cat)
      setDescription(desc)
      setShowModal(true)
    },
    closeModal: () => {
      setShowModal(false)
      setCategory(null)
      setDescription(null)
    }
  }} >
    {children}
    <UpdateMappingModal
      show={showModal}
      closeModal={() => setShowModal(false)}
      currentCategory={category || ""}
      currentDescription={description || ""}
    />
  </UpdateMappingContext.Provider>
}
