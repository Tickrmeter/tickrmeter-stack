import { DateTime } from "luxon";

import { DATA_STREAM, SYMBOL_TYPE } from "../../constants";

import { IGetPage, IPageQuoteFromAPI } from "./helper/interfaces";
import { getLowHighTime, secondsTillNextHour } from "../page-mode/helper";
import { Mapping } from "../page-mode/interfaces";
import conf from "../../conf";
import currencyList from "./jsonFiles/currencylist.json";
import { IDevicePage } from "../../models/interfaces";
import DevicePagesModel from "../../models/devicepage-native";
import { render } from "../page-mode/renderer";
import axios, { AxiosRequestConfig } from "axios";
import redis from "../../services/redis";
import { electricityRegions } from "./helper";

const baseURL = "https://api.minstroem.app/thirdParty/prices";
const addressBaseURL = `${baseURL}/addresses`;
const isElecApiEnabled = conf?.app?.electricity_api_enabled ?? false;

//** Calls when User press search symbol on UI and ... */

// const GetElectricityPricesData: IGetPageData = async ({ symbol, timeZone, currency, market }) => {
//   try {
//     const pageQuote = await getElectricityPricesFromAPI({
//       market,
//       symbol: symbol,
//       currency,
//       timeZone,
//     });

//     if (pageQuote.success) return { success: true, data: pageQuote.data, error: null };
//     else return { success: false, error: pageQuote.error, data: null };
//     //
//   } catch (error) {
//     throw error;
//   }
// };

const generateRandomAPIData = async () => {
  const generateRandomData = () => {
    const randomData = [];

    //starting date will be of current hour - 2
    let date = DateTime.local().toUTC().minus({ hour: 2 }).startOf("hour");

    for (let i = 0; i < 18; i++) {
      const price = Number((Math.random() * 2).toFixed(2));

      date = date.plus({ hour: 1 });
      const color = price > 1 ? "yellow" : "green";

      randomData.push({ date: date.toISO({ suppressMilliseconds: true }), price, color });
    }

    return randomData;
  };

  const response = generateRandomData();
  //console.log("random data for Test1 symbol", response);
  const currentHour = DateTime.local().setZone("UTC").set({ minute: 0, second: 0, millisecond: 0 });
  const currentPrice = response.find((d) => d.date === currentHour.toISO({ suppressMilliseconds: true }));

  const data = {
    symbol: "TEST1",
    date: currentHour.toFormat("dd.MM.yyyy"),
    price: currentPrice.price.toFixed(2).replace(".", ","),
    name: "Electricity Prices",
    currency: "kr",
    market: "TK1",
  };

  return { success: true, data: { data, electricityData: response, currentPrice, currentHour } };
};

const getErrorResponse = async (response: any, params, error) => {
  const { devicePage } = await getDevicePageFromDB(params);


  console.error("**************Error in getElectricityPricesFromAPI", response);

  const data = {
    page: [
      {
        id: devicePage?.pageId ?? -1,
        ledColor: "#000000",
        rev: devicePage?.rev ?? -1,
        blink: false,
        alert: false,
      },
    ],
  };

  return { success: false, data, error };
};

