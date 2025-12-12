"use strict";

import { Router } from "express";

import { loginUser, registerUser, confirmUser, forgotPassword, resetPassword } from "../handlers/auth";

export default class HomeApi {
  router: Router;

  constructor() {
    this.router = Router();
    this.registerRoutes();
  }

  registerRoutes() {
    const router = this.router;

    router.post("/login", loginUser);

    router.post("/register", (req, res, next) => setTimeout(() => next(), 1000), registerUser);
    router.post("/confirm", confirmUser);

    router.post("/forgot-password", forgotPassword);
    router.post("/reset-password", resetPassword);
  }

  getRouter() {
    return this.router;
  }

  getRouteGroup() {
    return "/api/auth";
  }
}
