"use strict";

import { Router, Request, Response, NextFunction } from "express";

import config from "../conf";
import { DEFAULT_TIMEZONE } from "../constants";
import { registerDevice, removeDevice, pushToP500Device } from "../handlers/p500";

interface IUserInfo {
  userId: string;
  timeZone: string;
  isAdmin: boolean;
}

interface IP500Headers {
  apikey?: string;
  uid?: string;
}

export default class P500API {
  private readonly router: Router;
  private readonly apiKey: string | null;
  private readonly allowedUserIds: string[] | null;

  constructor() {
    this.router = Router();
    this.apiKey = config?.app?.plus500TestAPIKey || null;
    this.allowedUserIds = config.app?.p500UIds?.split(",") || null;
    this.registerRoutes();
  }

  private validateAuth(headers: IP500Headers): { status: number; message: string } | null {
    if (!this.apiKey || !this.allowedUserIds) return { status: 403, message: "Unauthorized" };

    if (!headers.apikey) return { status: 401, message: "Missing API Key" };

    if (headers.apikey !== this.apiKey) return { status: 401, message: "Invalid API Key" };

    if (!headers.uid) return { status: 401, message: "Missing User ID" };

    if (!this.allowedUserIds.includes(headers.uid)) return { status: 403, message: "User ID not authorized" };

    return null;
  }

  private authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    const error = this.validateAuth(req.headers as IP500Headers);
    if (error) {
      res.status(error.status).send(error.message);
      return;
    }
    req.user = this.createUserInfo(req.headers.uid as string);
    next();
  };

  private createUserInfo(uid: string): IUserInfo {
    return {
      userId: uid,
      timeZone: DEFAULT_TIMEZONE,
      isAdmin: false,
    };
  }

  private registerRoutes(): void {
    this.router.post("/register-device", this.authMiddleware, registerDevice);
    this.router.post("/remove-device", this.authMiddleware, removeDevice);
    this.router.post("/push-with-market", this.authMiddleware, pushToP500Device);
  }

  getRouter() {
    return this.router;
  }

  getRouteGroup() {
    return "/api/p500";
  }
}