const getElectricityPricesFromAPI: IPageQuoteFromAPI = async (params) => {
  let response = null;
  try {
    if (params.symbol === "TEST1") {
      return generateRandomAPIData();
    }

    const redisKey = `ELECTRICIY:${params.market}:${params.symbol}`;

    const redisData = await redis.get(redisKey);

    if (!redisData) {
      const urlPrefix = electricityRegions.find((er) => er._id === params.symbol) ? baseURL : addressBaseURL;
      const url = `${urlPrefix}/${params.symbol}`;

      const token = conf?.app?.electricity_token;

      if (!token) throw new Error("Electricity: Token not found");

      const config: AxiosRequestConfig = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      //console.log({ params, url });

      //console.log("Electricity: Calling minst0rm API:", params?.macAddress ?? "Mac N/A", url);
      response = await axios
        .get(url, config)
        .then(({ data }) => data)
        .catch((e) => {
          console.error("Error calling minst0rm API", url, e.response.data);
          return e.response.data;
        });

      if (response.error) return getErrorResponse(response, params, response.error);
      //check if response is not an array
      if (!Array.isArray(response)) return getErrorResponse(response, params, "3rd Party Application Error");

      //console.log("setting data in redis", redisKey);
      redis.set(redisKey, JSON.stringify(response), "EX", 60 * 60);
    } else {
      //console.log("getting data from redis", redisKey);

      response = JSON.parse(redisData);
    }

    if (!Array.isArray(response)) return { success: false, data: null, error: "3rd Party Application Error" };

    const currentHour = DateTime.local().setZone("UTC").set({ minute: 0, second: 0, millisecond: 0 });
    const currentPrice = response.find((d) => d.date === currentHour.toISO({ suppressMilliseconds: true }));
    const currency = currencyList.find((c) => c.code === params.currency);

    const data = {
      symbol: params.symbol,
      date: currentHour.toFormat("dd.MM.yyyy"),
      price: currentPrice.price.toFixed(2).replace(".", currency.decimal),
      name: "Electricity Prices",
      currency: currency.symbol,
      market: params.market,
    };

    return { success: true, data: { data, electricityData: response, currentPrice, currentHour } };
  } catch (error) {
    console.error("Electricity: Error in getElectricityPricesFromAPI: ", response, error);
    return { success: false, data: null };
  }
};

const getMappingJson = (electricityData: any, currentHour: any, currentPrice: any, data: any, currency: any) => {
  const hoursDataRequired = 18;

  const nextHours = [];
  const lowHighHours = [];
  electricityData.every((d) => {
    const date = DateTime.fromISO(d.date).setZone("UTC");
    const diff = date.diff(currentHour, "hours").hours;

    const nextHourObj = { color: d.color, date: d.date, price: Number(d.price.toFixed(2)), idx: nextHours.length };

    if (diff >= -2) nextHours.push(nextHourObj);
    if (diff >= 0) lowHighHours.push(nextHourObj);

    if (nextHours.length === hoursDataRequired) return false;
    return true;
  });

  const cetTimeZone = "Europe/Copenhagen";

  //console.log("nextHours", nextHours);
  const mark = nextHours.findIndex((d) => d.date === currentPrice.date);

  const graphPrices = nextHours.map((d) => d.price);
  //graph prices should be exactly 188, thats why we are adding 0 to the end of array
  if (graphPrices.length < hoursDataRequired) {
    const diff = hoursDataRequired - graphPrices.length;
    for (let i = 0; i < diff; i++) {
      graphPrices.push(0);
    }
  }
  const lowhigh = getLowHighTime(lowHighHours, cetTimeZone);

  const mappingJson: Mapping = {
    Field1: "Nu",
    Field2: data.price,
    Field3: currency,
    Field4: lowhigh.low,
    Field5: lowhigh.high,
    graph: { type: 1, values: graphPrices, mark },
  };
  return mappingJson;
};

const getDevicePageFromDB = async (data) => {
  let DevPageModel: DevicePagesModel | null = null;
  try {
    DevPageModel = new DevicePagesModel();
    const { currency, symbol, market } = data;
    //** Get the page data from region (and address) */
    const dbQuery = {
      symbol,
      currency,
      market,
      symbolType: SYMBOL_TYPE.ELECTRICITY,
    };

    const { success, error, data: devicePage } = await DevPageModel.getOne(dbQuery);

    if (!success)
      return { success: false, data: null, error: "Error in ProcessPagesForElectricityPrices 0 ==>" + error };
    if (!devicePage) return { success: false, data: dbQuery, error: "No device page found in DB" };
    return { success: true, devicePage };
  } catch (error) {
    console.error("Error in getDevicePageFromDB", error);
    return { success: false, data: null, error: "Error in getDevicePageFromDB" };
  } finally {
    DevPageModel = null;
  }
};

