// **  Initial State
const initialState = {
  userData: JSON.parse(localStorage.getItem("userData")) || {},
  menuItems: JSON.parse(localStorage.getItem("menuItems")) || [],
};

const authReducer = (state = initialState, action) => {
  switch (action.type) {
    case "LOGIN":
      return {
        ...state,
        userData: action.data,
        menuItems: action.data.menuItems,
        [action.config.storageTokenKeyName]: action[action.config.storageTokenKeyName],
      };
    case "LOGOUT":
      const obj = { ...action };
      delete obj.type;
      return { ...state, userData: {}, ...obj };
    default:
      return state;
  }
};

export default authReducer;
