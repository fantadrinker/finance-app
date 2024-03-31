
/**
 * const [showUpdateMappingModal, setShowUpdateMappingModal] =
    useState<boolean>(false)
  const [showRelatedActivitiesModal, setShowRelatedActivitiesModal] =
    useState<boolean>(false)
  const [relatedActivityId, setRelatedActivitiesId] = useState<string | null>(
    null
  )
  const [description, setDescription] = useState<string>('')
  const [category, setCategory] = useState<string>('')

  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [allCategories, setAllCategories] = useState<string[]>([])

  const [deletedActivities, setDeletedActivities] = useState<ActivityRow[]>([])
 */


interface HomeState {
  showUpdateMappingModal: boolean
  showRelatedActivitiesModal: boolean
  relatedActivityId: string | null
  description: string
  category: string
  allCategories: string[]
}

interface HomeActions {
  type: string
  payload?: any
}

export function reducer(state: HomeState, action: HomeActions): HomeState {
  switch (action.type) {
    case 'openUpdateMappingModal':
      const { description, category } = action.payload
      if (!description || !category) {
        return state
      }
      return { 
        ...state,
        showUpdateMappingModal: true, 
        description, 
        category 
      }
    case 'openRelatedActivitiesModal':
      if (!action.payload) {
        return state
      }
      return { 
        ...state, 
        showRelatedActivitiesModal: true,
        relatedActivityId: action.payload
      }
    case 'updateAllCategories':
      return { 
        ...state, 
        allCategories: action.payload 
      }
    case 'updateNewCategory':
      return { 
        ...state, 
        showUpdateMappingModal: false,
        allCategories: [...state.allCategories, action.payload]
      }
    case 'closeUpdateMappingModal':
      return { 
        ...state, 
        showUpdateMappingModal: false 
      }
    case 'closeRelatedActivitiesModal':
      return { 
        ...state, 
        showRelatedActivitiesModal: false 
      }
    default:
      return state
  }
}