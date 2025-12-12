import { Request, Response } from "express";

import { sendErrorResponse, sendResponse } from "./utils";
import { IUserReq } from "../models/interfaces";
import axios, { AxiosRequestConfig } from "axios";

const apiBaseURL = "https://api.minstroem.app";
const bearerToken = "f2514bdf2e46ffb834e1657801e7f2e3567c7c5737106acfcbfd89865b9890e6";

export const getElectricityUserAddresses = async (req: Request, res: Response) => {
  try {
    const user = req.user as IUserReq;
    const test = req.query.test;

    //    const url = `${apiBaseURL}/thirdParty/prices/DK1`;
    //const url = `${apiBaseURL}/thirdParty/users/${user.userId}/connectedAddresses`;
    const url = test
      ? `${apiBaseURL}/thirdParty/users/6245aeb520eaba02ab6308a4/connectedAddresses`
      : `${apiBaseURL}/thirdParty/users/${user.userId}/connectedAddresses`;

    const config: AxiosRequestConfig = {
      headers: {
        Authorization: `Bearer ${bearerToken}`,
      },
    };

    const response = await axios
      .get(url, config)
      .then(({ data }) => data)
      .catch((e) => e.response.data);

    console.log({ url, response: response });

    //create an array for dummy denmark addresses with 3 addresses, with fields id, address, full address

    const testResponse = test
      ? [
          {
            _id: "1",
            address: "Test 1",
            fullAddress: "Test 1, 1234 Test 1",
          },
          {
            _id: "2",
            address: "Test 2",
            fullAddress: "Test 2, 1234 Test 2",
          },
          {
            _id: "3",
            address: "Test 3",
            fullAddress: "Test 3, 1234 Test 3",
          },
        ]
      : [];

    // sendResponse(true, "OK", testResponse, res);

    if (response.error) return sendResponse(false, "NO ADDRESSES FOUND", [], res);

    return sendResponse(true, "OK", response, res);
  } catch (ex) {
    console.error(ex);
    return sendErrorResponse(res, "Error fetching electricity user addresses");
  }
};

export const searchUserAddress = async (req: Request, res: Response) => {
  try {
    const search = req.query.q as string;

    const url = `${apiBaseURL}/thirdParty/prices/addresses/suggestions/${search}`;
    const config: AxiosRequestConfig = {
      headers: {
        Authorization: `Bearer ${bearerToken}`,
      },
    };

    const response = await axios.get(url, config).then(({ data }) => data);

    console.log(url, response);

    return sendResponse(true, "OK", response, res);
  } catch (error) {}
};
