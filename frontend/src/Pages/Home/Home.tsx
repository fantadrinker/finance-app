import { useEffect, useReducer, useState } from 'react'
import { Link } from 'react-router-dom'
import Tabs from 'react-bootstrap/Tabs'
import Tab from 'react-bootstrap/Tab'

import {
  getMappings,
  postMappings,
  deleteActivity,
  ActivityRow,
  getDeletedActivities,
} from '../../api'
import UpdateMappingModal from '../../Components/UpdateMappingModal'
import { useAuth0WithTokenSilent } from '../../hooks'
import RelatedActivitiesModal from '../../Components/RelatedActivitiesModal'
import DeletedActivitiesTable from '../../Components/DeletedActivitiesTable'
import { reducer } from './reducers'
import { useFinanceDataFetcher } from './effects'
import { ActivitiesTable, ActivityActionType } from '../../Components/ActivitiesTable'

export function Home() {
  const { token, user_id } = useAuth0WithTokenSilent()

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
    useFinanceDataFetcher(user_id ?? null, token, setErrorMessage)


  const isLoggedIn = !!token && !!user_id

  useEffect(() => {
    if (!isLoggedIn) {
      return
    }
    getMappings(user_id, token)
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
    getDeletedActivities(user_id, token).then(({
      data,
    }) => {
      setDeletedActivities(data)
    }).catch(err => {
      console.log(err)
      setErrorMessage(`Error fetching deleted activities ${err.message}`)
    })
  }, [token, isLoggedIn, user_id])

  if (!isLoggedIn) {
    return (
      <div>
        Not authenticated, please <Link to="/login">Log in </Link>
      </div>
    )
  }

  const deleteAndFetch = async (id: string) => {
    if (!isLoggedIn) {
      return
    }
    try {
      const sizeToFetch = financeData.length
      const response = await deleteActivity(user_id, token, id)
      if (response.ok) {
        reFetch(true, sizeToFetch)
      }
    } catch (err) {
      console.log(err)
      setErrorMessage(`Error deleting activities${err.message}`)
    }
  }

  function updateNewCategory(desc: string, newCategory: string): void {
    if (!isLoggedIn) {
      console.error('trying to update while not logged in')
      return
    }

    const sizeToRefetch = financeData.length
    postMappings(user_id, token, {
      description: desc,
      category: newCategory,
    })
      .then(apiResponse => {
        if (apiResponse.ok) {
          if (user_id) {
            console.error('trying to update while not logged in')
            return
          }
          getMappings(user_id, token)
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
          {errorMessage && <div>{errorMessage}</div>}

          <div className="mb-11 w-full">
            <ActivitiesTable
              activities={financeData}
              loading={loading}
              hasMore={hasMore}
              onScrollToEnd={hasMore ? fetchMore : () => { }}
              options={{
                showCategories: true,
                actions: [
                  {
                    type: ActivityActionType.UPDATE,
                    text: 'Update Mapping',
                    onClick: (activity) => {
                      dispatch({
                        type: 'openUpdateMappingModal',
                        payload: {
                          description: activity.desc || '',
                          category: activity.category
                        }
                      })
                    }
                  },
                  {
                    type: ActivityActionType.DELETE,
                    text: 'Delete',
                    onClick: ({ id }) => deleteAndFetch(id)
                  },
                  {
                    type: ActivityActionType.SEE_RELATED,
                    text: 'Related',
                    onClick: ({ id }) => dispatch({
                      type: 'openRelatedActivitiesModal',
                      payload: id
                    })
                  }
                ]
              }}
            />
          </div>
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
