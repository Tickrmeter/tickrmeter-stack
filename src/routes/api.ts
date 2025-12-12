"use strict";

import { Router } from "express";

import { isLoggedInJWT } from "../handlers/_middlewares";
import { disableAlert, searchSymbolsNew, pushToDeviceNew } from "../handlers/deviceConfig";
import { searchSymbolsForAutoComplete, searchSymbolsForAutoComplete2 } from "../handlers/search";
import { getPageToDevice } from "../handlers/page-mode";
import { getElectricityUserAddresses, searchUserAddress } from "../handlers/electricityAPI";
import config from "../conf";
import { DEFAULT_TIMEZONE } from "../constants";
export default class HomeApi {
  router: Router;

  constructor() {
    this.router = Router();
    this.registerRoutes();
  }

  registerRoutes() {
    const router = this.router;
    // router.get("/welcome", (req, res) => {
    //   console.log("a================");
    //   const wpath = "/home/ubuntu/epaper-stock-price/src/emails/templates/welcome.ejs";
    //   console.log(wpath);
    //   res.render(wpath, { username: "uzair", linkHref: "http://google.com" });
    // });

    //router.get("/wo", forgotPassword);

    router.get("/pages/:id", getPageToDevice);

    router.get("/electricity-user-addresses", isLoggedInJWT, getElectricityUserAddresses);
    router.get("/elec-address-search", isLoggedInJWT, searchUserAddress);

    router.get("/coins/search", isLoggedInJWT, searchSymbolsForAutoComplete2);
    router.get("/indices/search", isLoggedInJWT, searchSymbolsForAutoComplete2);
    router.get("/etfs/search", isLoggedInJWT, searchSymbolsForAutoComplete2);

    router.get("/symbol-search/:stream/:market", isLoggedInJWT, searchSymbolsForAutoComplete);

    //router.get("/symbols/search/:type/:symbol/:currency", isLoggedInJWT, searchSymbols);
    //router.post("/quote/push", isLoggedInJWT, pushToDevice);
    router.post("/alert/disable/:id", isLoggedInJWT, disableAlert);

    // ** not using as we are returning the stock quote in search
    //  router.get("/stock-quote/:type/:symbol/:currency", isLoggedInJWT, getStockQuote);
    router.post("/symbols/search-with-market", isLoggedInJWT, searchSymbolsNew);
    router.post("/quote/push-with-market", isLoggedInJWT, pushToDeviceNew);


    //-----
  }

  getRouter() {
    return this.router;
  }

  getRouteGroup() {
    return "/api";
  }
}
