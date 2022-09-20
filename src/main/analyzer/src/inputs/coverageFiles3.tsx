export const initialState = {
  loading: true,
  movies: [],
  errorMessage: null,
};

export const reducer = (state: state, action: action): state => {
  switch (action.type) {
    case "SEARCH_MOVIES_REQUEST":
      return {
        ...state,
        loading: true,
        errorMessage: null,
      };
    case "SEARCH_MOVIES_SUCCESS":
      return {
        ...state,
        loading: false,
        movies: action.payload,
      };
    case "SEARCH_MOVIES_FAILURE":
      return {
        ...state,
        loading: false,
        errorMessage: action.error,
      };
    default:
      return state;
  }
};

type action = {
  type:
    | "SEARCH_MOVIES_REQUEST"
    | "SEARCH_MOVIES_SUCCESS"
    | "SEARCH_MOVIES_FAILURE";
  payload?: any;
  error?: any;
};
type state = {
  loading: boolean;
  movies: any[];
  errorMessage: string | null;
};
