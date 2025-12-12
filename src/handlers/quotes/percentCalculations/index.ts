import ClosingQuotes from "../../../models/closingQuotes";
import { rounderNumber } from "../helper";
import { ICalculatePercentage, ICalculateProfitLossPercentage } from "../helper/interfaces";
import { calculateGainLoss } from "./gainLossCalculation";

/**
 * This function, `calculatePercentage`, calculates the percentage change in a stock's price.
 * It takes three parameters: `currentQuote`, `gainTracking`, and `currency`.
 *
 * @param {number} currentQuote - The current price of the stock.
 * @param {object} gainTracking - An object containing information about the gain tracking.
 * It includes properties such as `purchasePrice`, `enabled`, `noOfStocks`, `showFullAssetValue`, and `isShortSell`.
 * @param {object} currency - The currency in which the stock is traded.
 * It includes properties such as `code`, `symbol`, and `decimal`.
 *
 * @returns {object} - An object containing the percentage change and the formatted percentage change.
 * If gain tracking is enabled (`enabled` is true), the function calculates the gain or loss and returns the percentage gain or loss.
 * If not, it calculates the percentage change in stock price on the basis of the previous closing price.
 * If the calculated percentage is not a number, it returns a default object with a default value.
 */
export const calculatePercentage: ICalculatePercentage = (
  currentQuote,
  gainTracking,
  currencyObj,
  aggregateTime = "1d"
) => {
  const { purchasePrice, enabled } = gainTracking;

  // If gain tracking is enabled, calculate the gain or loss and return the percentage gain or loss
  if (enabled) {
    const { gainlossText, percentageGainOrLoss } = calculateGainLoss({
      gainTracking,
      currentPrice: currentQuote,
      currencyObj,
    });

    return { percent: gainlossText, perValue: parseFloat(percentageGainOrLoss.toFixed(2)) };
  }

  //if not, Calculate the percentage change in stock price on the basis of previous closing price

  const percent = !purchasePrice || purchasePrice === 0 ? null : ((currentQuote - purchasePrice) / purchasePrice) * 100;

  // Define a default value for invalid or null percent
  const DEFAULT_VALUE = -9999999;
  // Check if percent is a number, if not return default object
  if (isNaN(percent) || percent === null) return { percent: "-", perValue: DEFAULT_VALUE };

  // If percent is null, set perValue to default value, else set it to percent
  const perValue = Number(rounderNumber(percent)) ?? DEFAULT_VALUE;

  // Format the percent value for display
  const formattedPercent = formattedPercentage(aggregateTime, percent);

  return { percent: formattedPercent, perValue };
};

export const formattedPercentage = (aggregateTime, percent) =>
  `${aggregateTimeOpts[aggregateTime]} ${percent > 0 ? "+" : ""}${parseFloat(percent.toFixed(2)).toString()}%`;

/**
 * This function, `calculateProfitLossPercentage`, calculates the profit or loss percentage for a given stock.
 * It takes seven parameters: `symbol`, `currentPrice`, `gainTracking`, `getStockPreviousClosing`, `currency`, `isGBX`, and `market`.
 *
 * @param {string} symbol - The symbol of the stock.
 * @param {number} currentPrice - The current price of the stock.
 * @param {object} gainTracking - An object containing information about the gain tracking.
 * It includes properties such as `purchasePrice`, `enabled`, `noOfStocks`, `showFullAssetValue`, and `isShortSell`.
 * @param {function} getStockPreviousClosing - A function to get the previous closing price of the stock.
 * @param {object} currency - The currency in which the stock is traded.
 * It includes properties such as `code`, `symbol`, and `decimal`.
 * @param {boolean} isGBX - A flag indicating if the stock is traded in GBX (pence sterling). Default is false.
 * @param {string} market - The market in which the stock is traded. Default is null.
 *
 * @returns {object} - An object containing the percentage change and the formatted percentage change.
 * If gain tracking is enabled (`enabled` is true), the function calculates the gain or loss and returns the percentage gain or loss.
 * If not, it calculates the percentage change in stock price on the basis of the previous closing price.
 * If the calculated percentage is not a number, it returns a default object with a default value.
 */

export const calculateProfitLossPercentage: ICalculateProfitLossPercentage = async (
  symbol,
  currentPrice,
  gainTracking,
  getStockPreviousClosing,
  currency,
  isGBX = false,
  market = null,
  aggregateTime = "1d",
  manualSearch = false
) => {
  //-

  //Function declaration to get the previous day's closing price, called only if gain tracking is disabled
  const getPrevDayClosing = async () => {
    let previousDayClosing: number | false = false;
    if (market === "etf" || market === "indices") {
      previousDayClosing = await getLastDayClosingFromDB({ market, symbol, currency }, isGBX);
    }

    if (previousDayClosing === false) {
      previousDayClosing =
        market === null
          ? await getStockPreviousClosing(symbol, "", "1d", manualSearch)
          : await getStockPreviousClosing(market, symbol, aggregateTime, manualSearch);
    }

    return isGBX ? previousDayClosing / 100 : previousDayClosing;
  };

  // Determine the previous closing or purchase price based on gain tracking information
  const previousClosingOrPurchasePrice = gainTracking.isCalculateOnDaily
    ? await getPrevDayClosing()
    : gainTracking.enabled && gainTracking.purchasePrice !== null && !isNaN(gainTracking.purchasePrice)
    ? gainTracking.purchasePrice
    : await getPrevDayClosing();

  // if (!gainTracking.enabled)
  //   console.log({
  //     market,
  //     symbol,
  //     currency: currency.code,
  //     previousClosingOrPurchasePrice,
  //   });

  // Calculate the profit or loss percentage
  const _gainTracking = {
    ...gainTracking,
    purchasePrice: previousClosingOrPurchasePrice,
  };
  const calculatedPercentage = calculatePercentage(currentPrice, _gainTracking, currency, aggregateTime);

  return calculatedPercentage;
};

export const getLastDayClosingFromDB = async (quoteParams: any, isGBX: boolean) => {
  const { market, symbol, currency } = quoteParams;

  const { success, data } = await ClosingQuotes.getOne({ market, symbol, currency: currency.code });

  if (success && data !== null && data.quote !== null) {
    return isGBX ? data.quote / 100 : data.quote;
  } else {
    return false;
  }
};

const aggregateTimeOpts = {
  "1d": "1 day",
  "7d": "7 days",
  "14d": "14 days",
  "1m": "1 month",
};
