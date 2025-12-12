//https://api.polygon.io/v3/quotes/O:SPY241220P00720000?limit=1&apiKey=qIUK8pCpjCJnB9sGn3LKD4AvmtsQGuAl

import { DateTime } from "luxon";
import { buildURL } from ".";
import { APISOURCES, HTTPClient } from "../../../services/httpClass";
import { currencyList, getFormattedNumber } from "../helper";
import { IGetQuoteFromAPI } from "../helper/interfaces";
import { calculateProfitLossPercentage } from "../percentCalculations";

export const getOptionsQuoteFromAPI: IGetQuoteFromAPI = async (params) => {
  const http = new HTTPClient();
  try {
    const { symbol, gainTracking, currency, stockName = null } = params;
    const url = buildURL(`v3/quotes/O:${symbol.toUpperCase()}?limit=1`);

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

    if (results.length === 0) return { success: false, error: "No data found", data: null };

    const optionsResult = results[0];

    const _currency = currencyList.find((c) => c.code === currency);
    let quote = (Number(optionsResult.bid_price) + Number(optionsResult.ask_price)) / 2;

    if (quote === 0) {
      const lastTradeUrl = buildURL(`v2/last/trade/O:${symbol.toUpperCase()}?`);
      const lastTradeResponse: any = await http.getAPI(lastTradeUrl, APISOURCES.POLYGON, true);
      if (lastTradeResponse.status !== "OK") {
        return {
          success: false,
          error: response?.error?.error || "API Error",
          status: response?.status || 400,
          data: null,
        };
      }

      quote = lastTradeResponse.results.p;
    }

    const price = _currency.symbol + getFormattedNumber(quote); // round(results.p.toString(), 2);

    const { perValue, percent } = await calculateProfitLossPercentage(
      symbol,
      quote,
      gainTracking,
      getOptionsPreviousClosing,
      _currency
    );

    const parsedOptionTicker = parseOptionTicker(symbol);

    response = {
      symbol: parsedOptionTicker?.underlyingStock,
      price,
      p: quote,
      percent: percent,
      date: formatOptionDetails(parsedOptionTicker),
      perValue: perValue,
      currency: _currency.symbol,
      name: stockName || symbol || undefined,
    };

    return { success: true, data: response };
  } catch (error) {
    console.error("Polygon Stock: Error in getOptionsQuoteFromAPI", error);
    return { success: false, error: error.message, data: null };
  } finally {
    http.dispose();
  }
};

const getOptionsPreviousClosing = async (symbol: string): Promise<number> => {
  const http = new HTTPClient();
  try {
    const url = buildURL(`v2/aggs/ticker/O:${symbol.toUpperCase()}/prev?unadjusted=true`);

    const response: any = await http.getAPI(url, APISOURCES.POLYGON, true, true);

    if (response.status === "OK" && response?.resultsCount > 0) {
      const previousPrice = response.results.find((f) => f.T === `O:${symbol}`);

      if (previousPrice) {
        return parseFloat(previousPrice.c.toString()) || 0;
      }
    }
  } catch (error) {
    console.error("Polygon Stock: Error in getOptionsPreviousClosing", error);
    return 0;
  } finally {
    http.dispose();
  }
};
//* ======================================== =========== ======================================== *//

//***========================================================= */

const parseOptionTicker = (ticker) => {
  const regex = /^([A-Z]+)(\d{6})([CP])(\d{8,9})$/;
  const match = ticker.match(regex);

  if (!match) {
    console.error("Invalid option ticker format");
    return null;
  }

  const [, underlyingStock, expirationString, optionTypeChar, strikePriceString] = match;

  const year = Number(expirationString.slice(0, 2)) + 2000;
  const month = Number(expirationString.slice(2, 4));
  const day = Number(expirationString.slice(4, 6));
  const expirationDate = DateTime.utc(year, month, day);

  const optionType = optionTypeChar === "C" ? "call" : "put";

  // Handle strike prices up to 999,999.99
  let strikePrice;
  if (strikePriceString.length === 8) {
    strikePrice = Number(strikePriceString.slice(0, 5)) + Number(strikePriceString.slice(5)) / 1000;
  } else if (strikePriceString.length === 9) {
    strikePrice = Number(strikePriceString.slice(0, 6)) + Number(strikePriceString.slice(6)) / 1000;
  }

  return {
    ticker,
    underlyingStock,
    expirationDate,
    optionType,
    strikePrice,
  };
};

const formatOptionDetails = (optionDetails) => {
  const { expirationDate, optionType, strikePrice } = optionDetails;

  const formattedDate = expirationDate.toFormat("MMM dd ''yy");
  const capitalizedOptionType = optionType.charAt(0).toUpperCase() + optionType.slice(1);
  const formattedStrikePrice = strikePrice % 1 === 0 ? strikePrice.toFixed(0) : strikePrice.toFixed(2);

  return `${formattedDate} ${formattedStrikePrice} ${capitalizedOptionType}`;
};
