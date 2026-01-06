import { useContext, useEffect, useMemo, useReducer, useState } from 'react'
import { Link } from 'react-router-dom'
import Tabs from 'react-bootstrap/Tabs'
import Tab from 'react-bootstrap/Tab'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'

import {
  postMappings,
  deleteActivity,
  ActivityRow,
  getDeletedActivities,
  patchActivity,
} from '../../api'
import UpdateMappingModal from '../../Components/UpdateMappingModal'
import { useAuth0TokenSilent } from '../../hooks'
import RelatedActivitiesModal from '../../Components/RelatedActivitiesModal'
import DeletedActivitiesTable from '../../Components/DeletedActivitiesTable'
import { reducer } from './reducers'
import { useFinanceDataFetcher } from './effects'
import { ActivitiesTable, ActivityActionType } from '../../Components/ActivitiesTable'
import { MultiSelectContext } from '../../Contexts/MultiSelectContext'
import { SelectedActivitiesModal } from '../../Components/SelectedActivitiesModal'
import { CategoriesContext } from '../../Contexts/CategoriesContext'
import { CategorySelect } from '../../Components/CategorySelect'

export function Home() {
  const token = useAuth0TokenSilent()

  const {
    selectedIds,
    updateSelectedActivities
  } = useContext(MultiSelectContext)

  const {
    allCategories: allCategoriesContext,
    refetch: refetchCategories
  } = useContext(CategoriesContext)

  const [state, dispatch] = useReducer(reducer, {
    showUpdateMappingModal: false,
    showRelatedActivitiesModal: false,
    showSelectedActivitiesModal: false,
    relatedActivity: null,
    description: '',
    category: '',
    allCategories: [],
    filterByCategory: '',
  })

  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [deletedActivities, setDeletedActivities] = useState<ActivityRow[]>([])

  const { financeData, loading, hasMore, fetchMore, reFetch, clearData } =
    useFinanceDataFetcher(token, setErrorMessage, { 
      category: state.filterByCategory, 
      limit: 20,
    })

  useEffect(() => {
    if (token) {
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

  const selectedActivities = useMemo(() => {
    return financeData.filter(({ id }) => selectedIds.has(id))
  }, [financeData, selectedIds])

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

  async function updateNewCategory(desc: string, newCategory: string): Promise<boolean> {
    const sizeToRefetch = financeData.length
    try {
      const postResponse = await postMappings(token, {
        description: desc,
        category: newCategory,
      })
      if (!postResponse.ok) {
        throw Error("error updating category mapping, api response not ok")
      }
      reFetch(true, sizeToRefetch)
      refetchCategories()
      return true
    } catch (err) {
      console.log(err)
      setErrorMessage(`Error updating category mapping${err.message}`)
    }
    return false
  }

  function patchActivityCategory(activity: ActivityRow, newCategory: string) {
    if (!token) return
    patchActivity(token, activity.id, { category: newCategory } ).then(() => {
      reFetch(true, financeData.length)
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
            <Button onClick={() => dispatch({
              type: 'openSelectedActivitiesModal'
            })}
              disabled={selectedIds.size === 0}
            >
              {selectedIds.size} activities selected
            </Button>
            {selectedIds.size > 0 && <Button onClick={() => updateSelectedActivities([])}>
              Clear Selected
            </Button>}
            <div>
              <Form.Label>Filter by Category:</Form.Label>
              <CategorySelect
                category={state.filterByCategory}
                onCategoryChange={(cat) => {
                  clearData()
                  dispatch({
                    type: 'setFilterByCategory',
                    payload: cat
                  })
                }}
                defaultLabel="None"
              />
            </div>
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
                    onClick: (activity) => dispatch({
                      type: 'openRelatedActivitiesModal',
                      payload: activity
                    })
                  }
                ],
                onActivityCategoryChange: patchActivityCategory,
                refetch: () => reFetch()
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
        allCategories={allCategoriesContext}
        submit={updateNewCategory}
      />
      <RelatedActivitiesModal
        show={state.showRelatedActivitiesModal}
        closeModal={(shouldRefetch: boolean) => {
          dispatch({
            type: 'closeRelatedActivitiesModal'
          })
          if (shouldRefetch) 
            reFetch(true, financeData.length)
        }}
        activity={state.relatedActivity || undefined}
      />
      <SelectedActivitiesModal
        show={state.showSelectedActivitiesModal}
        closeModal={() => {
          dispatch({
            type: 'closeSelectedActivitiesModal'
          })
          reFetch(true, financeData.length)
        }}
        activities={selectedActivities}
      />
    </div>
  )
}

export default Home
