import {
  GetElectricityPricesQuote,
  ProcessPagesForElectricityPrices,
  getElectricityPricesFromAPI,
} from "../quotes/electricity";
import { IGetPageDataFromMarket, IPushQuote } from "./interfaces";
import DeviceModel from "../../models/device";
import { IDevice } from "../../models/interfaces";

export const GetQuoteFromElectricityPrices: IGetPageDataFromMarket = async (market, symbol, currency) => {
  const { success, data, error } = await getElectricityPricesFromAPI({ market, symbol, currency });

  if (!success) {
    if ((error as any)?.reason === "Not Found")
      return {
        success: false,
        data: null,
        error: "There is an error getting your address prices, please try again.",
        type: 1,
      };

    return { success: false, data: null };
  }

  if (data?.data) {
    return {
      success,
      data: data?.data,
    };
  }
  return { success: false, data: null };
};

export const PushElectricityPricesQuote: IPushQuote = async (params) => {
  const { success, data: quote } = await GetElectricityPricesQuote(params);

  if (!success) return { success: false, dataForDevice: null };

  //const { data: quote } = await ProcessPagesForElectricityPrices(data);

  console.log("quote", quote);

  const { macAddress, pushObject } = params.deviceData;

  let ledColor = quote.ledColor;
  let blink = false;
  let raiseAlert = false;
  if (pushObject.alertEnabled) {
    const alertData = CheckElectricityAlert(pushObject.alertConfig, quote.price);

    ledColor = alertData?.ledColor;
    blink = alertData?.blink;
    raiseAlert = alertData ? true : false;
  }

  if (success) {
    const dataForDevice = {
      ...pushObject,
      mode: "page",
      page: [{ id: quote.pageId, ledColor, blink, rev: quote.rev, alert: raiseAlert }],
      updateInterval: pushObject.interval,
      ttl: quote.ttl,
      alertEnabled: undefined,
      alertConfig: undefined,
      gainTrackingEnabled: undefined,
      purchasePrice: undefined,
      stream: undefined,
      market: undefined,
      symbolType: undefined,
      isPlaylist: undefined,
      interval: undefined,
      deviceId: undefined,
    };

    console.log("d", JSON.parse(JSON.stringify(dataForDevice)));

    const pageConfig: IDevice["pageConfig"] = [
      {
        pageId: quote.pageId,
        ledColor: quote.color,
      },
    ];

    //update pageConfig in the device
    const { success: s4 } = await DeviceModel.updatePageInfo(macAddress, pageConfig);

    if (s4) {
      //publishData(macAddress, JSON.stringify(dataForDevice));
      return { success: true, dataForDevice };
    }
    return { success: false, dataForDevice: null };
  } else {
    return { success: false, dataForDevice: null };
  }
};

const CheckElectricityAlert = (alertConfig, price) => {
  const { triggerType, triggerValue } = alertConfig;

  const raiseAlert =
    triggerType.toLowerCase() === "less than" && parseFloat(price) < triggerValue
      ? true
      : triggerType.toLowerCase() === "greater than" && parseFloat(price) > triggerValue
      ? true
      : false;

  if (!raiseAlert) return null;

  return { ledColor: alertConfig.lightBarColor, blink: alertConfig.flashLightbar };
};
