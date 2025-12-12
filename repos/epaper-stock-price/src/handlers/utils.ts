import { Response } from "express";
import { sign, verify, JwtPayload } from "jsonwebtoken";
import conf from "../conf";


export const sendErrorResponse = (res: Response, message: string = null, type = 0, statusCode = 400) =>
  sendResponse(false, message || "There is some error processing your request", null, res, type, true, statusCode);

export const sendResponse = (
  success: boolean,
  message: string,
  data: any,
  res: Response,
  type = 0,
  isError = false,
  statusCode = 400
) =>
  res
    .status(!isError ? 200 : statusCode)
    .json({ success, message: message || "There is some error processing the request", data, type });

export const issueJWT = (userId: string, isAdmin: boolean, timeZone: string) => {
  try {
    const expiresIn = "3d";

    const payload = {
      sub: userId,
      isa: isAdmin,
      iat: Date.now(),
      tz: timeZone,
    };

    const signedToken = getJWT(payload, expiresIn);
    return {
      token: "Bearer " + signedToken,
      expires: expiresIn,
    };
  } catch (error) {
    console.error(error);
    return { token: null, expires: null };
  }
};

export const getJWT = (payload: any, expiresIn) => sign(payload, conf.app.jwtsecret, { expiresIn });

export const verifyJWT = (token: string): any => {
  try {
    const splitToken = token.split(" ");
    const _token = splitToken[1] ? splitToken[1] : token;
    return verify(_token, conf.app.jwtsecret);
  } catch (error) {
    throw error;
  }
};

export const adminMenu = [
  // {
  //   id: "home",
  //   title: "Home",
  //   icon: "Home",
  //   iconType: "rf",
  //   navLink: "/home",
  // },
  {
    id: "my-devices",
    title: "My Devices",
    icon: "stock",
    iconType: "svg",
    navLink: "/my-devices",
  },
  {
    id: "users",
    title: "Users",
    icon: "Users",
    iconType: "rf",
    navLink: "/admin/users",
  },
  {
    id: "Devices",
    title: "Devices",
    icon: "microchip",
    iconType: "svg",
    navLink: "/admin/devices",
  },
  {
    id: "firmware",
    title: "Firmwares",
    icon: "Cpu",
    iconType: "rf",
    navLink: "/admin/firmware",
  },
  {
    id: "my-playlists",
    title: "My Playlists",
    icon: "List",
    iconType: "rf",
    navLink: "/my-playlists",
  },
  {
    id: "top-10",
    title: "Top 10",
    icon: "Star",
    iconType: "rf",
    navLink: "/admin/top10",
  },
];

export const userMenu = [
  // {
  //   id: "home",
  //   title: "Home",
  //   icon: "Home",
  //   iconType: "rf",
  //   navLink: "/home",
  // },
  {
    id: "my-devices",
    title: "Devices",
    icon: "stock",
    iconType: "svg",
    navLink: "/my-devices",
  },
  {
    id: "register-devices",
    title: "New Device",
    icon: "PlusSquare",
    iconType: "rf",
    navLink: "/register-devices",
  },
  {
    id: "my-playlists",
    title: "My Playlists",
    icon: "List",
    iconType: "rf",
    navLink: "/my-playlists",
  },
];
