import { useState, useEffect } from 'react'
import Button from 'react-bootstrap/Button'
import Table from 'react-bootstrap/Table'
import Spinner from 'react-bootstrap/Spinner'
import { Link } from 'react-router-dom'
import {
  CategoryMapping,
  deleteMapping,
  getMappings,
  postMappings,
} from '../../api'
import UpdateMappingModal from '../../Components/UpdateMappingModal'
import { useAuth0TokenSilent } from '../../hooks'
import { CategoryMappingsModal } from '../../Components/CategoryMappingsModal'
import { CategoryTrendModal } from '../../Components/CategoryTrendModal'

function deduplicate(arr: Array<string>) {
  return Array.from(new Set(arr))
}

export const Preferences = () => {
  // supports display, update and delete description to category mappings
  const token = useAuth0TokenSilent()
  const [mappings, setMappings] = useState<Array<CategoryMapping>>([])
  const [showNewMappingModal, setShowNewMappingModal] = useState<boolean>(false)
  const [description, setDescription] = useState<string>('')
  const [category, setCategory] = useState<string>('')
  const [allCategories, setAllCategories] = useState<Array<string>>([])
	const [loading, setLoading] = useState<boolean>(false)
  const [showMappingsForCategory, setShowMappingsForCategory] = useState<string | null>(null)
  const [showTrendForCategory, setShowTrendForCategory] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      return
    }
    // fetch data from /preferences endpoint
		setMappings([])
		setAllCategories([])
		setLoading(true)
    getMappings(token)
      .then(result => {
        setMappings(result)
        setAllCategories(deduplicate(result.map(({ category }) => category)))
				setLoading(false)
      })
      .catch(err => {
        console.log(err)
      })
  }, [token])

  if (!token) {
    return (
      <div>
        Not authenticated, please <Link to="/login">Log in </Link>
      </div>
    )
  }

  const openModalWithParams = (desc: string, cat: string) => {
    setDescription(desc)
    setCategory(cat)
    setShowNewMappingModal(true)
  }
  const deleteMappingAndFetch = (sk: string) => {
    // calls delete /mappings endpoint
    return deleteMapping(token, sk)
      .then(result => {
        if (!result.ok) {
          return []
        }
        console.log(111, sk)
        return getMappings(token ?? '')
      })
      .then(data => setMappings(data))
      .catch(err => {
        console.log(err)
      })
  }

  const updateNewCategory = async (desc: string, newCategory: string) => {
    // calls post /mappings endpoint to update category mapping
    try {
      const result = await postMappings(token, {
        description: desc,
        category: newCategory,
      })
      if (!result.ok) {
        throw Error("mapping update request failed")
      }
      console.log('mapping updated, updated informations should come later')
      return true
    } catch (err) {
      console.log(err)
    }
    return false
  }
  return (
    <div>
      <h1>Preferences</h1>
			{loading && <Spinner />}
      {(!loading && mappings.length === 0) && (
        <div>No preferences found</div>
      )}
			{(!loading && mappings.length > 0) && (
        <Table>
          <thead>
            <tr>
              <td>Category</td>
              <td>Description</td>
              <td>Actions</td>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={3}>
                <Button onClick={() => openModalWithParams('', '')}>
                  Add new mapping
                </Button>
              </td>
            </tr>
            {mappings.map(({ category }) => (
              <tr key={`${category}${description}`}>
                <td>{category}</td>
                <td>
                  <Button onClick={() => setShowMappingsForCategory(category)}>
                    Show Mappings
                  </Button>
                </td>
                <td>
                  <Button onClick={() => setShowTrendForCategory(category)}>
                    Show Activities
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <CategoryMappingsModal
        show={!!showMappingsForCategory}
        closeModal={() => setShowMappingsForCategory(null)}
        mappings={mappings.filter(({ category }) => category === showMappingsForCategory)[0]?.descriptions ?? []}
        deleteMapping={deleteMappingAndFetch}
      />

      <UpdateMappingModal
        show={showNewMappingModal}
        closeModal={() => setShowNewMappingModal(false)}
        currentCategory={category}
        currentDescription={description}
        allCategories={allCategories}
        submit={updateNewCategory}
      />

      <CategoryTrendModal
        show={!!showTrendForCategory}
        category={showTrendForCategory}
        closeModal={() => setShowTrendForCategory(null)}
      />
    </div>
  )
}
