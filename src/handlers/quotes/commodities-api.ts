import { DateTime } from "luxon";
import config from "../../conf";
import { SYMBOL_TYPE } from "../../constants";
import { HTTPClient, APISOURCES } from "../../services/httpClass";

import { getFormattedNumber, ignoredCurrencySymbols, rounderNumber } from "./helper";
import { IGetQuote, IGetQuoteFromAPI, IPercentageReturn, ITickrResponse } from "./helper/interfaces";

import currencies from "./jsonFiles/currencylist.json";
import commoditiesList from "./jsonFiles/commodities.json";

import { calculatePercentage, calculateProfitLossPercentage } from "./percentCalculations";
import QuoteCollector from "../../models/quote-collectors";
import redis from "../../services/redis";

const OUNCE_TO_POUNDS_RATIO = 16;
const OUNCE_TO_KG_RATIO = 35.274;
const OUNCE_TO_GRAMS_RATIO = 0.035274;

const API_BASE_URL = "https://commodities-api.com/api";
const API_KEY = config.app.commodityapi_apikey;
const buildURL = (apiURL: string) => `${API_BASE_URL}/${apiURL}&access_key=${API_KEY}`;
const buildCommodityURL = (baseCurrency: string, symbol: string) =>
  buildURL(`latest?base=${baseCurrency}&symbols=${symbol}`);

const buildAggURL = (baseCurrency: string, symbol: string, date: string) =>
  buildURL(`open-high-low-close/${date}?base=${baseCurrency}&symbols=${symbol}`);

//** ------------------------------------------------------- */

const commoditesFromTV = {
  XAU: "TV:TVC:XAU",
  XAG: "TV:TVC:XAG",
  WTIOIL: "TV:TVC:WTIOIL",
  BRENTOIL: "TV:TVC:BRENTOIL",
  XPT: "TV:TVC:XPT",
  XPD: "TV:TVC:XPD",
};

//** ------------------------------------------------------- */

//** Get the quote from Stock API */
const getCommodityQuoteFromAPI: IGetQuoteFromAPI = async (params) => {
  const http = new HTTPClient();
  try {
    const { market, symbol, gainTracking, currency, unit } = params;

    const symbolName = commoditiesList.find((c) => c.symbol === symbol)?.name;

    const url = buildCommodityURL(symbol, currency);

    let response: any = await http.getAPI(url, APISOURCES.COMMODITIES, true);

    const { data } = response;

    if (!data.success) {
      console.error("Error from API: ", data.error.info);
      return { success: false, error: "Error processing your request ", data: null };
    }

    const { timestamp, rates } = data;

    const pr = rates[currency];

    // const { price: pr, timestamp } = response;

    const _currency = currencies.find((c) => c.code === currency);
    const _curr = ignoredCurrencySymbols.includes(_currency.symbol) ? "" : _currency.symbol;
    // const date = formatDate(timestamp, timeZone);

    const quote = parseFloat(pr.toString());
    //const priceInFloat = quote;
    const priceInFloat = quote;

    const { perValue, formattedPercentage, formattedPriceDiff, priceDiff } = await calculateProfitLossPercentage(
      symbol,
      priceInFloat,
      gainTracking,
      getCommodityPreviousClosing,
      _currency,
      false,
      currency
    );

    const priceWithUnit = rounderNumber(getMetalsWithDifferentUnits(quote)[unit] ?? quote, 4);
    const price = _curr + getFormattedNumber(Number(priceWithUnit), _currency.decimal); // round(results.p.toString(), 2);

    const tickrResponse: ITickrResponse = {
      symbol,
      price,
      p: Number(priceWithUnit),
      percent: formattedPercentage,
      perValue,
      pd: priceDiff,
      priceDiff: formattedPriceDiff,
      date: timestamp,
      name: symbolName || symbol || undefined,
      currency: _currency.code,
    };

    return { success: true, data: tickrResponse };
  } catch (error) {
    console.error("COMMIDITES-API: Error in getCommodityQuoteFromAPI: ", error);
    return { success: false, data: null };
  } finally {
    http.dispose();
  }
};
//** Get last day closing */
const getCommodityPreviousClosing = async (baseCurrency: string, symbol: string): Promise<number> => {
  const http = new HTTPClient();
  try {
    const from = DateTime.now().minus({ days: 1 }).toFormat("yyyy-MM-dd");
    const url = buildAggURL(symbol, baseCurrency, from);

    const response: any = await http.getAPI(url, APISOURCES.COMMODITIES, true, true);

    if (!response.success) return 0;

    const previousPrice = response?.rates?.close ?? 0;

    return parseFloat(previousPrice.toString()) || 0;
  } catch (error) {
    console.error("COMMIDITES-API: Error in getCommodityPreviousClosing: ", error);
    return 0;
  } finally {
    http.dispose();
  }
};

