import { Request, Response } from "express";
//import moment from "moment";
import fs from "fs";
import { sendErrorResponse, sendResponse } from "./utils";

import { IDevice, IPlaylist, IUser, IUserReq } from "../models/interfaces";

import FirmwareModel from "../models/firmware";
import DeviceModel from "../models/device";
import PlaylistModel from "../models/playlist";
import UserModel from "../models/user";
import { publishData } from "../services/mqtt";
import { DATA_MARKETS, DATA_STREAM, MSG_TYPES, SYMBOL_TYPE, SYMBOL_TYPE_OBJ, otaFileBaseURL } from "../constants";
import { getFirmwareFilePath } from "./firmware";
import { DateTime } from "luxon";
import { PushPolygonQuote } from "./quotes_api/polygon";
import { text } from "stream/consumers";
import { formatDate } from "./quotes/helper";
import { PushFinageQuote } from "./quotes_api/finage";

export const getAllDevices = async (req: Request, res: Response) => {
  const { success, data: devices } = await DeviceModel.getAllDevicesWithUser({});

  if (!success) sendErrorResponse(res);
  else sendResponse(true, "Devices Fetched", devices, res);
};

export const getAllDevicesWithPagination = async (req: Request, res: Response) => {
  //get p and s from query params

  const { p, ps, s: sort, q } = req.query;

  const page = parseInt(p as string) || 1;
  const limit = parseInt(ps as string) || 10;

  const { success, data: devices } = await DeviceModel.getAllDevicesWithUserPaging(
    q as string,
    page,
    limit,
    sort.toString()
  );

  if (!success) sendErrorResponse(res);
  else sendResponse(true, "Devices Fetched", devices, res);
};

export const createDevice = async (req: Request, res: Response) => {
  const { body } = req;
  // console.log("createDevice", body);
  // ** check for mac address uniqueness
  const device = await DeviceModel.getByMacAddress(body?.macAddress);

  // console.log(device, "dev");
  if (device.success) {
    console.log("Device found redirecting back");
    sendResponse(false, "Device with mac address is already exists.", null, res, 1);
    return;
  }

  // if false then create device

  const mode = SYMBOL_TYPE_OBJ[body.symbolType].mode || "text";

  const Device: IDevice = {
    name: body.name,
    macAddress: body.macAddress,
    userId: null,
    mode,
    config: {
      stream: "",
      market: "",
      symbol: "",
      interval: "",
      symbolType: 0,
      currency: "",
      ledBrightness: 100,
      gainTrackingEnabled: false,
      purchasePrice: null,
      noOfStocks: null,
      showFullAssetValue: false,
      isShortSell: false,
    },
    lastStatusOn: DateTime.now(),
    batteryStatus: 0,
    isActive: body.isActive,
    isPlaylist: false,
    playlistId: null,
    playlist: null,
  };

  const newDevice = await DeviceModel.add(Device);

  if (newDevice.success) return sendResponse(true, "Device created successfully", newDevice, res, 1);
  return sendErrorResponse(res);
};

export const getDevice = async (req: Request, res: Response) => {
  const { id } = req.params;

  if (id) {
    const { success, data: device } = await DeviceModel.getById(id);

    if (success) {
      const deviceValues = {
        _id: device._id,
        name: device.name,
        macAddress: device.macAddress,
        lastStatus: device.lastStatusOn || DateTime.now(),
        batteryStatus: device?.batteryStatus || 0,
        isActive: device.isActive,
      };

      sendResponse(true, "Device Fetched", deviceValues, res);
    } else {
      sendErrorResponse(res);
    }
  } else {
    // create new user
    sendErrorResponse(res);
  }
};

export const updateDevice = async (req: Request, res: Response) => {
  const {
    body,
    params: { id },
  } = req;

  if (body._id !== id) return sendErrorResponse(res, "id not matched");

  //console.log("updateDevice", body);

  const { success, data: device } = await DeviceModel.getById(body._id);

  if (success) {
    const DeviceToUpdate: IDevice = {
      _id: body._id,
      name: body.name,
      macAddress: device.macAddress,
      mode: device.mode,
      userId: device?.userId || null,
      lastStatusOn: device?.lastStatusOn || DateTime.now(),
      batteryStatus: device?.batteryStatus || 0,
      isActive: body.isActive,
    };

    const updatedDevice = await DeviceModel.update(DeviceToUpdate);

    if (updatedDevice.success) return sendResponse(true, "Updated Successfully", null, res);
  }

  sendErrorResponse(res);
};

