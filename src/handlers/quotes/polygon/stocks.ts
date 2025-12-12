import redis from "../../../services/redis";
import { print } from "..";
import { IGetQuoteFromAPI, ITickrResponse } from "../helper/interfaces";
import { APISOURCES, HTTPClient } from "../../../services/httpClass";
import { buildURL } from ".";
import { calculateProfitLossPercentage } from "../percentCalculations";
import { currencyList, getFormattedNumber } from "../helper";

// ** Get the quote from Stock API */
export const GetPolygonStockQuoteFromWS: IGetQuoteFromAPI = async (params) => {
  try {
    const { symbol, gainTracking, currency, stockName = null } = params;

    const key = `POLYGON:STOCKS:${symbol.toUpperCase()}`;
    const data = await redis.get(key);

    let results = null;
    if (!data) {
      const response = await getStockQuoteFromAPI(symbol);
      if (!response.success) return response;

      results = response.data;
    } else {
      results = JSON.parse(data);
    }

    if (!results.p) return { success: false, error: "Error getting data", data: null };

    const _currency = currencyList.find((c) => c.code === currency);

    const { perValue, formattedPercentage, priceDiff, formattedPriceDiff } = await calculateProfitLossPercentage(
      symbol,
      results.p,
      gainTracking,
      getStockPreviousClosing,
      _currency
    );

    // changed y to t as per client request
    const timestamp = results.t / 1000;
    const price = getFormattedNumber(parseFloat(results.p.toString())); // round(results.p.toString(), 2);

    const tickerResponse: ITickrResponse = {
      symbol,
      price: _currency.symbol + price,
      p: Number(price),
      percent: formattedPercentage,
      date: timestamp,
      perValue,
      pd: priceDiff,
      priceDiff: formattedPriceDiff,
      currency: _currency.symbol,
      name: stockName || undefined,
    };

    return { success: true, data: tickerResponse, error: null };
  } catch (error) {
    console.error("Polygon Stock: Error in getStockQuoteFromAPI", error);
    return { success: false, error: error.message, data: null };
  }
};

const getStockQuoteFromAPI = async (symbol: string) => {
  const http = new HTTPClient();
  try {
    //const { symbol, gainTracking, currency, stockName = null } = params;

    const url = buildURL(`v2/last/trade/${symbol.toUpperCase()}?`).replace("?&", "?");

    // const cSymbol = currSymbols[currency];

    let response: any = await http.getAPI(url, APISOURCES.POLYGON, true);

    if (response.status === "IEX") response.status = "OK"; // Handle IEX status as OK

    if (response.status !== "OK") {
      return {
        success: false,
        error: response?.error?.error || "API Error",
        status: response?.status || 400,
        data: null,
      };
    }

    const { results } = response;

    if (results) {
      const data = {
        p: results.p,
        t: results.t,
      };
      redis.set(`POLYGON:STOCKS:${symbol.toUpperCase()}`, JSON.stringify(results), "EX", 60);
      return {
        success: true,
        data,
      };
    }

    return { success: false, error: "No data found", data: null };
  } catch (error) {
    console.error("Polygon Stock: Error in getStockQuoteFromAPI", error);
    return { success: false, error: error.message, data: null };
  } finally {
    http.dispose();
  }
};

// ** Get last day closing */
const getStockPreviousClosing = async (symbol: string): Promise<number> => {
  const http = new HTTPClient();
  try {
    const url = buildURL(`v2/aggs/ticker/${symbol.toUpperCase()}/prev?unadjusted=true`);

    const response: any = await http.getAPI(url, APISOURCES.POLYGON, true, true);

    if (response.status === "OK" && response?.resultsCount > 0) {
      const previousPrice = response.results.find((f) => f.T === symbol);
      if (previousPrice) {
        return parseFloat(previousPrice.c.toString()) || 0;
      }
    }
  } catch (error) {
    console.error("Polygon Stock: Error in getStockPreviousClosing", error);
    return 0;
  } finally {
    http.dispose();
  }
};
