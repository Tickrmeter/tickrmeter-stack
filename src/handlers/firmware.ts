import { Request, Response } from "express";
import moment from "moment";
import fs from "fs";
import path from "path";

import { IFirmware, IUserReq } from "../models/interfaces";
import FirmwareModel from "../models/firmware";
import DeviceModel from "../models/device";

import { sendErrorResponse, sendResponse } from "./utils";
//import { uploadDir } from "..";
import conf from "../conf";
import { publishData } from "../services/mqtt";
import { otaFileBaseURL } from "../constants";

export const getAllFirmwares = async (req: Request, res: Response) => {
  const { success, data } = await FirmwareModel.getAll();

  const firmwareLists = data
    .map((d) => ({
      ...d,
      isRelease: d?.isRelease || false,
      createdAt: moment(d.createdAt).format("DD-MMM-YYYY HH:mm:ss"),
    }))
    .sort((a, b) => b.isRelease - (a.isRelease || false) || b.createdAt.localeCompare(a.createdAt));

  if (!success) sendErrorResponse(res);
  else sendResponse(true, "Firmwares Fetched", firmwareLists, res);
};

export const isVersionExists = async (versionNo: string) => {
  const firmware = await FirmwareModel.getByVersionNo(versionNo);

  return firmware.success;
};

export const isFirmwareValid = async (req: Request, res: Response) => {
  const { version, fileName } = req.body;

  if (!version) return sendErrorResponse(res, "Invalid or missing version number.", 1);

  if (!fileName) return sendErrorResponse(res, "Invalid or missing file name.", 1);

  // Check if version already exists
  const isVerExists = await isVersionExists(version);

  if (isVerExists) return sendErrorResponse(res, `Version No ${version} already exists.`, 1);

  // Check if file already exists
  const filePath = `uploads/firmwares/${fileName}`;
  const isFileExists = fs.existsSync(filePath);

  if (isFileExists) return sendErrorResponse(res, `File ${fileName} already exists.`, 1);

  sendResponse(true, "OK", null, res);
};

export const createFirmware = async (req: Request, res: Response) => {
  const { body, file } = req;
  console.log("createFirmware", body, file);

  //check if the added version has isRelease tag true
  const currentUser = req?.user as IUserReq;

  if (!currentUser) return sendErrorResponse(res, "Invalid user", 1);

  if (body.isRelease.toString() === "true") {
    //update all other firmwares to isRelease false
    await FirmwareModel.updateAllToFalse();
  }

  const Firmware: IFirmware = {
    fileName: file.filename,
    version: body.version,
    uploadedBy: currentUser.userId,
    isRelease: body.isRelease || false,
  };

  const newFirmware = await FirmwareModel.add(Firmware);

  if (newFirmware.success) return sendResponse(true, "Uploaded Successfully", null, res);

  sendErrorResponse(res);
};

export const deleteFirmware = async (req: Request, res: Response) => {
  const {
    body,
    params: { id },
  } = req;

  if (!body._id || body._id !== id) return sendErrorResponse(res);

  const { success, data: firmware } = await FirmwareModel.getById(body._id);

  if (!success) return sendErrorResponse(res);

  const fileName = `uploads/firmwares/${firmware.fileName}`;

  if (fs.existsSync(fileName)) {
    fs.unlinkSync(fileName);
  }

  const { success: deleteSuccess } = await FirmwareModel.delete(body._id);

  if (deleteSuccess) sendResponse(true, "Firmware deleted successfully.", null, res);
  else sendErrorResponse(res, "Unable to delete the Firmware.", 1);
};

export const downloadFirmware = async (req: Request, res: Response) => {
  const { id } = req.params;

  if (id) {
    const { success, data: firmware } = await FirmwareModel.getById(id);

    const fileName = getFirmwareFilePath(firmware.fileName);

    if (success) {
      if (fs.existsSync(fileName)) {
        return res.download(fileName);
      }
    }
  }

  sendErrorResponse(res, "File not found", 1);
};

export const pushFirmwareToDevices = async (req: Request, res: Response) => {
  const {
    body,
    params: { id },
  } = req;

  if (!body._id || body._id !== id) return sendErrorResponse(res);

  const { success, data: firmware } = await FirmwareModel.getById(body?._id);
  if (!success) return sendErrorResponse(res);

  //const fileName = `${uploadDir}/firmwares/${firmware.fileName}`;

  const firmwarePath = getFirmwareFilePath(firmware.fileName);

  const isRetained = parseInt(firmware.version) > 20 ? true : false;

  // console.log(firmware.version, isRetained, parseInt(firmware.version), parseInt(firmware.version) > 20);
  //if (!firmwarePath) return sendErrorResponse(res);

  const fileUrl = `${otaFileBaseURL}/${firmware._id.toString()}`;

  if (!fs.existsSync(firmwarePath)) return sendErrorResponse(res, "File not found on server", 1);

  const data = { version: firmware.version, url: fileUrl };

  // ** If device id exists send the update to single device else send to all
  if (body.deviceId) {
    const device = await DeviceModel.getById(body.deviceId);
    if (!device.success) return sendErrorResponse(res);

    publishData(`FIRMWAREUPDATE/${device.data.macAddress}`, JSON.stringify(data), 1, isRetained);
    sendResponse(true, "Firmware pushed successfully, it will take few minutes to complete the process.", null, res, 1);
  } else {
    //publishData("FIRMWAREUPDATE", JSON.stringify(data));
    sendResponse(true, "Firmware pushed successfully, it will take few minutes to complete the process.", null, res, 1);
  }
};

// Reply to device with the signed version of firmware id
// Messages coming from /ota/:macAddress/:firmwareId/signed
export const downloadSignedFirmwareDevice = async (req: Request, res: Response) => {
  //add signed firmware download to request
  //req.params.signed = "true";
  downloadFirmwareDevice(req, res, true);
};

export const downloadUnsignedFirmwareDevice = async (req: Request, res: Response) => {
  downloadFirmwareDevice(req, res, false);
};

export const downloadFirmwareDevice = async (req: Request, res: Response, signed = false) => {
  const { macAddress, firmwareId } = req.params;
  console.log(`downloadFirmwareDevice by ${macAddress} :  ${firmwareId}`);

  if (!macAddress || !firmwareId) return res.status(404).send("File not found");

  const { success, data: device } = await DeviceModel.getByMacAddress(macAddress);
  if (!success) return res.status(404).send("File not found");

  const { success: success2, data: firmware } = await FirmwareModel.getById(firmwareId);
  if (!success2) return res.status(404).send("File not found");

  // add .signed to file name if signed FW is requested
  const fileName = `${getFirmwareFilePath(firmware.fileName)}${signed ? ".signed" : ""}`;
  //const fileName = `${uploadDir}/firmwares/${firmware.fileName}`;

  if (fs.existsSync(fileName)) return res.download(fileName);

  res.status(404).send("File not found.");
};

export const getFirmwareFilePath = (fileName: string) => {
  const uploadDir = conf?.app?.uploadDir;

  if (!uploadDir) return "";
  return path.resolve(uploadDir, "firmwares", fileName);
};
