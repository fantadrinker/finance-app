import React, { useEffect, useReducer, useState } from 'react'
import { Link } from 'react-router-dom'
import Button from 'react-bootstrap/Button'
import Table from 'react-bootstrap/Table'
import Tabs from 'react-bootstrap/Tabs'
import Tab from 'react-bootstrap/Tab'
import Spinner from 'react-bootstrap/Spinner'

import styles from './Home.module.css'
import {
  getActivities,
  getMappings,
  postMappings,
  deleteActivity,
  ActivityRow,
  getDeletedActivities,
} from '../../api'
import UpdateMappingModal from '../../Components/UpdateMappingModal'
import { useAuth0TokenSilent } from '../../hooks'
import RelatedActivitiesModal from '../../Components/RelatedActivitiesModal'
import DeletedActivitiesTable from '../../Components/DeletedActivitiesTable'
import { reducer } from './reducers'

const useFinanceDataFetcher = (
  token: string | null,
  setError: (e: string) => void
) => {
  const [financeData, setFinanceData] = useState<Array<ActivityRow>>([])
  const [nextKey, setNextKey] = useState<string | null>(null)
  const [fetchNextKey, setFetchNextKey] = useState<string | null>(null)

  const [loading, setLoading] = useState<boolean>(false)

  function fetchData(fromStart: boolean, limit: number = 20) {
    if (token) {
      setLoading(true)
      getActivities(token, fromStart? null: fetchNextKey, limit)
        .then(({ data, nextKey }) => {
          const newData = fromStart? data: [...financeData, ...data]
          setFinanceData(newData)
          setNextKey(nextKey)
        })
        .catch(err => {
          setError(`failed to load activities`)
          console.log(`error fetching activities: ${err}`)
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }

  useEffect(() => {
    if (token) {
      setLoading(true)
      getActivities(token, fetchNextKey)
        .then(({ data, nextKey }) => {
          setFinanceData(existingData => [...existingData, ...data])
          setNextKey(nextKey)
        })
        .catch(err => {
          setError(`failed to load activities`)
          console.log(`error fetching activities: ${err}`)
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }, [token, fetchNextKey, setError])

  return {
    financeData,
    loading,
    hasMore: !!nextKey,
    fetchMore: () => {
      setFetchNextKey(nextKey)
    },
    reFetch: (fromStart: boolean = false, limit: number = 20) => fetchData(fromStart, limit),
  }
}

export function Home() {
  const token = useAuth0TokenSilent()

  const [state, dispatch] = useReducer(reducer, {
    showUpdateMappingModal: false,
    showRelatedActivitiesModal: false,
    relatedActivityId: null,
    description: '',
    category: '',
    allCategories: [],
  })

  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [deletedActivities, setDeletedActivities] = useState<ActivityRow[]>([])

  const { financeData, loading, hasMore, fetchMore, reFetch } =
    useFinanceDataFetcher(token, setErrorMessage)

  useEffect(() => {
    if (token) {
      getMappings(token)
        .then(data => {
          dispatch({
            type: 'updateAllCategories',
            payload: data.map(({ category }) => category),
          })
        })
        .catch(err => {
          console.log(err)
          setErrorMessage(`Error fetching activity mappings ${err.message}`)
        })
      getDeletedActivities(token).then(({
        data,
        nextKey
      }) => {
        setDeletedActivities(data)
      }).catch(err => {
        console.log(err)
        setErrorMessage(`Error fetching deleted activities ${err.message}`)
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
      const sizeToFetch = financeData.length
      const response = await deleteActivity(token, id)
      if (response.ok) {
        reFetch(true, sizeToFetch)
      }
    } catch (err) {
      console.log(err)
      setErrorMessage(`Error deleting activities${err.message}`)
    }
  }

  function updateNewCategory(desc: string, newCategory: string): void {
    const sizeToRefetch = financeData.length
    postMappings(token, {
      description: desc,
      category: newCategory,
    })
      .then(apiResponse => {
        if (apiResponse.ok) {
          console.log('mapping updated, updated informations should come later')
          getMappings(token)
            .then(data => {
              dispatch({ 
                type: 'updateCategory', 
                payload: data.map(({ category }) => category )
              })
            })
            .catch(err => {
              console.log(err)
              setErrorMessage(`Error fetching activity mappings ${err.message}`)
            })
          reFetch(true, sizeToRefetch)
        }
      })
      .catch(err => {
        console.log(err)
        setErrorMessage(`Error updating category mapping${err.message}`)
      })
  }

  return (
    <div className={styles.homeMain}>
      <Tabs defaultActiveKey="activities" id="uncontrolled-tab-example">
        <Tab eventKey="activities" title="Activities">
          <h3> All Activities </h3>
          {financeData.length === 0 && !loading && (
            <div className={styles.noData}>No data to display</div>
          )}
          {financeData.length === 0 && loading && (
            <Spinner animation="border" role="status" />
          )}
          {errorMessage && <div className={styles.error}>{errorMessage}</div>}
          {financeData.length > 0 && (
            <div className={styles.activityTable}>
              <Table striped bordered hover data-testid="activity-table">
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
                        <td className={styles.categoryCell}>
                          <div className={styles.categoryName}>{category}</div>
                          <Button
                            onClick={() =>
                              dispatch({
                                type: 'openUpdateMappingModal',
                                payload: {
                                  description: desc,
                                  category,
                                }
                              })
                            }
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
                          <Button onClick={() => dispatch({
                            type: 'openRelatedActivitiesModal',
                            payload: id
                          })}>
                            Related
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

        </Tab>
        <Tab eventKey="deletedActivities" title="Deleted Activities">
          <DeletedActivitiesTable activities={deletedActivities} />
        </Tab>
      </Tabs>
      <UpdateMappingModal
        show={state.showUpdateMappingModal}
        closeModal={() => dispatch({ type: 'closeUpdateMappingModal' })}
        currentCategory={state.category}
        currentDescription={state.description}
        allCategories={state.allCategories}
        submit={updateNewCategory}
      />
      <RelatedActivitiesModal
        show={state.showRelatedActivitiesModal}
        closeModal={() => dispatch({
          type: 'closeRelatedActivitiesModal'
        })}
        activityId={state.relatedActivityId || undefined}
      />
    </div>
  )
}

export default Home
