interface HomeState {
  showUpdateMappingModal: boolean;
  showRelatedActivitiesModal: boolean;
  showSelectedActivitiesModal: boolean;
  relatedActivityId: string | null;
  description: string;
  category: string;
  allCategories: string[];
}

interface HomeActions {
  type: string;
  payload?: any;
}

export function reducer(state: HomeState, action: HomeActions): HomeState {
  switch (action.type) {
    case 'openUpdateMappingModal':
      const { description, category } = action.payload
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
    case 'openSelectedActivitiesModal':
      return {
        ...state,
        showSelectedActivitiesModal: true
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
    case 'closeSelectedActivitiesModal':
      return {
        ...state,
        showSelectedActivitiesModal: false
      }
    default:
      return state
  }
}
