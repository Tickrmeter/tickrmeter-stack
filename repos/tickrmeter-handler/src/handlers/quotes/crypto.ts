import config from "../../conf";
import redis from "../../services/redis";
import { APISOURCES, HTTPClient } from "../../services/httpClass";

import { DATA_STREAM, SYMBOL_TYPE } from "../../constants";

import { getForexQuote } from "./polygon/forex";
import { coinsById, currencyList, emptyCurrencyObj, getFormattedNumber, ignoredCurrencySymbols } from "./helper";
import { IGetQuote, IGetQuoteFromAPIParams, ITickrResponse } from "./helper/interfaces";
import { calculateProfitLossPercentage, formatAggregateData } from "./percentCalculations";
import { DateTime } from "luxon";

const API_BASE_URL = "https://pro-api.coingecko.com/api/v3";
const API_KEY = `x_cg_pro_api_key=${config.app.coingecko_apikey}`;
const COINS_MARKET_URL = `${API_BASE_URL}/coins/markets?${API_KEY}`;

export const GetCryptoQuote: IGetQuote = async (params) => {
  //1st we try to get the quote from tradingview api
  const { stream } = params;

  let quote = null;

  if (stream === DATA_STREAM.TRADINGVIEW) {
    //console.log("GetCryptoQuote", "Getting quote from trading view", stream, params.symbol);
    quote = await GetQuoteFromTV(params);
  } else {
    //console.log("IN ELSE", { ...params });

    let symbolAgainstId = coinsById[params.symbol.toLowerCase()]?.symbol?.toUpperCase();

    //console.log(symbolAgainstId, params.symbol);

    if (!symbolAgainstId) {
      return { success: false, error: "Symbol not found", data: null };
    }

    params.tickSymbol = params.symbol;
    params.symbol = symbolAgainstId;

    if (params.manualSearch) {
      //console.log("Manual search requested for crypto:", params.symbol);
      quote = await GetQuoteFromCoinGecko(params);
    } else {
      //console.log("GetCryptoQuote", "Getting quote from trading view", stream, params.symbol);
      quote = await GetQuoteFromTV({ ...params });
    }
  }

  if (!quote.success) {
    //console.log("GetCryptoQuote", "Failed to get quote from trading view, trying coingecko", stream, params.symbol);
    quote = await GetQuoteFromCoinGecko(params);
    //console.log({ quote });
  }

  if (!quote.success) {
    return { success: false, error: "No data found", data: null };
  }

  return await processCryptoQuote(params, quote.data);
};

export const GetQuoteFromTV = async (params) => {
  const { market, symbol } = params;

  const _symbol = formatSymbol(symbol);

  let key = `TV:${market.toUpperCase()}:${_symbol}`;
  //console.log({ key });

  const data = await redis.get(key);

  if (!data) {
    return { success: false, error: `No data found for key ${key}`, data: null };
  }

  const { lp: price, chp, ts, name, type } = JSON.parse(data);

  const response = {
    price,
    changePer: chp ?? -1,
    timestamp: ts,
    name,
    type,
  };

  return { success: true, data: response, error: null };

  //return await processTradingViewQuote(params, response);
};

export const GetQuoteFromCoinGecko = async (params) => {
  const http = new HTTPClient();
  let url = "";
  try {
    const { symbol, tickSymbol } = params;

    url = `${COINS_MARKET_URL}&vs_currency=USD&ids=${(tickSymbol ?? symbol).toLowerCase()}`;

    //console.log("GetQuoteFromCoinGecko", url);
    let response: any = await http.getAPI(url, APISOURCES.COINGECKO, true);

    if (response?.error) {
      const { error } = response.error;
      if (error === "Please check the symbol name and try again.")
        return { success: false, error: `No Stock found against symbol ${tickSymbol ?? symbol}`, data: null };
      else
        return { success: false, error: error ? "Error from API: " + error : "Error processing Request", data: null };
    }

    if (response.length === 0)
      return { success: false, error: `No Coin data found against symbol ${tickSymbol ?? symbol}`, data: null };

    const stockData = response[0];

    //console.log({ stockData });

    const data = {
      price: stockData.current_price,
      timestamp: (() => {
        const dt = DateTime.fromISO(stockData.last_updated);
        return dt.isValid ? dt.toMillis() : DateTime.now().toMillis(); // current time (ms)
      })(),
      prev_close_price: stockData.price_change_24h,
      changePer: stockData.price_change_percentage_24h,
    };

    //console.log({ data });

    return { success: true, data, error: null };
  } catch (error) {
    console.error("GetQuoteFromCoinGecko", params, url, error);
    return { success: false, data: null, error: "Error getting quote from CoinGecko" };
  } finally {
    http.dispose();
  }
};

