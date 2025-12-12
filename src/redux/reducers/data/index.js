// ** Initial State
const initialState = {
  data: [],
  myDevices: [],
  allUsers: [],
  devices: [],
  firmwares: [],
};

const DataReducers = (state = initialState, action) => {
  const { type, data } = action;

  switch (type) {
    case "GET_ALL_DEVICES":
      return {
        ...state,
        devices: data.success ? data.data : [],
      };
    case "GET_MY_DEVICES":
      return {
        ...state,
        myDevices: data.success ? data.data : [],
      };
    case "GET_ALL_USERS":
      return {
        ...state,
        allUsers: data.success ? data.data : [],
      };
    case "GET_FIRMWARES":
      return {
        ...state,
        firmwares: data.success ? data.data : [],
      };
    case "GET_MY_PLAYLISTS":
      return {
        ...state,
        myPlaylists: data.success ? data.data : [],
      };
    default:
      return state;
  }
};

export default DataReducers;
