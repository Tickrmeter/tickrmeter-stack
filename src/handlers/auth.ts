import { Request, Response } from "express";
import { adminMenu, userMenu, issueJWT, sendResponse, sendErrorResponse, getJWT, verifyJWT } from "./utils";
import UserModel from "../models/user";
import { randomBytes } from "crypto";
import PlaylistModel from "../models/playlist";
import DeviceModel from "../models/device";
import moment from "moment";
import { IUser } from "../models/interfaces";
import { hash } from "bcrypt";
import { sendAuthEmails } from "../emails/authEmails";
import { DEFAULT_TIMEZONE, tokenExpiryDuration } from "../constants";

export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) return sendResponse(false, null, {}, res);

  //const { success, data: _user } = await UserModel.Login({ email: /^$ email.toLowerCase()$/i, password });
  const { success, data: _user } = await UserModel.Login({ email: email.toLowerCase(), password });

  if (success) {
    if (_user.isActive === false) return sendResponse(false, "USER_NOT_ACTIVE", {}, res);

    const { token, expires } = issueJWT(_user._id, _user.userRole === 1 || _user.userRole === 2, _user.timeZone);

    if (!token) return sendResponse(false, "Unable to authenticate user", {}, res);

    const isAdmin = _user.userRole === 1 || _user.userRole === 2 || undefined;
    const user = {
      userData: {
        _id: _user._id,
        name: _user.name,
        email: _user.email.toLowerCase(),
        timeZone: _user.timeZone,
        enableFastRefresh: _user.enableFastRefresh || false,
        isAdmin,
      },
      menuItems: isAdmin ? adminMenu : userMenu,
      token,
      expires,
    };

    return sendResponse(true, "Authenticated Successfull", user, res);
  }

  return sendResponse(false, "Unable to authenticate user", {}, res);
};

export const registerUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password, timeZone, meta } = req.body;

    if (!name || !email || !password) return sendResponse(false, null, {}, res);

    // check if email is unique

    const { success: s2, data } = await UserModel.getAll({ email: email.toLowerCase() });

    if (!s2) return sendErrorResponse(res);
    if (data.length > 0) return sendErrorResponse(res, "EMAIL_EXISTS");

    // Generate a Confirmation Key

    const confirmToken = {
      token: randomBytes(64).toString("hex"),
      created: moment().toDate(),
    };

    const newUser: IUser = {
      name,
      email: email.toLowerCase(),
      password: await hash(password, 5),
      isActive: false,
      userRole: 3,
      token: "",
      timeZone: timeZone || DEFAULT_TIMEZONE,
      timeFormat: "12h",
      enableFastRefresh: false,
      confirmToken: { ...confirmToken },
      meta: meta || {},
    };

    // Save the user
    const { success, data: _user, message } = await UserModel.add(newUser);

    if (!success) return sendErrorResponse(res, message);

    console.log("send user email", confirmToken);
    // send user email
    sendAuthEmails(newUser, "new-user");

    // send response
    return sendResponse(true, "USER_REGISTERED", null, res);
  } catch (error) {
    sendErrorResponse(res);
  }
};

export const resendConfirmation = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const { success, data: user } = await UserModel.getUser({ email: email.toLowerCase() });

    if (!success) return sendErrorResponse(res, "USER_NOT_FOUND");

    if (user.isActive) return sendErrorResponse(res, "USER_ALREADY_ACTIVE");

    const confirmToken = {
      token: randomBytes(64).toString("hex"),
      created: moment().toDate(),
    };

    const updatedUser = { ...user, confirmToken: { ...confirmToken } };

    const { success: s2 } = await UserModel.update(updatedUser);

    if (!s2) return sendErrorResponse(res, "UNABLE_TO_RESEND");

    sendAuthEmails({ ...updatedUser, confirmToken }, "new-user");

    sendResponse(true, "EMAIL_SENT", null, res);
  } catch (error) {
    sendErrorResponse(res);
  }
};

export const confirmUser = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    const { success, data: user } = await UserModel.getUser({ "confirmToken.token": token });

    if (!success) return sendErrorResponse(res, "INVALID_TOKEN");

    const updatedUser = { ...user, isActive: true, confirmToken: null };

    const { success: s2 } = await UserModel.update(updatedUser);

    if (!s2) sendErrorResponse(res, "UNABLE_TO_ACTIVATE");

    sendResponse(true, "USER_ACTIVATED", null, res);
  } catch (error) {
    sendErrorResponse(res);
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    //const email = "uzair.ali@gmail.com";

    const { success, data: user } = await UserModel.getUser({ email: email.toLowerCase() });

    console.log(success, user);
    if (success) {
      const resetToken = {
        token: randomBytes(64).toString("hex"),
        created: moment().toDate(),
      };

      const emailToken = { token: getJWT(resetToken, tokenExpiryDuration), created: resetToken.created };

      const updatedUser: IUser = { ...user, resetToken };
      console.log(user, emailToken, updatedUser);
      await UserModel.update(updatedUser);
      sendAuthEmails({ ...updatedUser, resetToken: emailToken }, "forgot-password");
    }

    sendResponse(true, "EMAIL_SENT", null, res);
  } catch (error) {
    console.error("error", error);
    sendErrorResponse(res);
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;

    const decryptedJWt = verifyJWT(token);

    const { success, data: user } = await UserModel.getUser({ "resetToken.token": decryptedJWt.token });

    console.log(req.body, success, user, decryptedJWt);

    const tokenCreationDate = moment(user?.resetToken?.created);
    console.log(tokenCreationDate.format("hh:mm:ss"));
    console.log("herere", tokenCreationDate.isAfter(moment()));
    if (!tokenCreationDate.isValid() || tokenCreationDate.isAfter(moment())) {
      console.log("Invalid token");
      return sendErrorResponse(res, "INVALID_TOKEN");
    }

    const updatedUser: IUser = {
      ...user,
      password: await hash(password, 5),
      resetToken: null,
    };

    console.log({ updatedUser });

    const { success: s2, data: d } = await UserModel.update(updatedUser);
    console.log({ s2, d });
    if (!s2) return sendErrorResponse(res);

    sendResponse(true, "RESET_SUCCESS", null, res);
  } catch (error) {
    console.error("error", error);
    sendErrorResponse(res);
  }
};

//confirm user password and then delete user account and all associated data (devices, playlists, etc) from the database
export const deleteMyAccount = async (req: Request, res: Response) => {
  try {
    const loggedInUser = req.user;
    const { email, password } = req.body;

    if (!email || !password) return sendErrorResponse(res, "INVALID_DATA");

    const { success, data: user } = await UserModel.Login({ email: email.toLowerCase(), password });
    if (!success) return sendErrorResponse(res, "INVALID_CREDENTIALS");
    console.log(loggedInUser, success, user);
    if (user._id.toString() !== loggedInUser.userId.toString()) return sendErrorResponse(res, "INVALID_DATA");
    if (user.userRole === 1 || user.userRole === 2) return sendErrorResponse(res, "UNABLE_TO_DELETE_ADMIN");

    await PlaylistModel.deleteUserPlaylists(user._id.toString());
    await DeviceModel.deleteUserDevices(user._id.toString());

    //delete user devices

    const { success: s2 } = await UserModel.delete(user._id);

    if (!s2) return sendErrorResponse(res, "UNABLE_TO_DELETE");

    sendResponse(true, "ACCOUNT_DELETED", null, res);
  } catch (error) {
    console.error("deleteMyAccount", error);
    sendErrorResponse(res);
  }
};
