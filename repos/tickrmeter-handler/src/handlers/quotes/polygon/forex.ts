import { buildURL } from ".";
import { APISOURCES, HTTPClient } from "../../../services/httpClass";
import { commaSepCurrencies, getFormattedNumber2 } from "../helper";
import { IGetQuoteFromAPI, ITickrResponse } from "../helper/interfaces";
import { calculateProfitLossPercentage } from "../percentCalculations";
import currencies from "../../../currency.json";

//https://api.polygon.io/v2/snapshot/locale/global/markets/forex/tickers/C:EURUSD?apiKey=*
//https://api.polygon.io/v1/last_quote/currencies/AUD/USD?apiKey=qIUK8pCpjCJnB9sGn3LKD4AvmtsQGuAl

export const getForexQuote = async (symbolPair: string) => {
  const http = new HTTPClient();
  try {
    const url = buildURL(`v1/last_quote/currencies/${symbolPair}?`);

    let response: any = await http.getAPI(url, APISOURCES.POLYGON, true);

    if (response.status !== "success") {
      return {
        success: false,
        error: response?.error?.error || "API Error",
        status: response?.status || 400,
        data: null,
      };
    }

    if (!response.last) return { success: false, error: "No data found", data: null };

    return { success: true, data: response };
  } catch (error) {
    console.error("Polygon Stock: Error in getForexQuote", error);
    return { success: false, error: error.message, data: null };
  } finally {
    http.dispose();
  }
};

export const getForexQuoteFromAPI: IGetQuoteFromAPI = async (params) => {
  // const http = new HTTPClient();
  try {
    const { symbol, gainTracking, currency, stockName = null } = params;

    const symbolPair = `${symbol.toUpperCase()}/${currency.toUpperCase()}`;

    const urlResponse = await getForexQuote(symbolPair);

    if (!urlResponse.success) return urlResponse;

    const { last } = urlResponse.data;

    const _currency = currencies[currency];

    const decimalChar = commaSepCurrencies.includes(_currency.code) ? "," : ".";

    const timestamp = last.timestamp / 1000;
    const quote = (last.bid + last.ask) / 2;

    const price = getFormattedNumber2(quote, 4, decimalChar);

    const { perValue, formattedPercentage, formattedPriceDiff, priceDiff } = await calculateProfitLossPercentage(
      symbolPair,
      quote,
      gainTracking,
      getForexPreviousClosing,
      _currency
    );

    const tickrResponse: ITickrResponse = {
      symbol: symbolPair,
      price: price,
      p: Number(price),
      percent: formattedPercentage,
      pd: priceDiff,
      priceDiff: formattedPriceDiff,
      date: timestamp,
      perValue,
      currency: _currency.symbol,
      name: stockName || undefined,
    };

    return { success: true, data: tickrResponse };
  } catch (error) {
    console.error("Polygon Stock: Error in getStockQuoteFromAPI", error);
    return { success: false, error: error.message, data: null };
  }
};

// ** Get forex last day closing */
const getForexPreviousClosing = async (symbol: string): Promise<number> => {
  const http = new HTTPClient();
  try {
    //https://api.polygon.io/v2/aggs/ticker/C:EURUSD/prev?adjusted=true&apiKey=*
    const symbolPair = `C:${symbol.toUpperCase().replace("/", "")}`;
    const url = buildURL(`v2/aggs/ticker/${symbolPair}/prev?adjusted=true`);

    const response: any = await http.getAPI(url, APISOURCES.POLYGON, true, true);

    if (response.status === "OK" && response?.resultsCount > 0) {
      const previousPrice = response.results.find((f) => f.T === symbolPair);
      if (previousPrice) {
        return parseFloat(previousPrice.c.toString()) || 0;
      }
    }
  } catch (error) {
    console.error("Polygon Stock: Error in getForexPreviousClosing", error);
    return 0;
  } finally {
    http.dispose();
  }
};
