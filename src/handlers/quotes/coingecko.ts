import { HTTPClient, APISOURCES } from "../../services/httpClass";
import config from "../../conf";
import { coinsById, coinsBySymbol, currencyList, formatDate, getFormattedNumber } from "./helper";
import { IGetQuote, IGetQuoteFromAPI, IPercentageReturn, ITickrResponse } from "./helper/interfaces";
import { calculatePercentage } from "./percentCalculations";

const API_BASE_URL = "https://pro-api.coingecko.com/api/v3";
const API_KEY = `x_cg_pro_api_key=${config.app.coingecko_apikey}`;
const COINS_MARKET_URL = `${API_BASE_URL}/coins/markets?${API_KEY}`;

const buildStockURL = (symbol: string, currency: string) =>
  `${COINS_MARKET_URL}&vs_currency=${currency.toLowerCase()}&ids=${symbol}`;

export const GetCoinGeckoQuote: IGetQuote = async (params) => {
  const { symbol, currency, gainTracking, multiplier } = params;

  return await getCryptoQuoteFromAPI({
    symbol,
    gainTracking,
    currency,
    multiplier,
  });
};

//** Get the quote from Stock API */
const getCryptoQuoteFromAPI: IGetQuoteFromAPI = async (params) => {
  const http = new HTTPClient();
  try {
    const { market, symbol, gainTracking, currency, multiplier } = params;

    const coin = coinsById[symbol.toLowerCase()] || coinsBySymbol[symbol.toLowerCase()];

    if (!coin) return { success: false, error: `No Coin found against symbol ${symbol}`, data: null };

    const url = buildStockURL(coin.id, currency);

    let response: any = await http.getAPI(url, APISOURCES.COINGECKO, true);

    if (response?.error) {
      const { error } = response.error;
      if (error === "Please check the symbol name and try again.")
        return { success: false, error: `No Stock found against symbol ${symbol}`, data: null };
      else
        return { success: false, error: error ? "Error from API: " + error : "Error processing Request", data: null };
    }

    if (response.length === 0)
      return { success: false, error: `No Coin data found against symbol ${symbol}`, data: null };

    const stockData = response[0];

    const { current_price: price, last_updated: timestamp, price_change_24h, price_change_percentage_24h } = stockData;

    const _currency = currencyList.find((c) => c.code === currency);

    const { perValue, formattedPriceDiff, formattedPercentage, priceDiff } = calculatePercentageChange({
      gainTracking,
      price,
      price_change_percentage_24h,
      price_change_24h,
      currency: _currency,
    });

    const quote = getFormattedNumber(multiplier.enabled ? price * multiplier.value : price);

    const tickrResponse: ITickrResponse = {
      symbol: coin.symbol.toUpperCase(),
      price: _currency.symbol + quote,
      p: Number(quote),
      percent: formattedPercentage,
      perValue,
      pd: priceDiff,
      priceDiff: formattedPriceDiff,
      date: timestamp / 1000,
      currency: _currency.symbol,
      name: symbol,
    };

    console.log("Coingecko: Quote: ", tickrResponse);

    return { success: true, data: tickrResponse };
  } catch (error) {
    console.error("Coingecko: Error in getStockQuoteFromAPI: ", error);
    return { success: false, data: null };
  } finally {
    http.dispose();
  }
};

const calculatePercentageChange = ({
  gainTracking,
  price,
  price_change_percentage_24h,
  price_change_24h,
  currency,
}) => {
  let calculatedPer: IPercentageReturn = { perValue: 0, priceDiff: 0, formattedPercentage: "", formattedPriceDiff: "" };

  if (!price_change_percentage_24h) return calculatedPer;

  const calculateDefaultPercentage = () => {
    const perSign = price_change_percentage_24h > 0 ? "+" : "";
    const perValue = price_change_percentage_24h.toFixed(2);
    const diffSign = price_change_24h > 0 ? "+" : "";
    const diffValue = price_change_24h.toFixed(2);

    // const priceDiff = price_change_24h;
    // const formattedPriceDiff = `${currency.symbol}${Math.abs(Number(priceDiff.toFixed(2))).toString()}`;
    return {
      perValue: Number(perValue),
      formattedPercentage: `24h ${perSign} ${perValue}%`,
      priceDiff: Number(diffValue),
      formattedPriceDiff: `24h ${diffSign} ${currency.symbol}${diffValue}`,
    };
  };

  const { isCalculateOnDaily, enabled, purchasePrice, noOfStocks, showFullAssetValue, isShortSell } = gainTracking;
  const isGainTrackingValid = enabled && purchasePrice !== null && !isNaN(purchasePrice);

  if (isCalculateOnDaily || !isGainTrackingValid) calculatedPer = calculateDefaultPercentage();
  else calculatedPer = calculatePercentage(price, gainTracking, currency);

  return calculatedPer;
};

// const calculateDefaultPercentage = () => {
//   const sign = price_change_percentage_24h > 0 ? "+" : "";
//   const value = price_change_percentage_24h.toFixed(2);
//   return {
//     perValue: parseFloat(value),
//     percent: `24h ${sign} ${value}%`,
//   };
// };

// const isCalculateOnDaily = gainTracking.isCalculateOnDaily;
// const isGainTrackingValid =
//   gainTracking.enabled && gainTracking.purchasePrice !== null && !isNaN(gainTracking.purchasePrice);

// if (isCalculateOnDaily || !isGainTrackingValid) {
//   calculatedPer = calculateDefaultPercentage();
// } else {
//   calculatedPer = calculatePercentage(
//     gainTracking.purchasePrice,
//     price,
//     gainTracking.enabled,
//     gainTracking.noOfStocks,
//     gainTracking.showFullAssetValue,
//     gainTracking.isShortSell,
//     _currency.code
//   );
// }

// if (gainTracking.isCalculateOnDaily) {
//   calculatedPer.percent = `24h ${price_change_percentage_24h > 0 ? "+" : ""} ${price_change_percentage_24h.toFixed(
//     2
//   )}%`;
//   calculatedPer.perValue = parseFloat(price_change_percentage_24h.toFixed(2));
// } else if (gainTracking.enabled && gainTracking.purchasePrice !== null && !isNaN(gainTracking.purchasePrice)) {
//   calculatedPer = calculatePercentage(
//     gainTracking.purchasePrice,
//     price,
//     gainTracking.enabled,
//     gainTracking.noOfStocks,
//     gainTracking.showFullAssetValue,
//     gainTracking.isShortSell,
//     _currency.code
//   );
// } else {
//   calculatedPer.percent = `24h ${price_change_percentage_24h > 0 ? "+" : ""} ${price_change_percentage_24h.toFixed(
//     2
//   )}%`;
//   calculatedPer.perValue = parseFloat(price_change_percentage_24h.toFixed(2));
// }

//const { perValue, percent } = calculatedPer;

//const date = formatDate(timestamp / 1000, timeZone);