//symbol is region + address
//currency is currency
//market is country
//symbolType is electricity
export const ProcessPagesForElectricityPrices = async (params) => {
  const { electricityData, currentPrice, currentHour, data } = params;

  const { success, devicePage, error } = await getDevicePageFromDB(data);

  if (!success) return { success: false, data: null, error };

  const { currency, symbol, market } = data;
  //calculate the seconds remaining till next hour 00
  const secondsRemainingTill00 = secondsTillNextHour();

  //check if the hour data is already in db
  if (devicePage && devicePage.currentHour === currentHour.hour) {
    const updatedAt = DateTime.fromISO(devicePage.updatedAt.toISOString());

    const response = {
      pageId: devicePage.pageId,
      ledColor: currentPrice.color,
      ttl: secondsRemainingTill00,
      rev: updatedAt.toUnixInteger(),
      price: devicePage.price ?? Number(currentPrice.price.toFixed(2)),
    };

    //console.log("hour data found in db returning it ...", response);

    if (symbol !== "TEST1") return { success: true, data: response };
  }

  const mappingJson: Mapping = getMappingJson(electricityData, currentHour, currentPrice, data, currency);

  //console.log("mappingJson", mappingJson);
  const DevPageModel = new DevicePagesModel();
  let pageId = devicePage?.pageId;
  let rev = DateTime.local().setZone("UTC").toUnixInteger();
  //no page found in db for the region
  if (!devicePage) {
    //console.log("No devicePage found for ", symbol, "adding new devicePage ...");

    const newPageId = await DevPageModel.getLastPageId();

    //console.log("newPageId", newPageId);

    if (!newPageId?.success && newPageId?.data === -1)
      return { success: false, data: null, error: "Error in ProcessPagesForElectricityPrices 1 ==>" + newPageId.error };

    pageId = newPageId.data + 1;
    const newDevicePage: IDevicePage = {
      currency: currency,
      market,
      pageId,
      symbol,
      price: Number(currentPrice.price.toFixed(2)),
      symbolType: SYMBOL_TYPE.ELECTRICITY,
      stream: DATA_STREAM.ELECTRICITY,
      currentHour: currentHour.hour,
      createdAt: DateTime.local().setZone("UTC").toJSDate(),
      updatedAt: DateTime.local().setZone("UTC").toJSDate(),
    };

    //await DevPageModel.add(newDevicePage);
    const d = await DevPageModel.add(newDevicePage);

    rev = DateTime.fromISO(d.data?.updatedAt.toISOString()).toUnixInteger() ?? rev;

    if (!success)
      return { success: false, data: null, error: "Error in ProcessPagesForElectricityPrices 2 ==>" + error };
  } else {
    const updatedValues = {
      currentHour: currentHour.hour,
      updatedAt: DateTime.local().setZone("UTC").toJSDate(),
      price: Number(currentPrice.price.toFixed(2)),
    };

    const updateDevicePage: IDevicePage = { ...devicePage, ...updatedValues };

    const d = await DevPageModel.update(updateDevicePage);

    rev = DateTime.fromISO(d.data?.updatedAt.toISOString()).toUnixInteger() ?? rev;
  }

  const svgFile = "elec2.svg";

  try {
    render(mappingJson, svgFile, pageId);
  } catch (error) {
    console.error("Error creating page ", error);
  }

  const response = {
    pageId: pageId,
    ledColor: currentPrice.color,
    ttl: secondsRemainingTill00,
    rev,
    price: Number(currentPrice.price.toFixed(2)),
  };

  return { success: true, data: response };
};

export const GetElectricityPricesQuote: IGetPage = async (params) => {
  if (!isElecApiEnabled) {
    //console.log(`===>>${params?.macAddress ?? "Mac N/A"}: API is not enabled`);
    return { success: false, data: null, error: `${params?.macAddress ?? "Mac N/A"}: API is not enabled` };
  }
  const { success, data } = await getElectricityPricesFromAPI({ ...params });

  if (!success) return { success: false, data, error: "Error in GetElectricityPricesQuote ==>" + data };

  return await ProcessPagesForElectricityPrices(data);
};
