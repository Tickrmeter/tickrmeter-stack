import { Request, Response } from "express";

import { ITop10, IUserReq } from "../models/interfaces";

import { sendErrorResponse, sendResponse } from "./utils";

import Top10Model from "../models/top10";

export const saveTop10 = async (req: Request, res: Response) => {
  const { body } = req;
  const currentUser = req?.user as IUserReq;

  const newTop10: ITop10[] = body.map((item) => ({
    symbol: item.Symbol,
    name: item.Name,
    price: item.Price,
    percent: item.Percent,
    date: item.Date,
    currency: item.Currency,
    uploadedBy: currentUser.userId,
  }));

  const { success, data } = await Top10Model.update(newTop10);

  if (success) sendResponse(true, "Top 10 saved successfully.", data, res);
  else sendErrorResponse(res, "Unable to save Top 10.", 1);
};
