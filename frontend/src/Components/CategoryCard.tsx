import { useState } from 'react'
import Card from 'react-bootstrap/Card'
import { Insight } from '../api'
import { CategoryBreakdownBody } from './CategoryBreakdown'

/**
 * TODO: animations
 */
interface CategoryCardProps {
  insights: Array<Insight>
}

const NUM_CATEGORIES = 5

export const CategoryCard = ({ insights }: CategoryCardProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('')

  const isExpanded = selectedCategory.length > 0

  const cardStyles = isExpanded
    ? {
        flexGrow: 2,
        maxWidth: '800px',
        transition: 'all 0.2s linear 0s',
      }
    : {
        flexGrow: 1,
        maxWidth: '400px',
        transition: 'all 0.2s linear 0s',
      }

  return (
    <Card style={cardStyles}>
      <Card.Body>
        <Card.Title>Category Breakdown</Card.Title>
        <CategoryBreakdownBody
          insights={insights}
          onSelectCategory={setSelectedCategory}
          selectedCategory={selectedCategory}
          numCategories={NUM_CATEGORIES}
        />
      </Card.Body>
    </Card>
  )
}
