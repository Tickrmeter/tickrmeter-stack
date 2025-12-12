import { DateTime } from "luxon";
import conf from "../../conf";
import axios, { AxiosRequestConfig } from "axios";
import redis from "../../services/redis";

import { DATA_STREAM, SYMBOL_TYPE } from "../../constants";

import { getLowHighTime, secondsTillNextHour } from "../page-mode/helper";
import { IDevicePage } from "../../models/interfaces";
import DevicePagesModel from "../../models/devicePages";

import { Mapping } from "../page-mode/interfaces";
import currencyList from "../jsonFiles/currencylist.json";
import { IGetPage, IPageQuoteFromAPI } from "./helper/interfaces";
import { render } from "../page-mode/renderer";
import { electricityRegions } from "./helper";

const baseURL = "https://api.minstroem.app/thirdParty/prices";
const addressBaseURL = `${baseURL}/addresses`;

//** Calls when User press search symbol on UI and ... */


export const getElectricityPricesFromAPI: IPageQuoteFromAPI = async (params) => {
  try {
    const redisKey = `ELECTRICIY:${params.market}:${params.symbol}`;

    const redisData = await redis.get(redisKey);

    let response = null;

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
      console.log({ params, url });
      response = await axios
        .get(url, config)
        .then(({ data }) => data)
        .catch((e) => {
          console.error("Error calling minst0rm API", url, e.response.data);

          return e.response.data;
        });

      if (response.error) return { success: false, data: null, error: response };

      console.log("setting data in redis", redisKey);
      redis.set(redisKey, JSON.stringify(response), "EX", 60 * 60);
    } else {
      console.log("getting data from redis", redisKey);

      response = JSON.parse(redisData);
    }

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
    console.error("Electricity: Error in getElectricityPricesFromAPI: ", error);
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
  // console.log("mark", mark);
  // console.log(cet);

  // console.table(electricityData);
  // console.log({ currentPrice });
  // console.log({ currentHour: currentHour.toISO({ suppressMilliseconds: true }) });
  // console.log({ lowhigh });
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

//symbol is region + address
//currency is currency
//market is country
//symbolType is electricity
export const ProcessPagesForElectricityPrices = async (params) => {
  const { electricityData, currentPrice, currentHour, data } = params;

  const { currency, symbol, market } = data;
  //** Get the page data from region (and address) */
  const dbQuery = {
    symbol,
    currency,
    market,
    symbolType: SYMBOL_TYPE.ELECTRICITY,
  };

  
  const { success, error, data: devicePage } = await DevicePagesModel.getOne(dbQuery);

  if (!success) return { success: false, data: null, error: "Error in ProcessPagesForElectricityPrices 0 ==>" + error };

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

    console.log("hour data found in db returning it ...", response);

    if (symbol !== "TEST1") return { success: true, data: response };
  }

  const mappingJson: Mapping = getMappingJson(electricityData, currentHour, currentPrice, data, currency);

  console.log("mappingJson", mappingJson);

  let pageId = devicePage?.pageId;
  let rev = DateTime.local().setZone("UTC").toUnixInteger();
  //no page found in db for the region
  if (!devicePage) {
    console.log("No devicePage found for ", symbol, "adding new devicePage ...");

    const newPageId = await DevicePagesModel.getLastPageId();

    console.log("newPageId", newPageId);

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
    //    console.log("newDevicePage", newDevicePage);

    //await DevicePagesModel.add(newDevicePage);
    const d = await DevicePagesModel.add(newDevicePage);

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

    const d = await DevicePagesModel.update(updateDevicePage);

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
  const { success, data } = await getElectricityPricesFromAPI({ ...params });

  if (!success) return { success: false, data: null, error: "Error in GetElectricityPricesQuote ==>" + data };

  return await ProcessPagesForElectricityPrices(data);
};
