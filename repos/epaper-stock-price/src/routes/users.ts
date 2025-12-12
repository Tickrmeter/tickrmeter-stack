"use strict";

import { Router } from "express";
import { getAllUsersWithPaging, getProfile } from "../handlers/users";
import { isAdminJWT, isLoggedInJWT } from "../handlers/_middlewares";
import { getAllUsers, createUser, getUser, updateUser, deleteUser, updateProfile } from "../handlers/users";

export default class HomeApi {
  router: Router;

  constructor() {
    this.router = Router();
    this.registerRoutes();
  }

  registerRoutes() {
    const router = this.router;

    router.get("/profile", isLoggedInJWT, getProfile);
    router.put("/profile", isLoggedInJWT, updateProfile);

    //router.get("/admin/users", isLoggedInJWT, isAdminJWT, getAllUsers);
    router.get("/admin/users", isLoggedInJWT, isAdminJWT, getAllUsersWithPaging);
    router.post("/admin/user", isLoggedInJWT, isAdminJWT, createUser);
    router.get("/admin/user/:id", isLoggedInJWT, isAdminJWT, getUser);
    router.put("/admin/user/:id", isLoggedInJWT, isAdminJWT, updateUser);
    router.delete("/admin/user/:id", isLoggedInJWT, isAdminJWT, deleteUser);
  }

  getRouter() {
    return this.router;
  }

  getRouteGroup() {
    return "/api";
  }
}