/**
 * Get the quote from API
 * @deprecated
 */
export const GetCommodityAPIQuote: IGetQuote = async (params) => {
  const { symbolType, market, symbol, gainTracking, currency, multiplier, unit } = params;

  return symbolType === SYMBOL_TYPE.COMMODITY
    ? await getCommodityQuoteFromAPI({ market, symbol, gainTracking, currency, multiplier, unit })
    : { success: false, data: null, error: "Invalid symbol type" };
};

export const GetCommodityAPIQuoteDB: IGetQuote = async (params) => {
  const { symbolType, market, symbol, gainTracking, currency, multiplier, unit } = params;

  return symbolType === SYMBOL_TYPE.COMMODITY
    ? await GetCommodityQuoteFromDB({ market, symbol, gainTracking, currency, multiplier, unit })
    : { success: false, data: null, error: "Invalid symbol type" };
};

//** ------------------------------------------------------- */
//DB operations

const GetCommodityQuoteFromDB: IGetQuoteFromAPI = async (params) => {
  try {
    const { symbol, gainTracking, currency, unit } = params;

    const commodity = commoditiesList.find((c) => c.symbol === symbol);

    const { success, data } = await getLatestQuote(symbol, currency, unit);
    //console.log("GetCommodityQuoteFromDB", "Data found in DB: ", data);

    if (!success || data.price === undefined) {
      //call the API
      const res = await getCommodityQuoteFromAPI(params);

      if (!res.success) return { success: false, error: "Error processing your request ", data: null };

      //console.log("commodity .. sending from DB ...", res.data);

      return {
        ...res,
        commodityCategory: commodity?.category || "",
      };
    }

    const _currency = currencies.find((c) => c.code === currency);
    const _curr = ignoredCurrencySymbols.includes(_currency.symbol) ? "" : _currency.symbol;

    const priceInFloat = data.price[unit] ?? data.price;

    const formattedPrice = getFormattedNumber(priceInFloat, _currency.decimal);
    const price = _curr + formattedPrice;

    const { perValue, formattedPercentage, priceDiff, formattedPriceDiff } = calculatePercentageChange({
      gainTracking,
      price: priceInFloat,
      lastDayClosing: data.lastDayClosing,
      currency: _currency,
    });

    const tickrResponse: ITickrResponse = {
      symbol,
      price,
      p: Number(formattedPrice),
      percent: formattedPercentage,
      pd: priceDiff,
      priceDiff: formattedPriceDiff,
      perValue,
      date: data.timestamp,
      name: commodity?.name || symbol || undefined,
      currency: _currency.code,
      commodityCategory: commodity?.category || "",
    };

    //console.log("commodity", { response });
    return { success: true, data: tickrResponse };
  } catch (error) {
    console.error("Error in GetCommodityQuoteFromDB: ", error);
    return { success: false, data: null };
  }
};

//** Get the latest quote from Redis or DB */
// const getLatestQuote = async (symbol: string, currency: string, unit: string) => {
//   try {
//     //console.log("Unit .. ", unit);
//     // const redisKey = `commodities-api:quote:${symbol}:${currency}`;
//     // const redisData = await redis.get(redisKey);

//     const redisData = await getDataFromRedis(`commodities-api:quote:${symbol}:${currency}`, unit);

//     const lastDayRedisData = await getDataFromRedis(`commodities-api:lastDay:${symbol}:${currency}`, unit);

//     if (redisData.success && lastDayRedisData.success)
//       return {
//         success: true,
//         data: {
//           price: redisData.data.price,
//           timestamp: redisData.data.timestamp,
//           lastDayClosing: lastDayRedisData.data.price,
//         },
//       };

//     const dbQuote = await getDataFromDB(symbol, currency, unit);

//     if (dbQuote.success) {
//       //console.log("🙌 Data found in DB: ", dbQuote.data);

//       //check if last day closing isnt availbale then call the api to get the last day closing (happening if job isnt ran for the symbol/currency pair)
//       if (!dbQuote.data.lastDayClosing || dbQuote.data.lastDayClosing === "") {
//         const lastDayClose = await getCommodityLastDayCloseFromAPINew(currency, symbol);

//         let price = lastDayClose?.price ?? "";

//         if (price && unit !== "") {
//           const pricesInUnits = getMetalsWithDifferentUnits(price);

//           price = pricesInUnits[unit] ?? price;
//         }

//         dbQuote.data.lastDayClosing = price;
//       }

