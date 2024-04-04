import React, { useEffect, useReducer, useState } from 'react'
import { Link } from 'react-router-dom'
import Table from 'react-bootstrap/Table'
import Tabs from 'react-bootstrap/Tabs'
import Tab from 'react-bootstrap/Tab'
import Spinner from 'react-bootstrap/Spinner'

import {
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
import { useFinanceDataFetcher } from './effects'
import { Dropdown } from 'react-bootstrap'

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
          getMappings(token)
            .then(data => {
              dispatch({
                type: 'updateCategory',
                payload: data.map(({ category }) => category)
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
    <div className="p-10 w-4/5">
      <Tabs defaultActiveKey="activities" id="uncontrolled-tab-example">
        <Tab eventKey="activities" title="Activities">
          <h3> All Activities </h3>
          {financeData.length === 0 && !loading && (
            <div>No data to display</div>
          )}
          {financeData.length === 0 && loading && (
            <Spinner animation="border" role="status" />
          )}
          {errorMessage && <div>{errorMessage}</div>}
          {financeData.length > 0 && (
            <div className="mb-11 w-full">
              <Table striped bordered hover width="100%" data-testid="activity-table">
                <thead>
                  <tr>
                    <td className="w-32">Date</td>
                    <td className="w-40">Account</td>
                    <td>description</td>
                    <td className="w-20">Category</td>
                    <td className="w-20">Amount</td>
                    <td>Actions</td>
                  </tr>
                </thead>
                <tbody>
                  {financeData.map(
                    ({ id, date, account, desc, category, amount }, index) => (
                      <tr key={index}>
                        <td >{date}</td>
                        <td className="overflow-hidden">{account}</td>
                        <td>{desc}</td>
                        <td>
                          {category}
                        </td>
                        <td>{amount}</td>
                        <td>
                          <Dropdown>
                            <Dropdown.Toggle variant="success" id="dropdown-basic" data-testid="activity-action-dropdown">
                              Actions
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
                              <Dropdown.Item
                                role="button"
                                onClick={() => dispatch({
                                  type: 'openUpdateMappingModal',
                                  payload: {
                                    description: desc,
                                    category,
                                  }
                                })}>
                                  Update Mapping
                              </Dropdown.Item>
                              <Dropdown.Item role="button" onClick={() => deleteAndFetch(id)}>Delete</Dropdown.Item>
                              <Dropdown.Item role="button" onClick={() => dispatch({
                                type: 'openRelatedActivitiesModal',
                                payload: id
                              })}>Related</Dropdown.Item>
                            </Dropdown.Menu>
                          </Dropdown>
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
