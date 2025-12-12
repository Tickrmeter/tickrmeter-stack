import { Request, Response, NextFunction } from "express";
import { DEFAULT_TIMEZONE, NOTFOUND_URL } from "../constants";

import { IUserReq } from "../models/interfaces";
import { sendErrorResponse, sendResponse, verifyJWT } from "./utils";

export const isLoggedInJWT = (req: Request, res: Response, next: NextFunction) => {
  const { authorization: token } = req.headers;

  try {
    const decodedUser = verifyJWT(token);
    if (!decodedUser) return sendResponse(false, "Unauthorized request", null, res);

    req.user = {
      userId: decodedUser.sub,
      timeZone: decodedUser.tz || DEFAULT_TIMEZONE,
      isAdmin: decodedUser.isa,
    };

    next();
  } catch (error) {
    //sendResponse(false, "Unauthorized request", null, res);
    sendErrorResponse(res, "Unauthorized request", 1, 401);
    // res.status(404).send("Sorry can't find that!");
    //res.status(404).redirect(NOTFOUND_URL);
  }
};

export const isAdminJWT = (req: Request, res: Response, next: NextFunction) =>
  (req.user as IUserReq).isAdmin ? next() : sendResponse(false, "Unauthorized request", null, res);
