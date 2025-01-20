import { useEffect, useState } from "react";
import { Form } from "react-bootstrap"
import { getMappings } from "../api";
import { useAuth0TokenSilent } from "../hooks";

interface CategoriesSelectProps {
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
}

export function CategoriesSelect({
  selectedCategory,
  setSelectedCategory
}: CategoriesSelectProps) {
  const token = useAuth0TokenSilent()
  const [allCategories, setAllCategories] = useState<string[]>([])
  useEffect(() => {
    if (!token) {
      return
    }
    getMappings(token)
      .then(data => {
        setAllCategories(data.map(({category}) => category))
      })
      .catch(err => {
        console.log(err)
      })
  })
  return (
    <Form.Select
      aria-label="category"
      role="list"
      value={selectedCategory}
      onChange={(e) => {
        setSelectedCategory(e.target.value)
      }}
    >
      {allCategories.map((cat, index) => (
        <option value={cat} key={index}>
          {cat}
        </option>
      ))}
      <option value={''}>
        None
      </option>
    </Form.Select>
  )
}