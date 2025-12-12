//const BASE_URI = `${process.env.REACT_APP_API_URI}/api`;
const BASE_URI = `${process.env.REACT_APP_API_URI}/api`;
// ** without /
export const API_PATHS = {
  login: "auth/login",
  register: "auth/register",
  confirm: "auth/confirm",
  forgotPassword: "auth/forgot-password",
  resetPassword: "auth/reset-password",
  refreshToken: "auth/refresh-token",

  logout: "auth/logout",

  CREATE_USER: "admin/user",
  ALL_USERS: "admin/users",
  GET_USER: "admin/user",
  UPDATE_USER: "admin/user",
  DELETE_USER: "admin/user",

  ALL_DEVICES: "admin/devices",
  CREATE_DEVICE: "admin/device",
  GET_DEVICE: "admin/device",
  UPDATE_DEVICE: "admin/device",
  DELETE_DEVICE: "admin/device",

  MY_DEVICES: "my-devices",
  GET_MY_DEVICES: "my-device",
  GET_MY_DEVICES_OTA: "my-device/ota",
  UPDATE_MY_DEVICE: "my-device",
  REGISTER_DEVICE: "register-device",
  REMOVE_DEVICE: "remove-device",

  MY_PLAYLISTS: "my-playlists",
  DELETE_PLAYLIST: "my-playlist",
  SAVE_MY_PLAYLIST: "my-playlist",
  GET_PLAYLIST_DETAILS: "my-playlist",

  DISABLE_ALERT: "alert/disable",

  ALL_FIRMWARES: "admin/firmwares",
  UPLOAD_FIRMWARE: "admin/firmware",
  DELETE_FIRMWARE: "admin/firmware",
  DOWNLOAD_FIRMWARE: "admin/firmware/download",
  PUSH_FIRMWARE: "admin/firmware/push",
  CHK_FIRMWARE: "admin/chk-firmware",
  USER_PUSH_FIRMWARE: "firmware/push",
  UPLOAD_TOP10_DATA: "admin/top10",

  ELECTRICITY_USER_ADDRESSES: "electricity-user-addresses",

  SEARCH_SYMBOL: "symbols/search",
  SEARCH_SYMBOL_MARKET: "symbols/search-with-market",
  QUOTE_PUSH: "quote/push",
  QUOTE_PUSH_MARKET: "quote/push-with-market",

  PROFILE: "profile",
  DELETE_ACCOUNT: "profile/remove-account",

  INDICES_SEARCH: "indices/search",
  ETF_SEARCH: "etfs/search",
  SYMBOL_SEARCH: "symbols/symbol-search",
  COIN_SEARCH: "coins/search",

  AUTO_COMPELETE_SEARCH: "symbol-search",
  ELEC_ADDRESS_SEARCH: "elec-address-search",
};

export const ApiEndPoint = (path) => `${BASE_URI}/${path}`;
