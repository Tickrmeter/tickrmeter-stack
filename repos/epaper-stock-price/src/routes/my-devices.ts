"use strict";

import { Router } from "express";

import { isLoggedInJWT } from "../handlers/_middlewares";

import { deleteMyAccount } from "../handlers/auth";

import {
  getAllMyDevices,
  getMyDevice,
  updateMyDevice,
  registerDevice,
  getMyDeviceForOTA,
  removeMyDevice,
  validateRegCode,
} from "../handlers/devices";

import {
  downloadSignedFirmwareDevice,
  downloadUnsignedFirmwareDevice,
  pushFirmwareToDevices,
} from "../handlers/firmware";

import {
  getMyPlaylists,
  saveMyPlaylist,
  getPlaylistDetails,
  updateMyPlaylist,
  deleteMyPlaylist,
} from "../handlers/playlists";

export default class HomeApi {
  router: Router;

  constructor() {
    this.router = Router();
    this.registerRoutes();
  }

  registerRoutes() {
    const router = this.router;

    router.get("/my-devices", isLoggedInJWT, getAllMyDevices);
    router.get("/my-device/:id", isLoggedInJWT, getMyDevice);
    router.get("/my-device/ota/:id", isLoggedInJWT, getMyDeviceForOTA);
    router.put("/my-device/:id", isLoggedInJWT, updateMyDevice);

    router.put("/validate", isLoggedInJWT, validateRegCode);
    router.put("/register-device", isLoggedInJWT, registerDevice);
    router.put("/remove-device/:id", isLoggedInJWT, removeMyDevice);

    router.post("/firmware/push/:id", isLoggedInJWT, pushFirmwareToDevices);

    router.get("/ota/:firmwareId/:macAddress/signed", downloadSignedFirmwareDevice); //add signed firmware download to request
    router.get("/ota/:firmwareId/:macAddress", downloadUnsignedFirmwareDevice);

    router.get("/my-playlists", isLoggedInJWT, getMyPlaylists);
    router.get("/my-playlist/:id", isLoggedInJWT, getPlaylistDetails);
    router.post("/my-playlist", isLoggedInJWT, saveMyPlaylist);
    router.put("/my-playlist", isLoggedInJWT, updateMyPlaylist);
    router.delete("/my-playlist/:id", isLoggedInJWT, deleteMyPlaylist);

    router.post("/profile/remove-account", isLoggedInJWT, deleteMyAccount);
  }

  getRouter() {
    return this.router;
  }

  getRouteGroup() {
    return "/api";
  }
}
