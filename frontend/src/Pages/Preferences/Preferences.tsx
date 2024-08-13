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
import { useAuth0WithTokenSilent } from '../../hooks'

interface Mapping {
  sk: string
  description: string
  category: string
}

function transformMappings(mappings: Array<CategoryMapping>) {
  return mappings.reduce((acc: Mapping[], { category, descriptions }) => {
    return [
      ...acc,
      ...descriptions.map(({ description, sk }) => ({
        category,
        description,
        sk,
      })),
    ]
  }, [])
}

function deduplicate(arr: Array<string>) {
  return Array.from(new Set(arr))
}

// TODO: set up error handling
export const Preferences = () => {
  // supports display, update and delete description to category mappings

  const { user_id, token } = useAuth0WithTokenSilent()
  const isLoggedIn = !!user_id && !!token

  const [mappings, setMappings] = useState<Array<Mapping>>([])
  const [showModal, setShowModal] = useState<boolean>(false)
  const [description, setDescription] = useState<string>('')
  const [category, setCategory] = useState<string>('')
  const [allCategories, setAllCategories] = useState<Array<string>>([])
  const [loading, setLoading] = useState<boolean>(false)
  useEffect(() => {
    if (!isLoggedIn) {
      return
    }
    // fetch data from /preferences endpoint
    setMappings([])
    setAllCategories([])
    setLoading(true)
    getMappings(user_id, token)
      .then(result => {
        setMappings(transformMappings(result))
        setAllCategories(deduplicate(result.map(({ category }) => category)))
        setLoading(false)
      })
      .catch(err => {
        console.log(err)
      })
  }, [isLoggedIn, user_id, token])

  if (!isLoggedIn) {
    return (
      <div>
        Not authenticated, please <Link to="/login">Log in </Link>
      </div>
    )
  }

  const openModalWithParams = (desc: string, cat: string) => {
    setDescription(desc)
    setCategory(cat)
    setShowModal(true)
  }
  const deleteMappingAndFetch = (sk: string) => {
    if (!isLoggedIn) {
      console.error('error trying to delete mapping while logged out')
      return
    }
    // calls delete /mappings endpoint
    deleteMapping(user_id, token, sk)
      .then(result => {
        if (!result.ok) {
          return []
        }
        return getMappings(user_id, token ?? '')
      })
      .then(data => setMappings(transformMappings(data)))
      .catch(err => {
        console.log(err)
      })
  }

  const updateNewCategory = async (desc: string, newCategory: string) => {
    if (!isLoggedIn) {
      console.error('error trying to delete mapping while logged out')
      return
    }
    // calls post /mappings endpoint to update category mapping
    postMappings(user_id, token, {
      description: desc,
      category: newCategory,
    })
      .then(result => {
        if (!result.ok) {
          return
        }
        console.log('mapping updated, updated informations should come later')
        setShowModal(false)
      })
      .catch(err => {
        console.log(err)
      })
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
            {mappings.map(({ category, description, sk }) => (
              <tr key={`${category}${description}`}>
                <td>{category}</td>
                <td>{description}</td>
                <td>
                  <Button
                    onClick={() => openModalWithParams(description, category)}
                  >
                    Update
                  </Button>
                  <Button onClick={() => deleteMappingAndFetch(sk)}>
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <UpdateMappingModal
        show={showModal}
        closeModal={() => setShowModal(false)}
        currentCategory={category}
        currentDescription={description}
        allCategories={allCategories}
        submit={updateNewCategory}
      />
    </div>
  )
}
