// types
export const SET_LOADING = 'SET_LOADING';
export const CLEAR_LOADING = 'CLEAR_LOADING';

// initial state
const initialState = {
  isLoading: false,
  message: '',
  subtitle: '',
  type: 'default' // 'project-creation', 'page-navigation', etc.
};

// ==============================|| LOADING REDUCER ||============================== //

const loading = (state = initialState, action) => {
  switch (action.type) {
    case SET_LOADING:
      return {
        ...state,
        isLoading: true,
        message: action.payload.message || 'Loading...',
        subtitle: action.payload.subtitle || '',
        type: action.payload.type || 'default'
      };
    case CLEAR_LOADING:
      return {
        ...state,
        isLoading: false,
        message: '',
        subtitle: '',
        type: 'default'
      };
    default:
      return state;
  }
};

export default loading;

// action creators
export const setLoading = (payload) => ({
  type: SET_LOADING,
  payload
});

export const clearLoading = () => ({
  type: CLEAR_LOADING
});