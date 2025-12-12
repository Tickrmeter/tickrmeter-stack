import { SYMBOL_TYPE } from "../../../constants";
import config from "../../../conf";

import { HTTPClient, APISOURCES } from "../../../services/httpClass";

import { getFormattedNumber, currencyList } from "../helper";
import { IGetQuoteFromAPI, IGetQuote } from "../helper/interfaces";
import { calculateProfitLossPercentage } from "../percentCalculations";

import { GetPolygonStockQuoteFromWS } from "./stocks";
import { getIndicesQuoteFromAPI } from "./indices";
import { getForexQuoteFromAPI } from "./forex";
import { getOptionsQuoteFromAPI } from "./options";

const API_BASE_URL = "https://api.polygon.io";
const API_KEY = config.app.polygon_apikey;
export const buildURL = (apiURL: string) => `${API_BASE_URL}/${apiURL}&apiKey=${API_KEY}`;

const cryptoAPIURL = (cryptoCurr: string, fiatCurr: string) =>
  `${API_BASE_URL}/v1/last/crypto/${cryptoCurr}/${fiatCurr}?&apiKey=${API_KEY}`;

export const GetPolygonQuote: IGetQuote = async (params) => {
  const { symbolType, symbol, currency, gainTracking, multiplier, name } = params;

  const paramObj = { symbol, stockName: name, gainTracking, currency, multiplier };

  return symbolType === SYMBOL_TYPE.STOCK
    ? await GetPolygonStockQuoteFromWS(paramObj)
    : symbolType === SYMBOL_TYPE.INDICES
    ? await getIndicesQuoteFromAPI(paramObj)
    : symbolType === SYMBOL_TYPE.CRYPTO
    ? await getCryptoQuoteFromAPI(paramObj)
    : symbolType === SYMBOL_TYPE.FOREX
    ? await getForexQuoteFromAPI(paramObj)
    : symbolType === SYMBOL_TYPE.OPTIONS
    ? await getOptionsQuoteFromAPI(paramObj)
    : { success: false, data: null, error: "Invalid symbol type" };
};

//* ======================================== =========== ======================================== *//
//* ======================================== CRYPTO API ======================================== *//
//* ============================= USED BY DEVICES WITH OLD CONFIG ============================== *//

// ** Get the quote from Crypto API */
const getCryptoQuoteFromAPI: IGetQuoteFromAPI = async (params) => {
  const { symbol, gainTracking, currency } = params;
  const http = new HTTPClient();

  try {
    const url = cryptoAPIURL(symbol, currency.toUpperCase());

    const queryAPIResponse: any = await http.getAPI(url, APISOURCES.POLYGON);

    const { last, status, error } = queryAPIResponse;

    if (error) return { success: false, error, data: null };

    if (status === "notfound") return { success: false, error: status, data: null };
    if (status !== "success") return { success: false, error: status, data: null };

    const { price, timestamp } = last;

    if (price) {
      const _currency = currencyList.find((c) => c.code === currency);

      const { perValue, percent } = await calculateProfitLossPercentage(
        `${symbol.toUpperCase()}${_currency.code}`,
        price,
        gainTracking,
        getCrptoPreviousClosing,
        _currency,
        false
      );

      //const date = formatDate(timestamp / 1000, timeZone);
      const quote = getFormattedNumber(price);

      const response = {
        symbol,
        price: _currency.symbol + quote,
        p: quote,
        percent,
        perValue,
        date: timestamp / 1000,
        currency: _currency.symbol,
        name: symbol,
      };

      return { success: true, data: response };
    }
  } catch (error) {
    console.error("Polygon Crypto: Error in getCryptoQuoteFromAPI", error);
    return { success: false, data: null };
  } finally {
    http.dispose();
  }
};

// ** Get last day closing for crypto*/
const getCrptoPreviousClosing = async (currencyCode: string, symbol: string): Promise<number> => {
  const http = new HTTPClient();
  try {
    const url = buildURL(`v2/aggs/ticker/X:${symbol.toUpperCase()}${currencyCode}/prev?adjusted=false`);

    const response: any = await http.getAPI(url, APISOURCES.POLYGON, true, true);

    if (response.status === "OK" && response?.resultsCount > 0) {
      const previousPrice = response.results.find((f) => f.T === `X:${symbol.toUpperCase()}${currencyCode}`);

      if (previousPrice) {
        return parseFloat(previousPrice.c.toString()) || 0;
      }
    }
  } catch (error) {
    console.error("Polygon Crypto: Error in getCrptoPreviousClosing", error);
    return 0;
  } finally {
    http.dispose();
  }
};
