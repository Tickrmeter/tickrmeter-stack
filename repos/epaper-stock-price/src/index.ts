import express from "express";
import path from "path";
import logger from "morgan";
import config from "./conf";
import cron from "node-cron";

import Api from "./routes/index";
import { startServer } from "./server";
import { connectMQTT } from "./services/mqtt";
import { askForDeviceStatus } from "./handlers";
import cors from "cors";

import { connectToMongoose } from "./services/db";
// import { InitPassportStrategies } from "./passportConfig";
//import { NOTFOUND_URL } from "./constants";

const whitelist = Object.keys(config.whitelist).map((k) => config.whitelist[k]);

const thirdPartyWhitelist = Object.keys(config?.whitelist_3party || {}).reduce((acc, k) => {
  acc[k] = config.whitelist_3party[k].split(",");
  return acc;
}, {});


console.log("Allowed P500 Ips", thirdPartyWhitelist["p500Ips"]);

const app = express();

// view engine setup
// app.set("views", path.join(__dirname, "views"));
app.use(function (req, res, next) {
  req.headers.origin = req.headers.origin || req.headers.host;

  next();
});

app.set("view engine", "ejs");
//app.use(expressLayouts);
app.use(logger("dev"));
app.use(express.json());

const pp = path.join(__dirname, "./public");
app.use(express.static(pp));
app.set("trust proxy", true);

const corsOptions = {
  origin: (origin, callback) => {
    console.log("origin", origin);
    origin = origin && (origin.includes("http") || origin.includes("esp")) ? origin : "http://" + origin;
    const originIsWhitelisted = whitelist.indexOf(origin) !== -1;

    console.log("Is IP allowed: " + originIsWhitelisted);
    const failureResp = "You are not authorized to perform this action";
    if (!originIsWhitelisted) {
      console.error(failureResp + "====" + origin);
    }
    callback(originIsWhitelisted ? null : failureResp, originIsWhitelisted);
  },
};

// Middleware to handle IP restriction and CORS
app.use((req, res, next) => {
  if (req.path.startsWith("/api/p500")) {
    // Extract the client IP using trusted headers
    const xRealIp = req.headers["x-real-ip"];
    let xForwardedFor = req.headers["x-forwarded-for"];

    if (Array.isArray(xForwardedFor)) xForwardedFor = xForwardedFor[0]; // Use the first IP in the array

    // Ensure clientIp is always a string
    const clientIpRaw = xRealIp || (xForwardedFor ? xForwardedFor.split(",")[0].trim() : req.ip);
    const clientIp = typeof clientIpRaw === "string" ? clientIpRaw : "";

    // Normalize IP for comparison (handle IPv4-mapped IPv6 addresses)
    const normalizedIp = clientIp.startsWith("::ffff:") ? clientIp.split("::ffff:")[1] : clientIp;

    // Define the list of allowed IPs
    const p500AllowedIps = thirdPartyWhitelist["p500Ips"];

    // Check if the IP is in the allowed list
    if (!p500AllowedIps.includes(normalizedIp)) {
      console.log("Unauthorized Request from IP:", normalizedIp);
      return res.status(401).send("Unauthorized Request");
    }

    // Proceed to the next middleware or route handler
    return next();
  } else {
    // Apply CORS for non-restricted routes
    cors(corsOptions)(req, res, next);
  }
});

app.use(express.urlencoded({ extended: false }));

//add static path for root

new Api(app).registerGroup();

// app.use((req, res, next) => {
//  res.status(404).redirect(NOTFOUND_URL);
// });

startServer(app);
connectToMongoose();
connectMQTT(() => console.log("MQTT Connected"));
// ! this is moved to the different application which handles the device communication
//subscribeToTopics();

export const uploadDir = path.join(__dirname, "../uploads");
//export const fileBaseURL = "http://3.141.141.38:2590/api/admin/deviceDownload";

cron.schedule("* * * * *", () => {
  askForDeviceStatus();
});

//GetQuoteFromElectricityPrices("electricity", -1, "DK1", "DKK", "Europe/Copenhagen", null);
