import { ApiEndPoint, API_PATHS } from "@store/api-paths";
import http from "@src/utility/http";

export const getAllDevices = () => async (dispatch) =>
  await http.getDispatch(ApiEndPoint(API_PATHS.ALL_DEVICES), dispatch, "GET_ALL_DEVICES");

export const getMyDevices = () => async (dispatch) =>
  await http.getDispatch(ApiEndPoint(API_PATHS.MY_DEVICES), dispatch, "GET_MY_DEVICES");

export const getAllUsers = () => async (dispatch) =>
  await http.getDispatch(ApiEndPoint(API_PATHS.ALL_USERS), dispatch, "GET_ALL_USERS");

export const getFirmwares = () => async (dispatch) =>
  await http.getDispatch(ApiEndPoint(API_PATHS.ALL_FIRMWARES), dispatch, "GET_FIRMWARES");


  export const getMyPlaylists = () => async (dispatch) =>
    await http.getDispatch(ApiEndPoint(API_PATHS.MY_PLAYLISTS), dispatch, "GET_MY_PLAYLISTS");