//** Get last day closing */
const getPreviousClosing = async (market: string, symbol: string, aggregateTime = "1d"): Promise<number> => {
  let _previousClosingPrice = undefined;
  const key = `PCP:TV:${market.toUpperCase()}:${symbol.replace(/[. -]/g, "_").replace("/", "")}`;
  const data = await redis.get(key);
  _previousClosingPrice = data;

  return _previousClosingPrice;
};

const formatSymbol = (symbol: string) => `${symbol.split("/")[0]?.toUpperCase()}USD`;

interface ICryptoResponse {
  price: number;
  prev_close_price?: number;
  changePer?: number;
  timestamp: number;
  name?: string;
  type?: string;
}

export const processCryptoQuote = async (params: IGetQuoteFromAPIParams, quoteData: ICryptoResponse) => {
  try {
    const { symbol, gainTracking, currency, divideBy100, market, aggregateTime, symbolType, multiplier } = params;

    const { price: pr, timestamp, name: symbolUI, type } = quoteData;

    const { price, priceInFloat, _currency } = await GetFormatedPrice({
      pr,
      symbolType,
      currency,
      divideBy100,
      multiplier,
    });

    const _s = type === "webpage" ? symbolUI : symbolType === SYMBOL_TYPE.CRYPTO ? symbol.split("/")[0] : symbol;

    const { perValue, formattedPercentage, formattedPriceDiff, priceDiff } =
      gainTracking?.enabled || quoteData.changePer === -1
        ? await calculateProfitLossPercentage(
            formatSymbol(symbol),
            quoteData.price,
            gainTracking,
            getPreviousClosing,
            _currency,
            divideBy100 ?? false,
            market,
            aggregateTime
          )
        : formatAggregateData("1d", quoteData.changePer, quoteData.prev_close_price - quoteData.price, _currency);
    //GetFormattedPercentage("1d", quoteData.changePer);
    
    const tickrResponse: ITickrResponse = {
      symbol: _s,
      price,
      p: priceInFloat,
      percent: formattedPercentage,
      perValue,
      pd: priceDiff,
      priceDiff: formattedPriceDiff,
      date: timestamp,
      name: symbolUI || symbol || undefined,
      currency: _currency.code,
    };

    //    console.log("processCryptoQuote ", tickrResponse);
    return { success: true, data: tickrResponse, error: null };
  } catch (error) {
    console.error("processTradingViewQuote", error);
    return { success: false, data: null, error: "Error processing quote" };
  }
};

// export const GetFormattedPercentage = (aggregateTime, percent) => ({
//   perValue: percent,
//   percent: formattedPercentage(aggregateTime, percent),
// });

interface IGetFormatedPrice {
  pr: number;
  symbolType: SYMBOL_TYPE;
  currency: string;
  divideBy100: boolean;
  multiplier: { enabled: boolean; value: number };
}

export const GetFormatedPrice = async (params: IGetFormatedPrice) => {
  const { pr, symbolType, currency, divideBy100, multiplier } = params;

  let quote = Number(pr.toString());

  if (symbolType === SYMBOL_TYPE.CRYPTO && currency !== "USD") {
    const forexResponse = await getForexQuote(`USD/${currency}`);

    if (!forexResponse.success) return { price: "", priceInFloat: 0, _currency: emptyCurrencyObj };

    const { last } = forexResponse.data;
    const forexQuote = (last.bid + last.ask) / 2;
    quote = quote * forexQuote;
  }

  const _currency =
    currencyList.find(
      (c) => c.code.toLowerCase() === (currency === "GBp" && !divideBy100 ? "GBX" : currency).toLowerCase()
    ) || emptyCurrencyObj;
  const _curr = ignoredCurrencySymbols.includes(_currency?.symbol) ? "" : _currency.symbol;

  let priceInFloat = multiplier?.enabled ? quote * multiplier.value || 1 : quote;
  priceInFloat = Number(divideBy100 ? priceInFloat / 100 : priceInFloat);

  const price = _curr + getFormattedNumber(priceInFloat, _currency.decimal);

  return { price, priceInFloat, _currency };
};
