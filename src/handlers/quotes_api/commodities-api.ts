import { GetCommodityAPIQuoteDB } from "../quotes/commodities-api";
import { IPushQuote } from "./interfaces";
import { IGetQuoteFromMarket } from "./interfaces";

export const GetQuoteFromCommoditiesAPI: IGetQuoteFromMarket = async (market, symbolType, symbol, currency, unit) => {
  const res = await GetCommodityAPIQuoteDB({
    symbolType,
    market,
    symbol,
    gainTracking: {
      enabled: false,
      purchasePrice: null,
      noOfStocks: null,
      showFullAssetValue: false,
      isShortSell: false,
    },
    currency,
    multiplier: { enabled: false, value: 1 },
    unit,
    aggregateTime: "1d",
  });

  return {
    success: res.success,
    data: res.data,
    error: res.error,
  };
};

//** Push Polygon Quote to the devices */
export const PushCommodityAPIQuote: IPushQuote = async (params) => {
  const { success, data: quote } = await GetCommodityAPIQuoteDB(params);

  const { macAddress, pushObject } = params.deviceData;

  if (success) {
    const dataForDevice = {
      ...quote,
      ...pushObject,
      symbol: params.symbolType === 3 ? quote.symbol : quote.symbol, //! Temporary fix for symbol length
      currency: params.symbolType === 3 ? undefined : quote.currency,
      gainTrackingEnabled: undefined,
      purchasePrice: undefined,
      stream: undefined,
      market: undefined,
    };

    //console.log("d", dataForDevice);

    //publishData(macAddress, JSON.stringify(dataForDevice));
    return { success: true, dataForDevice };
  } else {
    return { success: false, dataForDevice: null };
  }
};
