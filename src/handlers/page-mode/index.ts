import { Request, Response } from "express";
import { sendErrorResponse, sendResponse } from "../utils";

export const getPageToDevice = async (req: Request, res: Response) => {
  try {
    const pageId = req.params.id;
    const type = req.query.type;

    //create file path from pageId to device-pages folder
    const filePath = `device-pages/${pageId}.${type || "bin"}`;

    //send file to resopnse
    res.sendFile(filePath, { root: "./" });
  } catch (error) {
    sendErrorResponse(res, error, 1);
  }
};