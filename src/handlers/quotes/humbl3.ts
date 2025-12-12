import { DateTime } from "luxon";

import axios from "axios";
import redis from "../../services/redis";

import {
  DATA_MARKETS,
  DATA_STREAM,
  featureMapping,
  featureMappingText,
  humbl3BaseUrl,
  singleLineFeatureMapping,
  SYMBOL_TYPE,
} from "../../constants";

import { IDevicePage } from "../../models/interfaces";
import DevicePagesModel from "../../models/devicePages";

import { humbl3MappingJsonData, Mapping } from "../page-mode/interfaces";

import { IGetPage, IPageQuoteFromAPI } from "./helper/interfaces";
import { render } from "../page-mode/renderer";

const dbOperation = async (dbQuery: any, type: DBOpType) => {
  switch (type) {
    case DBOpType.GET_ONE:
      return await DevicePagesModel.getOne(dbQuery);
    case DBOpType.GET_LAST_PAGEID:
      return await DevicePagesModel.getLastPageId();
    case DBOpType.ADD:
      return await DevicePagesModel.add(dbQuery);
    case DBOpType.UPDATE:
      return await DevicePagesModel.update(dbQuery);
    default:
      throw new Error("Invalid db operation");
  }
};

enum DBOpType {
  GET_ONE,
  GET_LAST_PAGEID,
  ADD,
  UPDATE,
}

export const GetHumbl3DataFromAPI: IPageQuoteFromAPI = async (params) => {
  try {
    // console.log("GetHumbl3DataFromAPI", params);

    const { extras } = params;
    if (!extras.feature || !extras.humbl3Id)
      return { success: false, data: null, error: "Invalid Data, feature and Id" };

    const { humbl3Id, feature, musicCreatorURL } = extras;
    const userTimeZone = params?.timeZone ?? "UTC";
    const userTimeOffset = DateTime.now().setZone(userTimeZone).offset;

    const redisKey = `HUMBL3:${params.market}:${feature}:${humbl3Id}:${userTimeOffset}`;

    let response = null;

    const redisData = await redis.get(redisKey);

    if (!redisData) {
      const url = new URL(`${humbl3BaseUrl}/v1/audience`);

      if (musicCreatorURL) {
        const [pathName, searchParams] = musicCreatorURL.split("?");
        url.pathname += pathName;
        url.search = searchParams;
      } else {
        const dataMarket = params.market;
        let pathName = `/${dataMarket}/`;

        pathName += feature.includes("artist") ? "artists" : "tracks";
        pathName += `/${humbl3Id}/${featureMapping[feature]}`;
        url.pathname += pathName;
        url.searchParams.append("dateTimeOffset", userTimeZone);
      }

      response = await axios
        .get(url.toString())
        .then(({ data }) => data)
        .catch((e) => {
          console.error("Error calling humbl3 API", url, e.response.data);

          return e.response.data;
        });

      //console.log("setting data in redis", response);

      if (!response.value || isNaN(response.value)) {
        console.error("Invalid data from Humbl3 API", response);
        return { success: false, data: null, error: "Invalid data from Humbl3 API" };
      }

      redis.set(redisKey, JSON.stringify(response), "EX", 30);
    } else {
      console.log("getting data from redis", redisKey);
      response = JSON.parse(redisData);
    }

    //console.log("response", response);

    const name = feature.includes("track") ? `${response.title} by ${response.subTitle}` : response.title;

    const data = {
      market: params.market,
      value: response.value,
      symbol: name,
      time: DateTime.now()
        .setZone((params as any).timeZone ?? "UTC")
        .toFormat("HH:mm"),
      humbl3Id,
      feature,
      diff: response?.difference,
      ledColor: response?.colour?.name ?? "green",
      displayLabel: response?.displayLabel ?? featureMappingText[feature],
      displaySource: response?.displaySource ?? params.market,
      displayTimeFrame: response?.displayTimeFrame ?? "",
      title: response.title,
      subTitle: response.subTitle,
      userTimeOffset,
    };

    return { success: true, data };
  } catch (error) {
    console.error("Electricity: Error in getHumbl3 DataFromAPI: ", error);
    return { success: false, data: null };
  }
};

