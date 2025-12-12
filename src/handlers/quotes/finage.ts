import { DateTime } from "luxon";
import config from "../../conf";

import { DATA_MARKETS, DATA_MARKETS_TZ, SYMBOL_TYPE } from "../../constants";
import http, { APISOURCES } from "../../services/http";

import {
  currencyList,
  emptyCurrencyObj,
  getFormattedNumber,
  getFormattedNumber2,
  getFromToDatesAsPerAggregateTime,
  ignoredCurrencySymbols,
} from "./helper";
import { IGetQuote, IGetQuoteFromAPI, IGetQuoteFromAPIParams } from "./helper/interfaces";
import currencies from "../jsonFiles/currencylist.json";
import { calculateProfitLossPercentage } from "./percentCalculations";


import redis from "../../services/redis";

//? https://api.finage.co.uk/last/stock/uk/{ symbol }?apikey=YOUR_API_KEY
//? https://api.finage.co.uk/last/stock/{ symbol }?apikey=YOUR_API_KEY
//? https://api.finage.co.uk/agg/stock/global/uk/JET/1day/2021-07-25/2021-08-25?apikey=API_KEY
//api.finage.co.uk/last/stock/uk/jet?apikey=API_KEY

const API_BASE_URL = "https://api.finage.co.uk";
const API_KEY = config.app.finage_apikey;

const buildURL = (apiURL: string) => `${API_BASE_URL}/${apiURL}?apikey=${API_KEY}`;

const buildStockURL = (market: string, symbol: string) => buildURL(`last/stock/${market}/${symbol}`);

const buildAggURL = (market: string, symbol: string, from: string, to: string) =>
  buildURL(`agg/stock/global/${market}/${symbol}/1day/${from}/${to}`);

const buildForexURL = (symbol: string) => buildURL(`last/trade/forex/${symbol.replace("/", "")}`);
const buildForexPreviousCloseURL = (symbol: string) => buildURL(`agg/forex/prev-close/${symbol.replace("/", "")}`);

//** ------------------------------------------------------- */
const buildIndiceURL = (symbol: string) => buildURL(`last/index/${symbol}`);
const buildIndicePreviousCloseURL = (symbol: string) => buildURL(`agg/index/prev-close/${symbol}`);

//** ------------------------------------------------------- */
const buildETFURL = (symbol: string) => buildURL(`last/etf/${symbol}`);
const buildETFPreviousClosingURL = (symbol: string) => buildURL(`agg/etf/prev-close/${symbol}`);

//** ------------------------------------------------------- */

export const GetFinageQuote: IGetQuote = async (params) => {
  const { symbolType } = params;

  return symbolType === SYMBOL_TYPE.FOREX
    ? await getForexDataFromAPI(params)
    : symbolType === SYMBOL_TYPE.ETF || symbolType === SYMBOL_TYPE.INDICES
    ? await getIndiceOrETFFromAPI(params)
    : await getStockQuoteFromAPI(params);
};

// Allowed markets for trading view
const allowedMarketsForTradingView: string[] = [DATA_MARKETS.DK_STOCKS, DATA_MARKETS.SE_STOCKS];
const isTradingViewEnabled = config?.app?.tradingViewEnabled ?? false;
//** ====================== STOCKS ========================================== */

console.log("⚠️⚠️⚠️⚠️ Trading View Enabled: ", isTradingViewEnabled, " ⚠️⚠️⚠️⚠️");

//** Get the quote from Stock API */
const getStockQuoteFromAPI: IGetQuoteFromAPI = async (params) => {
  try {
    const { market, symbol } = params;

    //check if market is allowed for trading view
    if (isTradingViewEnabled && allowedMarketsForTradingView.includes(market)) {
      const _qt = await getDataFromTradingView(params);
      console.log(_qt);
      return _qt;
    }

    const url = buildStockURL(market, symbol);

    let response: any = await http.getAPI(url, APISOURCES.FINAGE, true);

    if (response.error) {
      const { error } = response.error;
      if (error === "Please check the symbol name and try again.")
        return { success: false, error: `No Stock found against symbol ${symbol}`, data: null };
      else
        return { success: false, error: error ? "Error from API: " + error : "Error processing Request", data: null };
    }

    return await processStockQuote(params, response);
  } catch (error) {
    console.error("Finage: Error in getStockQuoteFromAPI: ", error);
    return { success: false, data: null };
  }
};

