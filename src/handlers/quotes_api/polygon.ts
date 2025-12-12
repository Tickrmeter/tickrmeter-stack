import config from "../../conf";
import { GetPolygonQuote } from "../quotes/polygon";
import { IPushQuote } from "./interfaces";
import { IGetQuoteFromMarket, IGetStockData } from "./interfaces";
import http from "../../services/http";
import { DATA_MARKETS, SYMBOL_TYPE } from "../../constants";

import { PushTradingViewQuote } from "./trading-view";

const API_BASE_URL = "https://api.polygon.io";
const API_KEY = config.app.polygon_apikey;

const cryptoAPIURL = (cryptoCurr: string, fiatCurr: string) =>
  `${API_BASE_URL}/v1/last/crypto/${cryptoCurr}/${fiatCurr}?&apiKey=${API_KEY}`;

const buildURL = (apiURL: string) => `${API_BASE_URL}/${apiURL}&apiKey=${API_KEY}`;

export const PushPolygonQuote: IPushQuote = async (params) => {
  //~~ Pushing US Indices from TradingView

  const { success, data: quote } = await GetPolygonQuote(params);

  const { macAddress, pushObject } = params.deviceData;

  if (success) {
    const dataForDevice = {
      ...quote,
      ...pushObject,
      symbol: quote.symbol,
      gainTrackingEnabled: undefined,
      purchasePrice: undefined,
    };
    //publishData(macAddress, JSON.stringify(dataForDevice));
    return { success: true, dataForDevice };
  } else {
    return { success: false, dataForDevice: null };
  }
};

//** Calls when User press search symbol on UI and ... */
export const GetQuoteFromPolygon: IGetQuoteFromMarket = async (market, type, symbol, currency) => {
  switch (type) {
    case SYMBOL_TYPE.STOCK:
      return await getStockData({ symbol, currency });
    case SYMBOL_TYPE.INDICES:
      return await getIndicesData({ symbol, currency });
    case SYMBOL_TYPE.CRYPTO:
      return await getCryptoData({ symbol, currency });
    case SYMBOL_TYPE.FOREX:
      return await getForexData({ symbol, currency });
    case SYMBOL_TYPE.OPTIONS:
      return await getOptionsData({ symbol, currency });
    default:
      return { success: false, error: "Invalid type", data: null };
  }
};

const getStockData: IGetStockData = async ({ symbol, currency }) => {
  try {
    const API_BASE_URL = "https://api.polygon.io";
    const API_KEY = config.app.polygon_apikey;
    const searchAPIURL = (search: string) =>
      `${API_BASE_URL}/v3/reference/tickers?ticker=${search.toUpperCase()}&active=true&sort=ticker&order=asc&limit=10&apiKey=${API_KEY}`;

    const url = searchAPIURL(symbol);

    const queryAPIResponse: any = await http.get(url);

    const { count, results, error } = queryAPIResponse;

    if (error) return { success: false, error, data: null };

    if (count === 0 || !results || results.length === 0)
      return { success: false, error: `No Stock found against symbol ${symbol}`, data: null };

    const stocks = results[0];

    let stockQuote = await GetPolygonQuote({
      market: DATA_MARKETS.US_STOCKS,
      symbolType: SYMBOL_TYPE.STOCK,
      symbol: stocks.ticker,
      name: stocks.name,
      currency,
      gainTracking: {
        enabled: false,
        purchasePrice: null,
        noOfStocks: null,
        showFullAssetValue: false,
        isShortSell: false,
      },
      multiplier: { enabled: false, value: 1 },
      aggregateTime: "1d",
      unit: "",
    });

    console.log("getStockData", { stockQuote });

    if (stockQuote.success) return { success: true, data: stockQuote.data, error: null };
    else return { success: false, error: "Error from API \n\n" + stockQuote.error, data: null };
  } catch (error) {
    throw error;
  }
};

// //** Call GetCryptoQuoteFromAPI and handle the responses */
const getCryptoData: IGetStockData = async ({ symbol, currency }) => {
  try {
    const cryptoQuote = await GetPolygonQuote({
      market: DATA_MARKETS.CRYPTO,
      symbolType: SYMBOL_TYPE.CRYPTO,
      symbol,
      currency,
      gainTracking: {
        enabled: false,
        purchasePrice: null,
        noOfStocks: null,
        showFullAssetValue: false,
        isShortSell: false,
      },
      multiplier: { enabled: false, value: 1 },
      aggregateTime: "1d",
      unit: "",
    });

    if (cryptoQuote.success) {
      return { success: true, data: cryptoQuote.data, error: null };
    } else if (cryptoQuote.error === "notfound") {
      return { success: false, error: `No crypto pair found for ${symbol}-${currency}`, data: null };
    } else {
      return { success: false, error: "Error from API \n\n" + cryptoQuote.error, data: null };
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// //** Call GetCryptoQuoteFromAPI and handle the responses */
const getIndicesData: IGetStockData = async ({ symbol, currency }) => {
  try {
    //~~ We are getting data from TradingView for US Indices, check handlers/quotes/polygon/index.ts
    const indicesData = await GetPolygonQuote({
      market: DATA_MARKETS.INDICES,
      symbolType: SYMBOL_TYPE.INDICES,
      symbol,
      currency,
      gainTracking: {
        enabled: false,
        purchasePrice: null,
        noOfStocks: null,
        showFullAssetValue: false,
        isShortSell: false,
      },
      multiplier: { enabled: false, value: 1 },
      aggregateTime: "1d",
      unit: "",
    });

    if (indicesData.success) {
      return { success: true, data: indicesData.data, error: null };
    } else if (indicesData.error === "notfound") {
      return { success: false, error: `No crypto pair found for ${symbol}-${currency}`, data: null };
    } else {
      return { success: false, error: "Error from API \n\n" + indicesData.error, data: null };
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const getForexData: IGetStockData = async ({ symbol, currency }) => {
  try {
    const forexQuote = await GetPolygonQuote({
      market: DATA_MARKETS.FOREX,
      symbolType: SYMBOL_TYPE.FOREX,
      symbol,
      currency,
      gainTracking: {
        enabled: false,
        purchasePrice: null,
        noOfStocks: null,
        showFullAssetValue: false,
        isShortSell: false,
      },
      multiplier: { enabled: false, value: 1 },
      aggregateTime: "1d",
      unit: "",
    });

    if (forexQuote.success) {
      return { success: true, data: forexQuote.data, error: null };
    } else if (forexQuote.error === "notfound") {
      return { success: false, error: `No forex pair found for ${symbol}-${currency}`, data: null };
    } else {
      return { success: false, error: "Error from API \n\n" + forexQuote.error, data: null };
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const getOptionsData: IGetStockData = async ({ symbol, currency }) => {
  try {
    const optionsQuote = await GetPolygonQuote({
      market: DATA_MARKETS.US_OPTIONS,
      symbolType: SYMBOL_TYPE.OPTIONS,
      symbol,
      currency,
      gainTracking: {
        enabled: false,
        purchasePrice: null,
        noOfStocks: null,
        showFullAssetValue: false,
        isShortSell: false,
      },
      multiplier: { enabled: false, value: 1 },
      aggregateTime: "1d",
      unit: "",
    });

    if (optionsQuote.success) {
      return { success: true, data: optionsQuote.data, error: null };
    } else if (optionsQuote.error === "notfound") {
      return { success: false, error: `No options pair found for ${symbol}-${currency}`, data: null };
    } else {
      return { success: false, error: "Error from API \n\n" + optionsQuote.error, data: null };
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
};
