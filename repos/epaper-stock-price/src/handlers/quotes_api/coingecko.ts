import { IPushQuote } from "./interfaces";
import { IGetQuoteFromMarket } from "./interfaces";
import { GetCoinGeckoQuote } from "../quotes/coingecko";

//** Push CoinGecko Quote to the devices */
export const PushCoinGeckoQuote: IPushQuote = async (params) => {
  const { success, data: quote } = await GetCoinGeckoQuote(params);

  const { macAddress, pushObject } = params.deviceData;

  if (success) {
    const dataForDevice = {
      ...quote,
      ...pushObject,
      symbol: quote?.symbolUI || quote.symbol, //! Temporary fix for symbol length
      symbolUI: undefined,
      gainTrackingEnabled: undefined,
      purchasePrice: undefined,
    };

    // console.log({ dataForDevice });
    //publishData(macAddress, JSON.stringify(dataForDevice));
    return { success: true, dataForDevice };
  } else {
    return { success: false, dataForDevice: null };
  }
};

export const GetQuoteFromCoinGecko: IGetQuoteFromMarket = async (market, symbolType, symbol, currency) => {
  const quote = await GetCoinGeckoQuote({
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
    aggregateTime: "1d",
    unit: "",
  });

  console.log({ quote });

  return {
    success: quote.success,
    data: quote.data,
    error: quote.error,
  };
};
