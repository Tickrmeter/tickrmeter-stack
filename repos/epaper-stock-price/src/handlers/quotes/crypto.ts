import config from "../../conf";
import { APISOURCES, HTTPClient } from "../../services/httpClass";
import redis from "../../services/redis";
import { getForexQuote } from "./polygon/forex";
import { DATA_STREAM, SYMBOL_TYPE } from "../../constants";
import {
  coinsById,
  coinsBySymbol,
  currencyList,
  emptyCurrencyObj,
  getFormattedNumber,
  ignoredCurrencySymbols,
} from "./helper";
import { IGetQuote, IGetQuoteFromAPIParams } from "./helper/interfaces";
import { calculateProfitLossPercentage, formattedPercentage } from "./percentCalculations";
import { DateTime } from "luxon";

const API_BASE_URL = "https://pro-api.coingecko.com/api/v3";
const API_KEY = `x_cg_pro_api_key=${config.app.coingecko_apikey}`;
const COINS_MARKET_URL = `${API_BASE_URL}/coins/markets?${API_KEY}`;

export const GetCryptoQuote: IGetQuote = async (params) => {
  //1st we try to get the quote from tradingview api
  const { stream } = params;

  let quote = null;

  if (stream === DATA_STREAM.TRADINGVIEW) {
    console.log("GetCryptoQuote", "Getting quote from trading view", stream, params.symbol);
    quote = await GetQuoteFromTV(params);
  } else {
    console.log("IN ELSE", { ...params });

    let symbolAgainstId = coinsById[params.symbol.toLowerCase()]?.symbol?.toUpperCase();

    console.log(symbolAgainstId, params.symbol);

    if (!symbolAgainstId) {
      return { success: false, error: "Symbol not found", data: null };
    }

    params.tickSymbol = params.symbol;
    params.symbol = symbolAgainstId;

    if (params.manualSearch) {
      console.log("Manual search requested for crypto:", params.symbol);
      quote = await GetQuoteFromCoinGecko(params);
    } else {
      console.log("GetCryptoQuote", "Getting quote from trading view", stream, params.symbol);
      quote = await GetQuoteFromTV({ ...params });
    }
  }

  if (!quote.success) {
    console.log("GetCryptoQuote", "Failed to get quote from trading view, trying coingecko", stream, params.symbol);
    quote = await GetQuoteFromCoinGecko(params);
    console.log({ quote });
  }

  if (!quote.success) {
    return { success: false, error: "No data found", data: null };
  }

  return await processCryptoQuote(params, quote.data);
};

export const GetQuoteFromTV = async (params) => {
  const { market, symbol } = params;

  const _symbol = formatSymbol(symbol);

  console.log({ market, symbol, _symbol });
  let key = `TV:${market.toUpperCase()}:${_symbol}`;

  console.log("Getting crypto quote from TV", key);

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
  try {
    const { symbol, tickSymbol } = params;

    console.log({ symbol, tickSymbol });

    const url = `${COINS_MARKET_URL}&vs_currency=USD&ids=${(tickSymbol ?? symbol).toLowerCase()}`;
    console.log("GetQuoteFromCoinGecko", { symbol, tickSymbol, url });

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

    const cgData = response[0];

    console.log("CGData", cgData);

    const data = {
      price: cgData.current_price,
      timestamp: DateTime.fromISO(cgData.last_updated).toUnixInteger() ?? Date.now(),
      changePer: cgData.price_change_percentage_24h,
      symbol: tickSymbol ?? symbol,
      symbolUI: symbol,
    };

    console.log("CG===========>", data);

    return { success: true, data, error: null };
  } catch (error) {
    console.error("GetQuoteFromCoinGecko", error);
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

const formatSymbol = (symbol: string) => `${symbol?.split("/")[0]?.toUpperCase()}USD` || symbol?.toUpperCase();

interface ICryptoResponse {
  price: number;
  prev_close_price?: number;
  changePer?: number;
  timestamp: number;
  symbol?: string;
  name?: string;
  type?: string;
}

export const processCryptoQuote = async (params: IGetQuoteFromAPIParams, quoteData: ICryptoResponse) => {
  try {
    //console.log("processCryptoQuote", { params, quoteData });

    const { symbol: ps, gainTracking, currency, divideBy100, market, aggregateTime, symbolType, multiplier } = params;

    const { price: pr, timestamp, symbol, name: symbolUI, type } = quoteData;

    const { price, priceInFloat, _currency } = await GetFormatedPrice({
      pr,
      symbolType,
      currency,
      divideBy100,
      multiplier,
    });

    const _s =
      type === "webpage"
        ? symbolUI
        : symbolType === SYMBOL_TYPE.CRYPTO
        ? symbol?.split("/")[0] ?? ps?.split("/")[0]
        : symbol;

    const { perValue, percent } =
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
        : GetFormattedPercentage("1d", quoteData.changePer);

    const response = {
      symbol: _s,
      price,
      p: priceInFloat,
      percent,
      perValue,
      date: timestamp,
      name: symbolUI || symbol || undefined,
      currency: _currency.code,
    };

    console.log("processCryptoQuote ", response);
    return { success: true, data: response, error: null };
  } catch (error) {
    console.error("processTradingViewQuote", error);
    return { success: false, data: null, error: "Error processing quote" };
  }
};

export const GetFormattedPercentage = (aggregateTime, percent) => ({
  perValue: percent,
  percent: formattedPercentage(aggregateTime, percent),
});

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

  console.log({ priceInFloat, quote, multiplier });

  const price = _curr + getFormattedNumber(priceInFloat, _currency.decimal);

  return { price, priceInFloat, _currency };
};
