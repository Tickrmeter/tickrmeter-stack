import { buildURL } from ".";
import { APISOURCES, HTTPClient } from "../../../services/httpClass";
import { currencyList, emptyCurrencyObj, getFormattedNumber } from "../helper";
import { IGetQuoteFromAPI } from "../helper/interfaces";

import usIndicesTV from "../../jsonFiles/us_indices_tv.json";
import { GetQuoteFromTradingViewForAPI } from "../../quotes_api/trading-view";
import { SYMBOL_TYPE } from "../../../constants";

export const getIndicesQuoteFromAPI: IGetQuoteFromAPI = async (params) => {
  try {
    const { symbol, currency } = params;

    const market = usIndicesTV.find((ind) => ind.symbol === symbol)?.market || "NASDAQ";

    if (!market) return { success: false, error: "Unable to find the symbol, please try again", data: null };

    const indiceQuote = await GetQuoteFromTradingViewForAPI(
      market,
      SYMBOL_TYPE.INDICES,
      symbol,
      currency,
      "1d",
      false,
      true
    );

    console.log("getIndicesData", { indiceQuote });

    if (indiceQuote.success) {
      return { success: true, data: indiceQuote.data, error: null };
    } else {
      return { success: false, error: "Error from API \n\n" + indiceQuote.error, data: null };
    }
  } catch (error) {
    console.error("polygon/ind.ts, Error in getIndicesQuoteFromAPI", error);
    return { success: false, error: error.message, data: null };
  }
};
//!! NOT USING BELOW CODE, as we moved to TradingView from Polygon

//https://api.polygon.io/v3/snapshot/indices?ticker.any_of=I:NDX&limit=250&apiKey=qIUK8pCpjCJnB9sGn3LKD4AvmtsQGuAl
export const getIndicesQuoteFromAPI_OLD: IGetQuoteFromAPI = async (params) => {
  const http = new HTTPClient();
  try {
    const { symbol, gainTracking, currency, stockName = null } = params;

    const querySymbol = symbol.toUpperCase().startsWith("I:") ? symbol.toUpperCase() : `I:${symbol.toUpperCase()}`;
    const url = buildURL(`v3/snapshot/indices?ticker.any_of=${querySymbol}&limit=250`);

    console.log(url);
    let response: any = await http.getAPI(url, APISOURCES.POLYGON, true);

    if (response.status !== "OK") {
      return {
        success: false,
        error: response?.error?.error || "API Error",
        status: response?.status || 400,
        data: null,
      };
    }

    const { results } = response;

    console.log(response);

    if (results.length === 0) return;

    const result = response.results[0];

    if (result.error) {
      return {
        success: false,
        error: result.message,
        status: 400,
        data: null,
      };
    }

    console.log({ result });

    const _currency = currencyList.find((c) => c.code === currency) || emptyCurrencyObj;

    //TODO: Gaintracking?

    const perValue = result?.session?.change_percent || 0;
    const percent = `1day ${perValue > 0 ? "+" : ""}${parseFloat(perValue.toFixed(2)).toString()}%`;

    // changed y to t as per client request
    const timestamp = result.t / 1000000000;
    //const date = formatDate(result.t / 1000000000, timeZone);
    const quote = Number(result.value.toString());
    const price = getFormattedNumber(quote); // round(results.p.toString(), 2);

    response = {
      symbol,
      price: _currency.symbol + price,
      p: Number(price),
      percent,
      date: timestamp,
      perValue,
      currency: _currency.symbol,
      name: stockName || undefined,
    };

    return { success: true, data: response };
  } catch (error) {
    console.error("Polygon Stock: Error in getStockQuoteFromAPI", error);
    return { success: false, error: "There is some error processing your request", data: null };
  } finally {
    http.dispose();
  }
};
