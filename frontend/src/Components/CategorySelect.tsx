import { useContext } from "react";
import { Form, Spinner } from "react-bootstrap";
import { CategoriesContext } from "../Contexts/CategoriesContext";


interface CategorySelectProps {
  category: string | undefined;
  onCategoryChange: (cat: string) => void
  defaultLabel: string | undefined
}

export function CategorySelect({
  category,
  onCategoryChange,
  defaultLabel,
}: CategorySelectProps) {
  const {
    allCategories,
    loading
  } = useContext(CategoriesContext)

  const selectedCategory = allCategories.includes(category ?? '') ? category: ''
  return loading? <Spinner /> : (
    <Form.Select
      aria-label="category"
      role="list"
      value={selectedCategory}
      onChange={e => onCategoryChange(e.target.value)}
    >
      {allCategories.map((cat, index) => (
        <option value={cat} key={index}>
          {cat}
        </option>
      ))}
      <option value="">{defaultLabel}</option>
    </Form.Select>
  )
}