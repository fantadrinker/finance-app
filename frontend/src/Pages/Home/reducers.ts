import { ActivityRow } from "../../api";

interface HomeState {
  showUpdateMappingModal: boolean;
  showRelatedActivitiesModal: boolean;
  showSelectedActivitiesModal: boolean;
  relatedActivity: ActivityRow | null;
  description: string;
  category: string;
  allCategories: string[];
  filterByCategory: string;
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
        relatedActivity: action.payload
      }
    case 'openSelectedActivitiesModal':
      return {
        ...state,
        showSelectedActivitiesModal: true
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
    case 'setFilterByCategory':
      return {
        ...state,
        filterByCategory: action.payload,
      }
    default:
      return state
  }
}
