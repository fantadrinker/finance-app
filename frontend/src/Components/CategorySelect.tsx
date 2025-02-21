import { useContext } from "react";
import { Form } from "react-bootstrap";
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
    allCategories
  } = useContext(CategoriesContext)

  const selectedCategory = category ?? 'Uncategorized'
  return (
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