export const deleteDevice = async (req: Request, res: Response) => {
  console.log("deleteDevice");
  const {
    body,
    params: { id },
  } = req;

  if (!body._id || body._id !== id) return sendErrorResponse(res);

  const { success } = await DeviceModel.delete(body._id);

  if (success) return sendResponse(true, "Device deleted successfully.", null, res);

  return sendErrorResponse(res);
  // res.status(401).send({ error: "Unable to delete the user." });
};

export const getAllMyDevices = async (req: Request, res: Response) => {
  const currentUser = req?.user as IUserReq;
  const { success, data: myDevices } = await DeviceModel.getAllDevicesWithUser({ userId: currentUser.userId });
  if (!success) sendErrorResponse(res);
  else sendResponse(true, "User Fetched", myDevices, res);
};

export const getMyDevice = async (req: Request, res: Response) => {
  const { id } = req.params;
  const currentUser = req?.user as IUserReq;

  if (!id) return sendErrorResponse(res, "Device not found!", 1);

  const { success, data: device } = await DeviceModel.getById(id);

  if (!success) return sendErrorResponse(res, "Device not found!", 1);

  if (device.userId.toString() !== currentUser.userId) return sendErrorResponse(res);

  const deviceValues = {
    _id: device._id,
    name: device.name,
    macAddress: device.macAddress,
    lastStatus: device.lastStatusOn || DateTime.now(),
    batteryStatus: device?.batteryStatus || 0,
    isActive: device.isActive,
    nightMode: device?.nightMode || false,
    nightModeStart: device?.nightModeStart || "22:00",
    nightModeEnd: device?.nightModeEnd || "06:00",
    ...device,
  };

  return sendResponse(true, "Device Fetched", deviceValues, res);
};

export const getMyDeviceForOTA = async (req: Request, res: Response) => {
  const { id } = req.params;
  const currentUser = req?.user as IUserReq;

  if (!id) return sendErrorResponse(res, "Device not found!", 1);

  const { success, data: device } = await DeviceModel.getById(id);

  if (!success) return sendErrorResponse(res, "Device not found!", 1);

  if (device.userId.toString() !== currentUser.userId) return sendErrorResponse(res);

  const deviceValues = {
    _id: device._id,
    name: device.name,
    macAddress: device.macAddress,
    isActive: device.isActive,
  };

  const { success: s2, data: _firmwares } = await FirmwareModel.getAll();

  if (!s2) return sendErrorResponse(res);

  const firmwares = _firmwares.map((f: any) => ({ _id: f._id, name: f.fileName }));

  return sendResponse(true, "Fetched Successfully", { device: deviceValues, firmwares }, res);
};

export const updateMyDevice = async (req: Request, res: Response) => {
  const {
    body,
    params: { id },
  } = req;

  if (!id || body._id !== id) return sendErrorResponse(res, "id not matched");

  const currentUser = req?.user as IUserReq;

  const { success, data: device } = await DeviceModel.getById(body._id);

  if (!success) return sendErrorResponse(res, "Device not found!", 1);

  if (device.userId.toString() !== currentUser.userId) return sendErrorResponse(res);

  const DeviceToUpdate: IDevice = {
    macAddress: device.macAddress,
    userId: device.userId,
    lastStatusOn: device.lastStatusOn || DateTime.now(),
    batteryStatus: device?.batteryStatus || 0,
    isActive: body.isActive,
    ...device,
    _id: body._id,
    name: body.name,
    nightMode: body.nightMode || false,
    nightModeStart: body.nightModeStart || null,
    nightModeEnd: body.nightModeEnd || null,
  };

  const updatedDevice = await DeviceModel.update(DeviceToUpdate);

  if (updatedDevice.success) return sendResponse(true, "Updated Successfully", null, res);

  sendErrorResponse(res);
};

