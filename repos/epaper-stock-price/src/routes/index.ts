"use strict";

import { Router } from "express";

import API from "./api";
import AuthAPI from "./auth";
import UsersAPI from "./users";
import DeviceAPI from "./devices";
import MyDeviceAPI from "./my-devices";
import FirmwareAPI from "./firmware";
import P500API from "./p500Apis";
export default class Api {
  app: any;
  router: Router;
  routeGroups: any[];

  constructor(app) {
    this.app = app;
    this.router = Router();
    this.routeGroups = [];
  }

  loadRouteGroups() {
    // this.routeGroups.push(new PagesRoute());
    // this.routeGroups.push(new HomeApi());
    // this.routeGroups.push(new UserAPI());
    this.routeGroups.push(new API());
    this.routeGroups.push(new AuthAPI());
    this.routeGroups.push(new UsersAPI());
    this.routeGroups.push(new DeviceAPI());
    this.routeGroups.push(new MyDeviceAPI());
    this.routeGroups.push(new FirmwareAPI());
    this.routeGroups.push(new P500API());
  }

  setContentType(req, resp, next) {
    resp.set("Content-Type", "text/html");
    next();
  }

  registerGroup() {
    this.loadRouteGroups();
    this.routeGroups.forEach((rg) => {
      // const setContentType = rg.setContentType ? rg.setContentType : this.setContentType;
      this.app.use(rg.getRouteGroup(), rg.getRouter());
    });
  }
}