//       return {
//         success: true,
//         data: {
//           price: dbQuote.data.price,
//           timestamp: dbQuote.data.timestamp,
//           lastDayClosing: dbQuote.data.lastDayClosing,
//         },
//       };
//     }

//     return { success: false, error: "Data not found in Redis or DB", data: null };
//   } catch (error) {
//     console.error("Error in getLatestQuoteFromDB: ", error);
//     return { success: false, error: "Error processing your request ", data: null };
//   }
// };

// const getDataFromRedis = async (redisKey: string, unit: string) => {
//   try {
//     const redisData = await redis.get(redisKey);

//     if (!redisData)
//       return {
//         success: false,
//         error: "Data not found in Redis",
//         data: null,
//       };

//     const data = JSON.parse(redisData);

//     //console.log("🙌🙌 Data found in Redis: ", redisKey, data);

//     const returnObj = {
//       success: true,
//       data: {
//         price: data[`${unit}`] ?? data.price,
//         timestamp: data.timestamp,
//       },
//     };

//     return returnObj;
//   } catch (error) {
//     console.error("Error in getLatestDataFromRedis: ", error);
//     return { success: false, error: "Error processing your request ", data: null };
//   }
// };



const getLatestQuote = async (symbol: string, currency: string, unit: string) => {
  try {
    //console.log("Unit .. ", unit);
    // const redisKey = `commodities-api:quote:${symbol}:${currency}`;
    // const redisData = await redis.get(redisKey);

    //check if Commodity is available in Redis on TradingView

    const tvSymbol = commoditesFromTV[symbol];
    console.log({ symbol, currency, unit, tvSymbol });

    // if (tvSymbol) {
    //   const tvData = await getDataFromRedis(tvSymbol, unit, true);
    //   console.log("TV Data .. ", tvData);
    // }

    const redisData = tvSymbol
      ? await getDataFromRedis(tvSymbol, unit, currency, true)
      : await getDataFromRedis(`commodities-api:quote:${symbol}:${currency}`, currency, unit);

    const lastDayRedisData = tvSymbol
      ? await getDataFromRedis(`PCP:${tvSymbol}`, unit, currency, true)
      : await getDataFromRedis(`commodities-api:lastDay:${symbol}:${currency}`, currency, unit);
    if (redisData.success && lastDayRedisData.success)
      return {
        success: true,
        data: {
          price: redisData.data.price,
          timestamp: redisData.data.timestamp,
          lastDayClosing: lastDayRedisData.data.price,
        },
      };

    const dbQuote = await getDataFromDB(symbol, currency, unit);

    if (dbQuote.success) {
      //console.log("🙌 Data found in DB: ", dbQuote.data);

      //check if last day closing isnt availbale then call the api to get the last day closing (happening if job isnt ran for the symbol/currency pair)
      if (!dbQuote.data.lastDayClosing || dbQuote.data.lastDayClosing === "") {
        const lastDayClose = await getCommodityLastDayCloseFromAPINew(currency, symbol);

        let price = lastDayClose?.price ?? "";

        if (price && unit !== "") {
          const pricesInUnits = getMetalsWithDifferentUnits(price);

          price = pricesInUnits[unit] ?? price;
        }

        dbQuote.data.lastDayClosing = price;
      }

      return {
        success: true,
        data: {
          price: dbQuote.data.price,
          timestamp: dbQuote.data.timestamp,
          lastDayClosing: dbQuote.data.lastDayClosing,
        },
      };
    }

    return { success: false, error: "Data not found in Redis or DB", data: null };
  } catch (error) {
    console.error("Error in getLatestQuoteFromDB: ", error);
    return { success: false, error: "Error processing your request ", data: null };
  }
};

const getDataFromRedis = async (redisKey: string, unit: string, currency: string, isTV: boolean = false) => {
  try {
    const redisData = await redis.get(redisKey);

    if (!redisData)
      return {
        success: false,
        error: "Data not found in Redis",
        data: null,
      };

    let data = JSON.parse(redisData);

    console.log("🙌🙌 Data found in Redis: ", redisKey, data);

    if (isTV) {
      //we need to convert the data on units here by using getMetalsWithDifferentUnits
      //and modify the data object to include those units
      const priceInOunce = redisKey.startsWith("PCP") ? data : data.lp;

      const exchangeRate = currency === "USD" ? 1 : await redis.get(`ExchangeRates:USD:${currency}`);
      const adjustedPriceInOunce = priceInOunce * (exchangeRate ? Number(exchangeRate.toString()) : 1);      
      
      const pricesInUnits = getMetalsWithDifferentUnits(adjustedPriceInOunce);


      data = {
        price: priceInOunce,
        ...data,
        ...pricesInUnits,
      };
    }

    console.log("Data after unit conversion (if applicable): ", data);

    const returnObj = {
      success: true,
      data: {
        price: data[`${unit}`] ?? data.price,
        timestamp: isTV ? data.ts : data.timestamp,
      },
    };

    console.log("Returning data from Redis: ", returnObj);

    return returnObj;
  } catch (error) {
    console.error("Error in getLatestDataFromRedis: ", error);
    return { success: false, error: "Error processing your request ", data: null };
  }
};

