import { Request, Response } from "express";
import { hash } from "bcrypt";
import { IUser, IUserReq } from "../models/interfaces";
import UserModel from "../models/user";
import DeviceModel from "../models/device";
import { adminMenu, issueJWT, sendErrorResponse, sendResponse, userMenu } from "./utils";
import { DEFAULT_TIMEZONE } from "../constants";

export const getAllUsers = async (req: Request, res: Response) => {
  const { success, data: users } = await UserModel.getAllWithDevices();

  if (!success) sendErrorResponse(res);
  else sendResponse(true, "User Fetched", users, res);
};

export const getAllUsersWithPaging = async (req: Request, res: Response) => {
  //get page and limit from query params
  const { p, ps, s: sort, q } = req.query;
  const page = parseInt(p as string) || 1;
  const limit = parseInt(ps as string) || 10;

  const { success, data: users } = await UserModel.getAllWithDevicesWithPaging(
    page,
    limit,
    sort.toString(),
    q as string
  );

  // const { success, data: users } = await UserModel.getAllWithDevices();

  if (!success) sendErrorResponse(res);
  else sendResponse(true, "User Fetched", users, res);
};

export const createUser = async (req: Request, res: Response) => {
  const { body } = req;
  console.log("createUser", body);

  // check for email uniqueness

  const user = await UserModel.getUser({ email: body?.email });

  if (user.success) {
    console.log("User found redirecting back");
    // const userErrorOpts: IPageOpts = { ...pageOpts, error: "Email already exists" };
    // res.render("pages/create-user", userErrorOpts);
    sendResponse(false, "User with email address is already exists.", null, res, 1);

    return;
  }
  // if false then create user

  const password = await hash(body.password, 5);

  const User: IUser = {
    name: body.name,
    email: body.email,
    password,
    isActive: body.isActive,
    userRole: body.isAdmin ? 2 : 3,
    enableFastRefresh: false,
    timeZone: body.timeZone || DEFAULT_TIMEZONE,
    timeFormat: body.timeFormat || "12h",
    token: "",
    meta: body?.meta || {},
  };

  const newUser = await UserModel.add(User);

  if (newUser.success) return sendResponse(true, "User created successfully", newUser, res, 1);

  // const userErrorOpts2: IPageOpts = { ...pageOpts, error: "Error creating user" };
  // res.render("pages/create-user", userErrorOpts2);
  sendResponse(false, "There is some error processing your request.", null, res, 1);
};

export const getUser = async (req: Request, res: Response) => {
  const { id } = req.params;

  if (id) {
    const { success, data: user } = await UserModel.getById(id);

    if (success) {
      const userValues = {
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.userRole === 1 || user.userRole === 2,
        isActive: user.isActive,
      };

      sendResponse(true, "User Fetched", userValues, res);
    } else {
      sendErrorResponse(res);
    }
  } else {
    // create new user
    sendErrorResponse(res);
  }
};

export const updateUser = async (req: Request, res: Response) => {
  const {
    body,
    params: { id },
  } = req;

  if (body._id !== id) return sendErrorResponse(res, "id not matched");

  console.log("updateUser", body);

  const { success, data: user } = await UserModel.getById(body._id);

  if (success) {
    const password = body.password ? await hash(body.password, 5) : user.password;

    const User: IUser = {
      _id: body._id,
      name: body.name,
      email: user.email,
      password,
      isActive: body.isActive,
      userRole: user.userRole === 1 ? 1 : body.isAdmin ? 2 : 3,
      enableFastRefresh: body.enableFastRefresh,
      timeZone: body.timeZone,
      timeFormat: body.timeFormat || "12h",
      token: "",
      meta: body?.meta || user?.meta || {},
    };

    const updatedUser = await UserModel.update(User);

    if (updatedUser.success) return sendResponse(true, "Updated Successfully", null, res);
  }

  sendErrorResponse(res, "id not matched");
};

export const deleteUser = async (req: Request, res: Response) => {
  console.log("deleteUser");
  const {
    body,
    params: { id },
  } = req;

  if (!body._id || body._id !== id) return sendErrorResponse(res, "Ids not matched", 1);

  const { success, data: devices } = await DeviceModel.getAllDevicesWithUser({ userId: body._id });

  // if user has devices don't delete the user
  if (success && devices.length > 0) return sendErrorResponse(res, "Unable to delete user with assigned devices.", 1);

  const { success: success2 } = await UserModel.delete(body._id);

  if (success2) return sendResponse(true, "User deleted successfully.", null, res);

  return sendErrorResponse(res);
  // res.status(401).send({ error: "Unable to delete the user." });
};

export const getProfile = async (req: Request, res: Response) => {
  const reqUser = req?.user as IUserReq;

  const { success, data: user } = await UserModel.getById(reqUser.userId);

  if (!success) return sendErrorResponse(res);

  const userValues: IUser = {
    _id: user._id,
    name: user.name,
    email: user.email,
    timeZone: user.timeZone,
    timeFormat: user.timeFormat || "12h",
    enableFastRefresh: user.enableFastRefresh || false,
    userRole: undefined,
    isActive: undefined,
    password: undefined,
    token: undefined,
    meta: user?.meta || {},
  };
  console.log(user);
  sendResponse(true, "PROFILE_FETCHED", userValues, res);
};

export const updateProfile = async (req: Request, res: Response) => {
  const { body } = req;
  const currentUser = req?.user as IUserReq;

  if (body._id.toString() !== currentUser.userId.toString()) return sendErrorResponse(res);

  const { success, data: user } = await UserModel.getUser({ _id: currentUser.userId, isActive: true });

  if (!success) return sendErrorResponse(res);

  // ** if password exists in body, update it
  const password = body.password ? await hash(body.password, 5) : user.password;

  const User: IUser = {
    _id: body._id,
    name: body.name,
    email: user.email,
    password,
    isActive: user.isActive,
    userRole: user.userRole,
    enableFastRefresh: body.enableFastRefresh,
    timeZone: body.timeZone,
    timeFormat: body.timeFormat || "12h",
    token: "",
    meta: body?.meta || user?.meta || {},
  };

  const updatedUser = await UserModel.update(User);

  if (updatedUser.success) {
    const isAdmin = User.userRole === 1 || User.userRole === 2;
    const { token, expires } = issueJWT(User._id, isAdmin, User.timeZone);

    const userValues = {
      userData: {
        _id: User._id,
        name: User.name,
        email: User.email,
        timeZone: User.timeZone,
        enableFastRefresh: User.enableFastRefresh || false,
        isAdmin: User.userRole === 1 || User.userRole === 2 || undefined,
      },
      menuItems: isAdmin ? adminMenu : userMenu,
      token,
      expires,
    };
    return sendResponse(true, "UPDATE SUCCESSFULLY", userValues, res);
  }

  sendErrorResponse(res);
};