//** Get last day closing */
const getStockPreviousClosing = async (market: string, symbol: string, aggregateTime = "1d"): Promise<number> => {
  let _previousClosingPrice = undefined;
  if (isTradingViewEnabled && allowedMarketsForTradingView.includes(market)) {
    //get data from redis
    const key = `PCP:finage:${market}:${symbol.replace(/[. -]/g, "_")}`;
    const data = await redis.get(key);
    _previousClosingPrice = data;
  } else {
    //from -7 days & to using Luxon

    const { from, to } = getFromToDatesAsPerAggregateTime(
      aggregateTime,
      DateTime.now().setZone(DATA_MARKETS_TZ[market]).toFormat("yyyy-MM-dd"),
      DATA_MARKETS_TZ[market]
    );

    const url = buildAggURL(market, symbol, from, to);
    //if (market === "cz") console.log({ url, aggregateTime, from, to });

    const response: any = await http.getAPI(url, APISOURCES.FINAGE, true, true);

    const { results, totalResults } = response;
    if (totalResults > 0) {
      const pp = results[totalResults - 1];
      if (pp) _previousClosingPrice = parseFloat(pp?.c?.toString()) || 0;
    }
  }

  return _previousClosingPrice;
};

//** ====================== FOREX ========================================== */

//** Get the quote from Forex API */
export const getForexDataFromAPI: IGetQuoteFromAPI = async (params) => {
  try {
    const { symbol, gainTracking } = params;

    const url = buildForexURL(symbol);

    let response: any = await http.getAPI(url, APISOURCES.FINAGE, true);

    if (response.error) {
      const { error } = response.error;
      if (error.toLowerCase() === "please check the symbol name and try again")
        return { success: false, error: `No currenty pair found against ${symbol}`, data: null };
      else
        return { success: false, error: error ? "Error from API: " + error : "Error processing Request", data: null };
    }

    const { price: pr, timestamp } = response;

    const _currency = currencies.find((c) => c.code === symbol.split("/")[1]);

    const _currSymbol = ["USD", "EUR", "GBP"].includes(_currency?.code) ? _currency?.symbol : "";
    const { perValue, percent } = await calculateProfitLossPercentage(
      symbol,
      pr,
      gainTracking,
      getForexPreviousClosing,
      _currency
    );

    //const date = formatDate(timestamp / 1000, timeZone);
    const price = _currSymbol + getFormattedNumber2(parseFloat(pr.toString()), 4, _currency?.decimal || "."); // round(results.p.toString(), 2);
    const quote = parseFloat(pr.toString());

    response = {
      symbol,
      price,
      p: quote,
      percent,
      perValue,
      date: timestamp / 1000,
      name: symbol || undefined,
    };

    return { success: true, data: response };
  } catch (error) {
    console.error("Finage: Error in getStockQuoteFromAPI: ", error);
    return { success: false, data: null };
  }
};

//** Get last day closing */
const getForexPreviousClosing = async (symbol: string): Promise<number> => {
  //from -7 days & to using Luxon

  const url = buildForexPreviousCloseURL(symbol);

  const response: any = await http.getAPI(url, APISOURCES.FINAGE, true, true);

  const { results, totalResults } = response;

  if (totalResults > 0) {
    const previousPrice = results[totalResults - 1];
    if (previousPrice) return parseFloat(previousPrice.c.toString()) || 0;
  }
};

//** ====================== INICDES & ETFs ========================================== */