const getDataFromDB = async (symbol: string, currency: string, unit: string) => {
  try {
    const query = {
      stream: "commodities-api",
      market: "commodities",
      symbol: symbol,
      currency: currency,
    };

    const qc = new QuoteCollector();
    const result = await qc.getOne(query);

    if (!result.success) return { success: false, error: "Error processing your request ", data: null };

    //console.log("🙌 Data found in DB: ", unit, result.data);

    let price = result.data?.price?.price;
    let lastDayClosing = result.data?.lastDayPrice?.price;

    if (unit !== "" || unit !== undefined) {
      if (unit in result.data.price && unit in result.data.lastDayPrice) {
        price = result.data.price[`${unit}`];
        lastDayClosing = result.data.lastDayPrice[`${unit}`];
      }
    }

    // const _lastDayClosing =
    //unit === undefined
    //  ? result.data?.lastDayPrice?.price
    //  : unit !== ""
    //  ? `lastDayPrice[${unit}]` in result.data
    //    ? result.data?.lastDayPrice[`${unit}`]
    //    : ""
    //  : result.data?.lastDayPrice?.price;

    return {
      success: true,
      data: {
        price,
        timestamp: result.data?.price?.timestamp,
        lastDayClosing,
      },
    };
  } catch (error) {
    console.error("Error in getDataFromDB: ", error);
    return { success: false, error: "Error processing your request ", data: null };
  }
};

//** Calculate Percentage Change */
const calculatePercentageChange = ({ gainTracking, price, lastDayClosing, currency }) => {
  let calculatedPer: IPercentageReturn = { perValue: 0, priceDiff: 0, formattedPercentage: "", formattedPriceDiff: "" };

  //console.log({ gainTracking, price, lastDayChange, currency });
  if (isNaN(lastDayClosing)) return calculatedPer;
  if (lastDayClosing === "") return calculatedPer;

  const lastDayChange = ((price - lastDayClosing) / lastDayClosing) * 100;

  if (isNaN(lastDayChange)) return calculatedPer;

  const calculateDefaultPercentage = () => {
    const perSign = lastDayChange > 0 ? "+" : "";
    const perValue = lastDayChange.toFixed(2);

    const diffSign = lastDayClosing > 0 ? "+" : "";
    const diffValue = lastDayClosing.toFixed(2);

    return {
      perValue: Number(perValue),
      formattedPercentage: `1 day ${perSign} ${perValue}%`,
      priceDiff: Number(diffValue),
      formattedPriceDiff: `1 day ${diffSign} ${currency.symbol}${diffValue}`,
    };
  };

  const { isCalculateOnDaily, enabled, purchasePrice } = gainTracking;
  const isGainTrackingValid = enabled && purchasePrice !== null && !isNaN(purchasePrice);

  if (isCalculateOnDaily || !isGainTrackingValid) calculatedPer = calculateDefaultPercentage();
  else calculatedPer = calculatePercentage(price, gainTracking, currency);

  return calculatedPer;
};

//** Get the metals with different units */
const getMetalsWithDifferentUnits = (quoteInOunce: number) => {
  return {
    perOunce: quoteInOunce,
    perPound: quoteInOunce * OUNCE_TO_POUNDS_RATIO,
    perKg: quoteInOunce * OUNCE_TO_KG_RATIO,
    perGram: quoteInOunce * OUNCE_TO_GRAMS_RATIO,
  };
};

//** Get the last day closing price from API */
const getCommodityLastDayCloseFromAPINew = async (symbol, currency) => {
  const http = new HTTPClient();
  try {
    const from = DateTime.now().minus({ days: 1 }).toFormat("yyyy-MM-dd");
    const url = buildAggURL(currency, symbol, from);

    let data: any;
    //check in redis
    let json: any = await redis.get(url);
    if (json) {
      data = JSON.parse(json);
    } else {
      data = await http.get(url);
      redis.set(url, JSON.stringify(data), "EX", 10800);
    }

    return {
      symbol: symbol,
      currency: currency,
      price: data.rates.close,
      timestamp: data.timestamp,
    };
  } catch (error) {
    console.error("COMMIDITES-API: Error in getCommodityQuoteFromAPI: ", error);
    return null;
  } finally {
    http.dispose();
  }
};