export const validateRegCode = async (req: Request, res: Response) => {
  try {
    const { body } = req;

    if (!body.registrationCode) return sendErrorResponse(res, "Invalid Registration Code.");

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

    const validLuxon = DateTime.fromISO(valid.toISOString());

    if (!(DateTime.local() < validLuxon))
      return sendErrorResponse(res, "Registration code expired, kindly restart your device to get the new code.", 1);

    return sendResponse(true, "OK", null, res);
  } catch (error) {
    console.error(error);
    return sendErrorResponse(res);
  }
};

export const registerDevice = async (req: Request, res: Response) => {
  try {
    const { body } = req;

    if (!body.registrationCode) return sendErrorResponse(res, "Invalid Registration Code.");

    console.log("================== REGISTER DEVICE =================");
    console.log("registerDevice-body", body);

    //const currentUser = req?.user as IUserReq;

    const { data: user } = await UserModel.getById((req?.user as IUserReq).userId);

    const { success, data: devices } = await DeviceModel.getAll({ "registration.key": body.registrationCode });

    console.log({ devices }, devices.length);

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

    //....
    let resData;
    let isPlaylist = false;

    let deviceToUpdate: IDevice | null;
    if (user?.meta?.company === "J&T Arch" || user?.meta?.country === "czech_republic") {
      resData = await getDeviceToUpdate(user, device, true);
      deviceToUpdate = resData?.deviceToUpdate;
      isPlaylist = true;
      if (!deviceToUpdate) return;
    } else if (user?.meta?.country === "denmark") {
      isPlaylist = false;
      deviceToUpdate = {
        ...device,
        isActive: true,
        registration: null,
        config: {
          market: "EQUITY",
          stream: DATA_STREAM.TRADINGVIEW,
          symbol: "F00000Q6YT",
          currency: "EUR",
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
        userId: user._id,
      };
    } else {
      isPlaylist = false;
      deviceToUpdate = {
        ...device,
        isActive: true,
        registration: null,
        config: {
          market: DATA_MARKETS.US_STOCKS,
          stream: DATA_STREAM.POLYGON,
          symbol: "TSLA",
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
        userId: user._id,
      };
    }
    console.log(deviceToUpdate);

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

    let pushQuoteParams;
    if (user?.meta && user?.meta?.custom) {
      if (user?.meta?.company === "J&T Arch") {
        const { symbolToPush } = resData;
        pushQuoteParams = {
          stream: DATA_STREAM.FINAGE,
          symbol: symbolToPush.symbol,
          symbolType: symbolToPush.symbolType,
          currency: symbolToPush.currency,
          market: symbolToPush.market,
        };
      }
    } else if (user?.meta?.country === "denmark") {
      pushQuoteParams = {
        stream: DATA_STREAM.TRADINGVIEW,
        symbol: "F00000Q6YT",
        symbolType: SYMBOL_TYPE.STOCK,
        currency: "EUR",
        market: "EQUITY",
      };
    } else {
      pushQuoteParams = {
        stream: DATA_STREAM.POLYGON,
        symbol: "TSLA",
        symbolType: SYMBOL_TYPE.STOCK,
        currency: "USD",
        market: DATA_MARKETS.US_STOCKS,
      };
    }

    pushQuoteParams = {
      ...pushQuoteParams,
      timeZone: user.timeZone,
      gainTracking: {
        enabled: false,
        purchasePrice: null,
        noOfStocks: null,
        showFullAssetValue: false,
        isShortSell: false,
      },
      multiplier: { enabled: false, value: 1 },
      deviceData: {
        macAddress: deviceToUpdate.macAddress,
        pushObject: {
          ...deviceToUpdate.config,
          isPlaylist,
          type: "NEW",
        },
        extras: {},
      },
    };

    const { success: s2, dataForDevice } =
      pushQuoteParams.stream === DATA_STREAM.POLYGON
        ? await PushPolygonQuote(pushQuoteParams)
        : pushQuoteParams.stream === DATA_STREAM.FINAGE
        ? await PushFinageQuote(pushQuoteParams)
        : { success: false, dataForDevice: null };

    setTimeout(() => {
      if (s2) {
        dataForDevice.date = formatDate(dataForDevice.date, user.timeZone || "UTC", user.timeFormat);
        publishData(deviceToUpdate.macAddress, JSON.stringify(dataForDevice));
      }
    }, 500);

    return sendResponse(true, "Device Registered Successfully", { deviceId: device._id }, res);
  } catch (error) {
    console.error(error);
    return sendErrorResponse(res);
  }
};

export const removeMyDevice = async (req: Request, res: Response) => {
  const {
    body,
    params: { id },
  } = req;

  console.log("REMOVE DEVICE");
  if (!body._id || body._id !== id) return sendErrorResponse(res);

  const { success, data: device } = await DeviceModel.getById(id);

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
};

export const onDeviceStatusRecieved = async (message: any) => {
  //TODO: UPDATE THE DEVICE IN THE DATABASE WITH BATTERY AND STATUS
  const { device: mac, battery, firmware_version } = message;

  DeviceModel.updateDeviceStatus(mac, { battery, firmware_version });
};

const getDeviceToUpdate = async (user: IUser, device: IDevice, isPlaylist: boolean) => {
  //create a custom playlist

  const customPlaylist: IPlaylist = {
    name: "J&T Arch Playlist",
    userId: user._id,
    cycleInterval: "120",
    cycleMode: "default",
    isCalculateOnDaily: false,
    updateInterval: "300",
    ledBrightness: 100,

    symbols: [
      {
        symbol: "JTINA",
        stream: DATA_STREAM.FINAGE,
        symbolType: SYMBOL_TYPE.STOCK,
        market: DATA_MARKETS.CZ_STOCKS,
        currency: "CZK",
        gainTrackingEnabled: false,
        purchasePrice: null,
        noOfStocks: null,
        showFullAssetValue: false,
        isShortSell: false,
        multiplier: 1,
        multiplierEnabled: false,
        aggregateTime: "1d",
        extraConfig: {
          aggregateTime: "1m",
          isMetalCommodity: false,
          unit: "",
        },
      },
      {
        symbol: "JTINV",
        stream: DATA_STREAM.FINAGE,
        symbolType: SYMBOL_TYPE.STOCK,
        market: DATA_MARKETS.CZ_STOCKS,
        currency: "CZK",
        gainTrackingEnabled: false,
        purchasePrice: null,
        noOfStocks: null,
        showFullAssetValue: false,
        isShortSell: false,
        multiplier: 1,
        multiplierEnabled: false,
        aggregateTime: "1d",
        extraConfig: {
          aggregateTime: "1m",
          isMetalCommodity: false,
          unit: "",
        },
      },
      {
        symbol: "JTINB",
        stream: DATA_STREAM.FINAGE,
        symbolType: SYMBOL_TYPE.STOCK,
        market: DATA_MARKETS.CZ_STOCKS,
        currency: "EUR",
        gainTrackingEnabled: false,
        purchasePrice: null,
        noOfStocks: null,
        showFullAssetValue: false,
        isShortSell: false,
        multiplier: 1,
        multiplierEnabled: false,
        aggregateTime: "1d",
        extraConfig: {
          aggregateTime: "1m",
          isMetalCommodity: false,
          unit: "",
        },
      },
    ],
  };

  //get user's playlists

  const { success: pSuccess, data: playlists } = await PlaylistModel.getUserPlaylists(user._id);

  let jtarchPlaylist;
  if (pSuccess && playlists.length > 0) {
    const jtPlaylist = playlists.find((p) => p.name === "J&T Arch Playlist");
    if (jtPlaylist) jtarchPlaylist = jtPlaylist;
  }

  if (!jtarchPlaylist) {
    const { success, data: newPlaylist } = await PlaylistModel.add(customPlaylist);
    if (!success) return null;
    jtarchPlaylist = newPlaylist;
  }

  const deviceToUpdate: IDevice = {
    ...device,
    isActive: true,
    registration: null,
    config: {},
    isPlaylist: true,
    userId: user._id,
    playlist: {
      name: jtarchPlaylist.name,
      cycleInterval: jtarchPlaylist.cycleInterval,
      cycleMode: jtarchPlaylist.cycleMode,
      isCalculateOnDaily: jtarchPlaylist.isCalculateOnDaily,
      updateInterval: jtarchPlaylist.updateInterval,
      ledBrightness: jtarchPlaylist.ledBrightness,
      symbols: jtarchPlaylist.symbols,
    },
    extras: {},
    playlistId: jtarchPlaylist._id,
    mode: "text",
  };

  const symbolToPush = customPlaylist.symbols[0];

  return { symbolToPush, deviceToUpdate };
};
