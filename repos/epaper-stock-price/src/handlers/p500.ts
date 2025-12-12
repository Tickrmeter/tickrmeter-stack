import { Request, Response } from "express";
//import moment from "moment";
import config from "../conf";
import fs from "fs";

import { publishData } from "../services/mqtt";

import { sendErrorResponse, sendResponse } from "./utils";
import { IDevice, IUserReq } from "../models/interfaces";
import FirmwareModel from "../models/firmware";
import DeviceModel from "../models/device";
import UserModel from "../models/user";

import { DATA_MARKETS, DATA_STREAM, MSG_TYPES, SYMBOL_TYPE, otaFileBaseURL } from "../constants";
import { getFirmwareFilePath } from "./firmware";
import { DateTime } from "luxon";
import http from "../services/http";
import { GetQuoteFromPolygon } from "./quotes_api/polygon";
import { GetPolygonQuote } from "./quotes/polygon";

export const registerDevice = async (req: Request, res: Response) => {
  try {
    const { body } = req;

    if (!body.registrationCode) return sendErrorResponse(res, "Invalid Registration Code.");

    console.log("================== REGISTER DEVICE =================");
    console.log("registerDevice-body", body);

    //const currentUser = req?.user as IUserReq;

    const { data: user } = await UserModel.getById((req?.user as IUserReq).userId);

    const { success, data: devices } = await DeviceModel.getAll({ "registration.key": body.registrationCode });

    // ** just for check if the same code is generated more than once.
    if (devices.length === 0) {
      console.log("Invalid code, please try again later.");
      return sendErrorResponse(res, "Invalid code, please try again later.", 1);
    }
    if (devices.length > 1) {
      console.log("Kindly regenerate the code, by restarting your Tickrmeter.");
      return sendErrorResponse(res, "Kindly regenerate the code, by restarting your Tickrmeter.", 1);
    }

    const device: IDevice = devices[0];
    const {
      registration: { key, valid },
    } = device;

    console.log({ valid });

    const validLuxon = DateTime.fromISO(valid.toISOString());

    console.log(key, validLuxon, DateTime.now() < validLuxon);

    if (!(DateTime.now() < validLuxon))
      return sendErrorResponse(res, "Registration code expired, kindly restart your device to get the new code.", 1);

    console.log("proceed with registration");

    let deviceToUpdate: IDevice | null;

    deviceToUpdate = {
      ...device,
      name: "P500 Device",
      isActive: true,
      registration: null,
      config: {
        market: DATA_MARKETS.US_STOCKS,
        stream: DATA_STREAM.POLYGON,
        symbol: "P500",
        currency: "USD",
        symbolType: SYMBOL_TYPE.STOCK,
        interval: "60",
        ledBrightness: 100,
        gainTrackingEnabled: false,
        purchasePrice: null,
        noOfStocks: null,
        showFullAssetValue: false,
        isShortSell: false,
        multiplier: 1,
        multiplierEnabled: false,
        alertEnabled: false,
        alertConfig: null,
      },
      extras: {
        company: "p500",
      },
      userId: user._id,
    };

    const updatedDevice = await DeviceModel.update(deviceToUpdate);

    if (!updatedDevice.success) sendErrorResponse(res);

    console.log({ updatedDevice });

    let firmwareData = undefined;

    const { success: fsuccess, data: releaseFirmware } = await FirmwareModel.getLatestFirmware();

    if (fsuccess) {
      const firmwarePath = getFirmwareFilePath(releaseFirmware.fileName);

      const fileUrl = `${otaFileBaseURL}/${releaseFirmware.id.toString()}`;

      if (!fs.existsSync(firmwarePath)) return sendErrorResponse(res, "File not found on server", 1);

      firmwareData = { version: releaseFirmware.version, url: fileUrl };
    }

    const dataToPublish = {
      type: MSG_TYPES.REG_SUCCESSFUL,
      message: "Registration Successfull",
      user: user._id,
      firmwareVer: releaseFirmware?.version,
      firmwareUrl: firmwareData?.url,
    };

    //publish registration message
    publishData(deviceToUpdate.macAddress, JSON.stringify(dataToPublish));

    const symbolDataToSend = await GetPolygonQuote({
      market: DATA_MARKETS.US_STOCKS,
      symbolType: SYMBOL_TYPE.STOCK,
      symbol: "TSLA",
      currency: "USD",
      gainTracking: {
        enabled: false,
        purchasePrice: null,
        noOfStocks: null,
        showFullAssetValue: false,
        isShortSell: false,
      },
      multiplier: { enabled: false, value: 1 },
      aggregateTime: "1d",
      unit: "",
    });

    //console.log("=======>>>symbolDataToSend<<===========", symbolDataToSend);

    if (symbolDataToSend.success) {
      setTimeout(() => {
        publishData(deviceToUpdate.macAddress, JSON.stringify({ ...symbolDataToSend.data, type: "NEW" }));
      }, 5000);
    }

    return sendResponse(
      true,
      "Device Registered Successfully",
      { deviceId: device._id, macAddress: device.macAddress },
      res
    );
  } catch (error) {
    console.error(error);
    return sendErrorResponse(res);
  }
};

