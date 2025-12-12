import { buildURL } from ".";
import { APISOURCES, HTTPClient } from "../../../services/httpClass";
import { currencyList, emptyCurrencyObj, getFormattedNumber } from "../helper";
import { IGetQuoteFromAPI } from "../helper/interfaces";

//https://api.polygon.io/v3/snapshot/indices?ticker.any_of=I:NDX&limit=250&apiKey=qIUK8pCpjCJnB9sGn3LKD4AvmtsQGuAl

export const getIndicesQuoteFromAPI: IGetQuoteFromAPI = async (params) => {
  const http = new HTTPClient();
  try {
    const { symbol, gainTracking, currency, stockName = null } = params;

    const querySymbol = symbol.toUpperCase().startsWith("I:") ? symbol.toUpperCase() : `I:${symbol.toUpperCase()}`;
    const url = buildURL(`v3/snapshot/indices?ticker.any_of=${querySymbol}&limit=250`);

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

    if (results.length > 0) {
      const result = response.results[0];

      if (result.error) {
        return {
          success: false,
          error: result.message,
          status: 400,
          data: null,
        };
      }

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
    }
  } catch (error) {
    console.error("Polygon Stock: Error in getStockQuoteFromAPI", error);
    return { success: false, error: error.message, data: null };
  } finally {
    http.dispose();
  }
};