const getMappingJson = (data: humbl3MappingJsonData) => {
  const isUp = data.diff >= 0;

  //const _diff = Math.abs(data.diff)?.toFixed(2) + "%";
  const _diff = typeof data.diff === "number" ? Math.abs(data.diff).toFixed(2) + "%" : "";

  //for value, use U+2009 for 1000 seperator
  const _value = data.value?.toLocaleString(); //?.toString()?.replace(/\B(?=(\d{3})+(?!\d))/g, "\u2009") ?? "";

  const mappingJson: Mapping = {
    Type: data?.displayLabel ?? "",
    Source: data?.displaySource ?? "",
    Time: data?.displayTimeFrame ?? "",
    Title: data?.title ?? "",
    SubTitle: data?.subTitle ?? "",
    Value: _value,
    Diff: _diff,
    isUp,
  };

  // if (data.feature.includes("Artist Streams")) {
  //   mappingJson.SubTitle = data?.title ?? "";
  //   mappingJson.Title = data?.subTitle ?? "";
  // }

  if (singleLineFeatureMapping.includes(data.feature)) {
    mappingJson.SubTitle = data?.title ?? "";
    mappingJson.Title = data?.subTitle ?? "";
  }

  console.log("mappingJson", data, mappingJson);

  return mappingJson;
};

export const ProcessPagesForHumbl3Data = async (data) => {
  //console.log("ProcessPagesForHumbl3Data", data);

  // ProcessPagesForHumbl3Data {
  //   market: 'youtube',
  //   value: 2824068,
  //   symbol: 'Snoop Dogg',
  //   date: '18/02/2025 22:11:34',
  //   bottom: 'Artists Streams',
  //   humbl3Id: '11e81bc2-1456-6ac2-9942-a0369fe50396',
  //   feature: 'artist_streams'
  // }

  const { symbol, market, feature, humbl3Id, value, ledColor, userTimeOffset } = data;
  //** Get the page data from region (and address) */

  const dbQuery = {
    symbol: data.humbl3Id,
    currency: feature,
    market,
    symbolType: SYMBOL_TYPE.MUSIC_CREATORS,
    currentHour: userTimeOffset ?? 0,
  };

  const { success, error, data: pageData } = await dbOperation(dbQuery, DBOpType.GET_ONE);
  const devicePage = pageData as IDevicePage;

  if (!success) return { success: false, data: null, error: "Error in ProcessPagesForHumbl3 Data 0 ==>" + error };

  let pageId = devicePage?.pageId;
  let rev = DateTime.local().setZone("UTC").toUnixInteger();

  if (!devicePage) {
    console.log("No devicePage found for ", symbol, humbl3Id, ".. adding new devicePage ...");

    const newPageId = await dbOperation({}, DBOpType.GET_LAST_PAGEID);

    console.log("newPageId", newPageId);

    if (!newPageId?.success && newPageId?.data === -1)
      return { success: false, data: null, error: "Error in ProcessPagesFor 1 ==>" + newPageId.error };

    pageId = (newPageId.data as number) + 1;
    const newDevicePage: IDevicePage = {
      currency: feature,
      market,
      pageId,
      symbol: humbl3Id,
      price: Number(value),
      symbolType: SYMBOL_TYPE.MUSIC_CREATORS,
      stream: DATA_STREAM.HUMBL3,
      currentHour: userTimeOffset ?? 0,
      name: symbol,
      createdAt: DateTime.local().setZone("UTC").toJSDate(),
      updatedAt: DateTime.local().setZone("UTC").toJSDate(),
    };

    console.log("newDevicePage", newDevicePage);

    const newPageData = await dbOperation(newDevicePage, DBOpType.ADD);

    const newPageDetails = newPageData.data as IDevicePage;

    rev = DateTime.fromISO(newPageDetails?.updatedAt.toISOString()).toUnixInteger() ?? rev;

    if (!success) return { success: false, data: null, error: "Error in ProcessPagesForHumbl3 Data 2 ==>" + error };
  } else {
    const updatedValues = {
      updatedAt: DateTime.local().setZone("UTC").toJSDate(),
      price: Number(value),
    };

    const updateDevicePage: IDevicePage = { ...devicePage, ...updatedValues };

    const updatedDataPage = await dbOperation(updateDevicePage, DBOpType.UPDATE);
    const updatedData = updatedDataPage.data as IDevicePage;

    rev = DateTime.fromISO(updatedData?.updatedAt.toISOString()).toUnixInteger() ?? rev;
  }
  const svgFile = market === DATA_MARKETS.HUMBL3_YOUTUBE ? "youtube.svg" : "spotify.svg";

  //const svgFile = "music-creators.svg";
  console.log("data, before getMappingJson", data);
  const mappingJson: Mapping = getMappingJson(data);

  ///console.log("mappingJson", mappingJson);
  try {
    render(mappingJson, svgFile, pageId, "humbl3");
  } catch (error) {
    console.error("Error creating page ", error);
  }

  const response = {
    pageId: pageId,
    ledColor,
    ttl: 30,
    rev,
    price: Number(data.value),
  };

  return { success: true, data: response };
};

export const GetHumbl3Data: IGetPage = async (params) => {
  const { success, data, error } = await GetHumbl3DataFromAPI({ ...params });

  if (!success) return { success: false, data: null, error: "Error in GetHumbl3Data ==>" + error };

  return await ProcessPagesForHumbl3Data(data);
};
