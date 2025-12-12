import redis from "../../services/redis";
import { DATA_MARKETS, DATA_STREAM, SYMBOL_TYPE } from "../../constants";
import { currencyList, emptyCurrencyObj, getFormattedNumber, ignoredCurrencySymbols } from "./helper";
import { IGetQuoteFromAPIParams, ITickrResponse } from "./helper/interfaces";

import { calculateProfitLossPercentage, formatAggregateData } from "./percentCalculations";

import { print } from ".";
import exchangesMap from "./jsonFiles/exhanges_map.json";

//** Get last day closing */
const getStockPreviousClosing = async (market: string, symbol: string, aggregateTime = "1d"): Promise<number> => {
  let _previousClosingPrice = undefined;
  const key = `PCP:TV:${market.toUpperCase()}:${symbol.replace(/[. -]/g, "_").replace("/", "")}`;
  const data = await redis.get(key);
  _previousClosingPrice = data;
  return _previousClosingPrice;
};

//** ====================== TRADING VIEW API========================================== */
export const GetTradingViewQuote = async (params) => {
  //.

  //if data stream is finage, map the market from exchangesMap
  if (params.stream === DATA_STREAM.FINAGE) {
    params.market = exchangesMap[params.market]?.code || params.market;
  }

  const { market, symbol, currency, manualSearch } = params;
  const _symbol = manualSearch ? symbol.replace("/", "") : symbol.replace(/[. -]/g, "_").replace("/", "");

  //console.log("getDataFromTradingView", { market, symbol, currency, manualSearch, _symbol });

  let key = "";
  if (market === DATA_MARKETS.CRYPTO && currency !== "USD") {
    key = `TV:COINBASE:${_symbol}`;
  } else {
    //get data from redis
    key = `TV:${market.toUpperCase()}:${_symbol}`;
  }

  print(
    params.macAddress,
    `${params.requestId} - TRradingView After CALLiNG Redis - ${key} - params - ${JSON.stringify(params)}`
  );

  const data = await redis.get(key);

  if (!data) {
    print(params.macAddress, `${params.requestId} - TRradingView After data not found- ${key}`);
    if (params.symbolType === SYMBOL_TYPE.CRYPTO) {
      const usdKey = `TV:${market.toUpperCase()}:${_symbol}USD`;
      const usdData = await redis.get(usdKey);
      if (usdData) {
        return { success: true, data: JSON.parse(usdData), error: null };
      }
    }
    return { success: false, error: `No data found for key ${key}`, data: null };
  }

  const { lp: price, chp, ts, name, type, prev_close_price } = JSON.parse(data);

  const response = {
    price,
    prev_close_price,
    changePer: chp ?? -1,
    timestamp: ts,
    name,
    type,
  };

  return await processTradingViewQuote(params, response);
};

interface ITVResponse {
  price: number;
  prev_close_price?: number;
  changePer?: number;
  timestamp: number;
  name?: string;
  type?: string;
}

export const processTradingViewQuote = async (params: IGetQuoteFromAPIParams, quoteData: ITVResponse) => {
  try {
    const { symbol, gainTracking, currency, divideBy100, market, aggregateTime, symbolType, multiplier, manualSearch } =
      params;

    const { price: pr, timestamp, name: symbolUI, type } = quoteData;

    const { price, priceInFloat, _currency } = GetFormatedPrice({
      pr,
      currency,
      divideBy100,
      multiplier,
    });

    const _s = type === "webpage" ? symbolUI : symbolType === SYMBOL_TYPE.CRYPTO ? symbol.split("/")[0] : symbol;
    const { formattedPercentage, formattedPriceDiff, priceDiff, perValue } =
      gainTracking.enabled || quoteData.changePer === -1
        ? await calculateProfitLossPercentage(
            symbol,
            priceInFloat,
            gainTracking,
            getStockPreviousClosing,
            _currency,
            divideBy100 ?? false,
            market,
            aggregateTime,
            manualSearch
          )
        : formatAggregateData("1d", quoteData.changePer, quoteData.prev_close_price - quoteData.price, _currency); //GetFormattedPercentage("1d", quoteData.changePer);

    const tickrResponse: ITickrResponse = {
      symbol: _s,
      price,
      p: priceInFloat,
      percent: formattedPercentage,
      perValue,
      pd: priceDiff,
      priceDiff: formattedPriceDiff,
      date: timestamp * 1000,
      name: symbolUI || symbol || undefined,
      currency: _currency.code,
    };

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
  currency: string;
  divideBy100: boolean;
  multiplier: { enabled: boolean; value: number };
}

export const GetFormatedPrice = (params: IGetFormatedPrice) => {
  const { pr, currency, divideBy100, multiplier } = params;

  const quote = parseFloat(pr.toString());

  const _currency =
    currencyList.find(
      (c) => c.code.toLowerCase() === (currency === "GBp" && !divideBy100 ? "GBX" : currency).toLowerCase()
    ) || emptyCurrencyObj;
  const _curr = ignoredCurrencySymbols.includes(_currency?.symbol) ? "" : _currency.symbol;

  let priceInFloat = multiplier.enabled ? quote * multiplier.value : quote;
  priceInFloat = divideBy100 ? priceInFloat / 100 : priceInFloat;

  const price = _curr + getFormattedNumber(priceInFloat, _currency.decimal);

  //console.log("GetFormatedPrice", params, { price, priceInFloat, _currency });

  return { price, priceInFloat, _currency };
};
