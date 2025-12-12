"use strict";

import { Router } from "express";

import { isAdminJWT, isLoggedInJWT } from "../handlers/_middlewares";

import {
  getAllDevices,
  getAllDevicesWithPagination,
  createDevice,
  getDevice,
  updateDevice,
  deleteDevice,
} from "../handlers/devices";

export default class HomeApi {
  router: Router;

  constructor() {
    this.router = Router();
    this.registerRoutes();
  }

  registerRoutes() {
    const router = this.router;

    //router.get("/devices", isLoggedInJWT, isAdminJWT, getAllDevices);
    router.get("/devices", isLoggedInJWT, isAdminJWT, getAllDevicesWithPagination);
    router.post("/device", isLoggedInJWT, isAdminJWT, createDevice);
    router.get("/device/:id", isLoggedInJWT, isAdminJWT, getDevice);
    router.put("/device/:id", isLoggedInJWT, isAdminJWT, updateDevice);
    router.delete("/device/:id", isLoggedInJWT, isAdminJWT, deleteDevice);
  }

  getRouter() {
    return this.router;
  }

  getRouteGroup() {
    return "/api/admin";
  }
}