//** Get the quote from Index API */
const getIndiceOrETFFromAPI: IGetQuoteFromAPI = async (params) => {
  try {
    const { market, symbol, gainTracking, currency } = params;

    const url = market === "etf" ? buildETFURL(symbol) : market === "indices" ? buildIndiceURL(symbol) : "";

    //let currency: ICurrency;
    let currencySymbol;
    //let symbolObj;

    // if (market === "etf") {
    //   symbolObj = allEtfs.find((etf) => etf.symbol === symbol);
    // } else if (market === "indices") {
    //   symbolObj = allIndices.find((indice) => indice.symbol === symbol);
    // }

    if (!url) return { success: false, error: "Invalid market", data: null };

    let response: any = await http.getAPI(url, APISOURCES.FINAGE, true);

    if (response.error) {
      const { error } = response.error;
      if (error === "Please check the symbol name and try again.")
        return { success: false, error: `No Stock found against symbol ${symbol}`, data: null };
      else
        return { success: false, error: error ? "Error from API: " + error : "Error processing Request", data: null };
    }

    const { price: pr, timestamp } = response;

    //console.log({ rSymbol, pr, timestamp });
    const currencyObj = currencyList.find((c) => c.code === currency) || emptyCurrencyObj;

    currencySymbol = ignoredCurrencySymbols.includes(currencyObj.symbol) ? "" : currencyObj.symbol;

    // const _currency =
    //   currency === "-" ? emptyCurrencyObj : currencyList.find((c) => c.code.toLowerCase() === currency.toLowerCase());

    //const currencySymbol = ignoredCurrencySymbols.includes(_currency.symbol) ? "" : _currency.symbol.toUpperCase();

    //    const date = formatDate(timestamp / 1000, timeZone);

    const quote = parseFloat(pr.toString());

    const priceInFloat = quote; //symbolObj?.currency === "GBp" ? quote / 100 : quote;

    const price = currencySymbol + getFormattedNumber(priceInFloat, currencyObj.decimal);

    const { perValue, percent } = await calculateProfitLossPercentage(
      symbol,
      priceInFloat,
      gainTracking,
      getIndiceOrETFPreviousClosing,
      //market === "etf" ? currencyObj : { ...currencyObj, symbol: "" },
      currencyObj,
      false, //symbolObj?.currency === "GBp",
      market
    );

    // market === "indices"
    //   ? getFormattedNumber(priceInFloat, currencyObj.decimal)
    //   : currencySymbol + getFormattedNumber(priceInFloat, currencyObj.decimal);

    response = {
      symbol,
      price,
      p: quote,
      percent,
      perValue,
      date: timestamp / 1000,
      name: symbol || undefined,
      currency: currencyObj.code,
    };

    console.log({ response });

    return { success: true, data: response };
  } catch (error) {
    console.error("Finage: Error in getIndexQuoteAPI: ", error);
    return { success: false, data: null };
  }
};

const getIndiceOrETFPreviousClosing = async (market: string, symbol: string): Promise<number> => {
  const url =
    market === "etf"
      ? buildETFPreviousClosingURL(symbol)
      : market === "indices"
      ? buildIndicePreviousCloseURL(symbol)
      : "";

  const response: any = await http.getAPI(url, APISOURCES.FINAGE, true, true);

  const { results, totalResults } = response;

  if (totalResults > 0) {
    const previousPrice = results[totalResults - 1];
    if (previousPrice) return parseFloat(previousPrice.c.toString()) || 0;
  }
};

//** ====================== TRADING VIEW API========================================== */
const getDataFromTradingView = async (params) => {
  const { market, symbol } = params;

  // console.log("returning data from Trading View");

  //get data from redis
  const key = `finage:${market}:${symbol.replace(/[. -]/g, "_")}`;
  const data = await redis.get(key);

  if (!data) {
    return { success: false, error: "No data found", data: null };
  }

  const { lp: price, ts } = JSON.parse(data);
  const response = {
    price,
    timestamp: ts,
  };

  return await processStockQuote(params, response);
};

const processStockQuote = async (params: IGetQuoteFromAPIParams, response: any) => {
  const { symbol, gainTracking, currency, divideBy100, market, aggregateTime } = params;
  const { price: pr, timestamp } = response;
  const quote = parseFloat(pr.toString());
  //const date = formatDate(timestamp / 1000, timeZone);
  const _currency = currencyList.find((c) => c.code.toLowerCase() === currency.toLowerCase());

  const _curr = ignoredCurrencySymbols.includes(_currency.symbol) ? "" : _currency.symbol;

  let priceInFloat = quote; //_currency.code === "GBP" ? quote / 100 : quote;
  priceInFloat = market === DATA_MARKETS.UK_STOCKS && (divideBy100 ?? true) ? quote / 100 : priceInFloat;

  const { perValue, percent } = await calculateProfitLossPercentage(
    symbol,
    priceInFloat,
    gainTracking,
    getStockPreviousClosing,
    _currency,
    divideBy100 ?? false,
    market,
    aggregateTime
  );
  //if currency is GBP then divide by 100 as API returns in pence (GBX)
  const price = _curr + getFormattedNumber(priceInFloat, _currency.decimal);

  response = {
    symbol,
    price,
    p: priceInFloat,
    percent,
    perValue,
    date: timestamp / 1000,
    name: symbol || undefined,
    currency: _currency.code,
  };

  return { success: true, data: response };
};
