"use strict";

import { Router } from "express";
import multer from "multer";
import fs from "fs";
import {
  getAllFirmwares,
  createFirmware,
  isVersionExists,
  deleteFirmware,
  downloadFirmware,
  pushFirmwareToDevices,
  isFirmwareValid,
} from "../handlers/firmware";

import { isAdminJWT, isLoggedInJWT } from "../handlers/_middlewares";
import { sendErrorResponse } from "../handlers/utils";
import { saveTop10 } from "../handlers/top10";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/firmwares");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage });

const uploadMiddleware = (req, res, next) => {
  // If version checks pass, process file upload

  const handler = upload.single("firmwareFile");

  handler(req, res, (err) => {
    if (err) {
      // Handle Multer errors here
      return sendErrorResponse(res, err.message || "There was an error processing the request", 1);
    } else {
      next();
    }
  });
};

export default class FirmwareAPI {
  router: Router;

  constructor() {
    this.router = Router();
    this.registerRoutes();
  }

  registerRoutes() {
    const router = this.router;

    router.get("/firmwares", isLoggedInJWT, isAdminJWT, getAllFirmwares);
    router.post("/chk-firmware", isLoggedInJWT, isAdminJWT, isFirmwareValid);
    router.post("/firmware", isLoggedInJWT, isAdminJWT, uploadMiddleware, createFirmware);
    router.delete("/firmware/:id", isLoggedInJWT, isAdminJWT, deleteFirmware);

    router.get("/firmware/download/:id", isLoggedInJWT, isAdminJWT, downloadFirmware);
    router.post("/firmware/push/:id", isLoggedInJWT, isAdminJWT, pushFirmwareToDevices);

    //  router.post("/push/:deviceId", isLoggedIn, isAdmin, pushFirmwareToDevices);

    //router.get("/deviceDownload/:firmwareId/:macAddress", downloadFirmwareDevice);

    //? TOP 10 APIs
    router.post("/top10", isLoggedInJWT, isAdminJWT, saveTop10);
  }

  getRouter() {
    return this.router;
  }

  getRouteGroup() {
    return "/api/admin";
  }
}