export const removeDevice = async (req: Request, res: Response) => {
  try {
    const { body } = req;

    console.log("REMOVE DEVICE");

    const { success, data: device } = await DeviceModel.getById(body.deviceId);

    if (!success) return sendErrorResponse(res);

    const deviceToUpdate = {
      ...device,
      userId: null,
      registration: null,
      config: null,
      name: null,
      isPlaylist: false,
      playlistId: null,
      playlist: null,
    };

    const { success: s2, data } = await DeviceModel.update(deviceToUpdate);

    if (!s2) return sendErrorResponse(res);

    const dataToPublish = { type: MSG_TYPES.DEVICE_UNASSGINED, message: "Device registration removed." };
    publishData(deviceToUpdate.macAddress, JSON.stringify(dataToPublish));
    return sendResponse(true, "Device removed successfully.", null, res);
  } catch (error) {
    console.error(error);
    return sendErrorResponse(res);
  }
};

export const pushToP500Device = async (req: Request, res: Response) => {
  try {
    //    console.log(req.body);
    const rUser = req.user as IUserReq;
    let { deviceId } = req.body;

    const { success: userSuccess, data: user } = await UserModel.getById(rUser.userId);

    if (!userSuccess) return sendErrorResponse(res, "Unauthorized, user not found", 1, 403);

    const { success, data: device } = await DeviceModel.getById(deviceId);

    if (!success) return sendErrorResponse(res);

    if (!device) return sendErrorResponse(res, "Unauthorized, Device not found", 1, 403);

    const result = await getQuoteForP500Devices(device.macAddress);

    if (result) {
      return sendResponse(true, "Stock pushed successfully.", null, res);
    } else {
      return sendErrorResponse(res, `Error pushing stock:${JSON.stringify(result)}`, 1);
    }
  } catch (error) {
    console.error(error);
    return sendErrorResponse(res);
  }
};

const getQuoteForP500Devices = async (deviceMac: string) => {
  try {
    //console.log("getQuoteForP500Devices", deviceMac, "p500");

    const req = {
      type: "NEW",
      device: deviceMac,
    };

    const p500Url = config?.app?.p500URL;

    if (!p500Url) {
      console.error("P500 URL not found in config");
      return false;
    }

    const res = await http.post(p500Url, req);

    if (res?.price) {
      publishData(deviceMac, JSON.stringify({ ...res, type: "NEW" }));
      return true;
    }
    console.log("p500 res", p500Url, { res });
    console.log("*******%%%%%%%%%%----->>>>P500 price in result not found ", res);
    return false;
  } catch (error) {
    console.error("Error in getQuoteForP500Devices", error);
    return false;
  }
};
