import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Button from 'react-bootstrap/Button'
import Table from 'react-bootstrap/Table'
import Form from 'react-bootstrap/Form'
import Spinner from 'react-bootstrap/Spinner'

import styles from './Home.module.css'
import {
  getActivities,
  getMappings,
  postMappings,
  deleteActivity,
} from '../../api'
import UpdateMappingModal from '../../Components/UpdateMappingModal'
import { useAuth0TokenSilent } from '../../hooks'

interface FinanceDataRow {
  id: string
  date: string
  category: string
  account: string
  amount: number
  desc: string
}

const useFinanceDataFetcher = (token: string | null) => {
  const [financeData, setFinanceData] = useState<Array<FinanceDataRow>>([])
  const [nextKey, setNextKey] = useState<string | null>(null)
  const [fetchNextKey, setFetchNextKey] = useState<string | null>(null)

  const [loading, setLoading] = useState<boolean>(false)

  useEffect(() => {
    console.log(`fetching activities with token ${token}, nextKey ${fetchNextKey}, loading ${loading}, hasMore ${!!nextKey}`)
    if (token) {
      setLoading(true)
      getActivities(token, fetchNextKey)
        .then(({ data, nextKey }) => {
          setFinanceData(existingData => [...existingData, ...data])
          setNextKey(nextKey)
        })
        .catch(err => {
          console.log(`error fetching activities ${err}`)
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }, [token, fetchNextKey])

  return {
    financeData,
    loading,
    hasMore: !!nextKey,
    fetchMore: () => {
      setFetchNextKey(nextKey)
    },
    reFetch: () => {
      setFinanceData([])
      setNextKey(null)
      setFetchNextKey(null)
    }
  }
}

export function Home() {
  const token = useAuth0TokenSilent()

  const [showModal, setShowModal] = useState<boolean>(false)
  const [description, setDescription] = useState<string>('')
  const [category, setCategory] = useState<string>('')

  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [categoryMappings, setCategoryMappings] = useState<Array<any>>([])

  const {
    financeData,
    loading,
    hasMore,
    fetchMore,
    reFetch,
  } = useFinanceDataFetcher(token)

  useEffect(() => {
    if (token) {
      getMappings(token)
        .then(data => {
          setCategoryMappings(data)
        })
        .catch(err => {
          console.log(err)
          setErrorMessage(`Error fetching activity mappings ${err.message}`)
        })
    }
  }, [token])

  // set up scroll listener
  useEffect(() => {
    window.onscroll = () => {
      if (
        !loading &&
        token &&
        hasMore &&
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 1
      ) {
        fetchMore()
      }
    }
    return () => {
      window.onscroll = null
    }
  }, [loading, token, hasMore, fetchMore])

  if (!token) {
    return (
      <div>
        Not authenticated, please <Link to="/login">Log in </Link>
      </div>
    )
  }

  const deleteAndFetch = async (id: string) => {
    if (!token) {
      return
    }
    try {
      const response = await deleteActivity(token, id)
      if (response.ok) {
        reFetch()
      }
    } catch (err) {
      console.log(err)
      setErrorMessage(`Error deleting activities${err.message}`)
    }
  }

  const openModalWithParams = (desc: string, cat: string) => {
    setDescription(desc)
    setCategory(cat)
    setShowModal(true)
  }

  function updateNewCategory(desc: string, newCategory: string): void {
    postMappings(token, {
      description: desc,
      category: newCategory,
    })
      .then(apiResponse => {
        if (apiResponse.ok) {
          console.log('mapping updated, updated informations should come later')
          setShowModal(false)
        }
      })
      .catch(err => {
        console.log(err)
        setErrorMessage(`Error updating category mapping${err.message}`)
      })
  }

  return (
    <div className={styles.homeMain}>
      <h3> All Activities </h3>
      {financeData.length === 0 && !loading && (
        <div className={styles.noData}>No data to display</div>
      )}
      {financeData.length === 0 && loading && <Spinner animation="border" role='status' />}
      {errorMessage && <div className={styles.error}>{errorMessage}</div>}
      {financeData.length > 0 && (
        <div className={styles.activityTable}>
          <Table striped bordered hover>
            <thead>
              <tr>
                <td>date</td>
                <td>account</td>
                <td>description</td>
                <td>category</td>
                <td>amount</td>
                <td>actions</td>
              </tr>
            </thead>
            <tbody>
              {financeData.map(
                ({ id, date, account, desc, category, amount }, index) => (
                  <tr key={index}>
                    <td>{date}</td>
                    <td>{account}</td>
                    <td>{desc}</td>
                    <td style={{ display: 'flex' }}>
                      <Form.Select onChange={() => { }}>
                        {category && (
                          <option value={category}>{category}</option>
                        )}
                        <option value="new category">new category</option>
                      </Form.Select>
                      <Button
                        onClick={() => openModalWithParams(desc, category)}
                      >
                        Update
                      </Button>
                    </td>
                    <td>{amount}</td>
                    <td>
                      <Button
                        variant="danger"
                        onClick={() => deleteAndFetch(id)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                )
              )}
              {hasMore && (
                <tr>
                  <td colSpan={5}>
                    {loading ? <Spinner animation="border" /> : null}
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      )}
      <UpdateMappingModal
        show={showModal}
        closeModal={() => setShowModal(false)}
        currentCategory={category}
        currentDescription={description}
        allCategories={categoryMappings.map(({ category }) => category)}
        submit={updateNewCategory}
      />
    </div>
  )
}

export default Home
