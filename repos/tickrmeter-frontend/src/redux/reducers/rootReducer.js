// ** Redux Imports
import { combineReducers } from "redux";

// ** Reducers Imports
import auth from "./auth";
import navbar from "./navbar";
import layout from "./layout";
import data from "./data";
const rootReducer = combineReducers({
  auth,
  navbar,
  layout,
  data,
});

export default rootReducer;
