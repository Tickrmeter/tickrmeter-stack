import { FetchDataFromCustomAPI, GetProcessedDataFromCustomAPI } from "../quotes/custom-api";
import { IPushQuote } from "./interfaces";

export const GetDataFromCustomAPI = async (url) => {
  try {
    return FetchDataFromCustomAPI(url);
  } catch (error) {
    console.error("--- GetDataFromCustomAPI Error ---", error);
    return { success: false, error: error };
  }
};

export const PushDataFromCustomAPI: IPushQuote = async (params) => {
  const { success, data: quote, error } = await GetProcessedDataFromCustomAPI(params);

  const { pushObject } = params.deviceData;

  if (success) {
    const dataForDevice = {
      ...quote,
      ...pushObject,
      symbol: quote?.symbolUI || quote.symbol, //! Temporary fix for symbol length
      alertEnabled: false,
      gainTrackingEnabled: undefined,
      purchasePrice: undefined,
      stream: undefined,
      market: undefined,
    };

    // console.log({ dataForDevice });
    //publishData(macAddress, JSON.stringify(dataForDevice));
    return { success: true, dataForDevice };
  } else {
    console.error("--- PushDataFromCustomAPI Error ---", error);
    return { success: false, dataForDevice: null };
  }
};
