import React, { useState, useEffect } from 'react'
import Button from 'react-bootstrap/esm/Button'
import Table from 'react-bootstrap/esm/Table'
import { Link } from 'react-router-dom'
import { deleteMapping, getMappings, postMappings } from '../../api'
import UpdateMappingModal from '../../Components/UpdateMappingModal'
import { useAuth0TokenSilent } from '../../hooks'

interface Mapping {
  sk: string
  description: string
  category: string
}

// TODO: set up error handling
export const Preferences = () => {
  // supports display, update and delete description to category mappings
  const token = useAuth0TokenSilent()
  const [mappings, setMappings] = useState<Array<Mapping>>([])
  const [showModal, setShowModal] = useState<boolean>(false)
  const [description, setDescription] = useState<string>('')
  const [category, setCategory] = useState<string>('')
  useEffect(() => {
    if (!token) {
      return
    }
    // fetch data from /preferences endpoint
    getMappings(token)
      .then(result => {
        setMappings(result)
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
    setShowModal(true)
  }
  const deleteMappingAndFetch = (sk: string) => {
    // calls delete /mappings endpoint
    deleteMapping(token, sk)
      .then(result => {
        if (!result.ok) {
          return []
        }
        getMappings(token ?? '')
          .then(data => {
            setMappings(data)
          })
          .catch(err => {
            console.log(err)
          })
      })
      .catch(err => {
        console.log(err)
      })
  }

  const updateNewCategory = async (desc: string, newCategory: string) => {
    // calls post /mappings endpoint to update category mapping
    postMappings(token, {
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
      {mappings.length === 0 ? (
        <div>No preferences found</div>
      ) : (
        <Table>
          <thead>
            <tr>
              <td>Category</td>
              <td>Description</td>
              <td>Actions</td>
            </tr>
          </thead>
          <tbody>
            {mappings.map(({ sk, category, description }) => (
              <tr key={category}>
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
        allCategories={[]}
        submit={updateNewCategory}
      />
    </div>
  )
}
