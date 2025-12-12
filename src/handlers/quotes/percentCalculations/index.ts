import ClosingQuotes from "../../../models/closing-quotes";
import { rounderNumber } from "../helper";
import { ICalculatePercentage, ICalculateProfitLossPercentage, ICurrency, IGainTracking } from "../helper/interfaces";
import { calculateGainLoss } from "./gainLossCalculation";
/**
 * Extracted function to handle gain tracking calculations.
 *
 * @param currentQuote - The current price of the asset.
 * @param gainTracking - Configuration for gain tracking containing purchasePrice and enabled flag.
 * @param currencyObj - An object representing the currency (e.g., { symbol: "$" }).
 * @returns An object containing the formatted percentage string, the raw percentage value,
 *          the purchase price, and a formatted price difference string.
 */
const calculateGainTrackingResult = (currentQuote: number, gainTracking: IGainTracking, currencyObj: ICurrency) => {
  const { gainlossText, percentageGainOrLoss } = calculateGainLoss({
    gainTracking,
    currentPrice: currentQuote,
    currencyObj,
  });

  return {
    formattedPercentage: gainlossText,
    perValue: parseFloat(percentageGainOrLoss.toFixed(2)),
    priceDiff: gainTracking.purchasePrice,
    formattedPriceDiff: "",
  };
};
/**
 * Calculates the raw percentage change based on the current price and purchase price.
 *
 * @param currentQuote - The current price of the asset.
 * @param purchasePrice - The price at which the asset was purchased.
 * @returns The percentage change, or null if purchasePrice is zero or falsy.
 */
export const calculateRawPercentage = (currentQuote: number, purchasePrice: number): number | null => {
  if (!purchasePrice || purchasePrice === 0) {
    return null;
  }
  return ((currentQuote - purchasePrice) / purchasePrice) * 100;
};

/**
 * Calculates the percentage gain or loss for an asset.
 *
 * When gain tracking is enabled, it delegates the calculation to calculateGainTrackingResult.
 * Otherwise, it computes the percentage change based on the purchase price.
 *
 * @param currentQuote - The current price of the asset.
 * @param gainTracking - Configuration for gain tracking containing purchasePrice and enabled flag.
 * @param currencyObj - An object representing the currency (e.g., { symbol: "$" }).
 * @param aggregateTime - A key to fetch the time label from aggregateTimeOpts, defaults to "1d".
 * @returns An object containing the formatted percentage string, the raw percentage value,
 *          the purchase price, and a formatted price difference string.
 */
export const calculatePercentage: ICalculatePercentage = (
  currentQuote,
  gainTracking,
  currencyObj,
  aggregateTime = "1d"
) => {
  const { purchasePrice, enabled } = gainTracking;

  // Handle gain tracking scenario using the extracted function.
  if (enabled) return calculateGainTrackingResult(currentQuote, gainTracking, currencyObj);

  if (purchasePrice === null || isNaN(purchasePrice)) {
    return { perValue: -9999999, priceDiff: -999999, formattedPriceDiff: "", formattedPercentage: "-" };
  }

  // Calculate the price difference.
  const priceDiff = currentQuote - purchasePrice;
  // Calculate the raw percentage change using the helper function.
  const rawPercentage = calculateRawPercentage(currentQuote, purchasePrice);

  // Define default value for invalid or null percentage.
  const DEFAULT_VALUE = -9999999;
  if (rawPercentage === null || isNaN(rawPercentage)) {
    return {
      formattedPercentage: "-",
      perValue: DEFAULT_VALUE,
      priceDiff: purchasePrice,
      formattedPriceDiff: "",
    };
  }

  // Round the calculated percentage change.
  const perValue = Number(rounderNumber(rawPercentage)) ?? DEFAULT_VALUE;
  // Format the resulting percentage and price difference using a dedicated formatting function.
  const { formattedPercentage, formattedPriceDiff } = formatAggregateData(
    aggregateTime,
    perValue,
    priceDiff,
    currencyObj
  );

  return {
    perValue,
    priceDiff: purchasePrice,
    formattedPercentage,
    formattedPriceDiff,
  };
};

// /**
//  * This function, `calculatePercentage`, calculates the percentage change in a stock's price.
//  * It takes three parameters: `currentQuote`, `gainTracking`, and `currency`.
//  *
//  * @param {number} currentQuote - The current price of the stock.
//  * @param {object} gainTracking - An object containing information about the gain tracking.
//  * It includes properties such as `purchasePrice`, `enabled`, `noOfStocks`, `showFullAssetValue`, and `isShortSell`.
//  * @param {object} currency - The currency in which the stock is traded.
//  * It includes properties such as `code`, `symbol`, and `decimal`.
//  *
//  * @returns {object} - An object containing the percentage change and the formatted percentage change.
//  * If gain tracking is enabled (`enabled` is true), the function calculates the gain or loss and returns the percentage gain or loss.
//  * If not, it calculates the percentage change in stock price on the basis of the previous closing price.
//  * If the calculated percentage is not a number, it returns a default object with a default value.
//  */
// export const calculatePercentage: ICalculatePercentage = (
//   currentQuote,
//   gainTracking,
//   currencyObj,
//   aggregateTime = "1d"
// ) => {
//   const { purchasePrice, enabled } = gainTracking;

//   // If gain tracking is enabled, calculate the gain or loss and return the percentage gain or loss
//   if (enabled) {
//     const { gainlossText, percentageGainOrLoss } = calculateGainLoss({
//       gainTracking,
//       currentPrice: currentQuote,
//       currencyObj,
//     });

//     return {
//       percent: gainlossText,
//       perValue: parseFloat(percentageGainOrLoss.toFixed(2)),
//       priceDiff: purchasePrice,
//       formattedPriceDiff: "",
//     };
//   }

//   //if not, Calculate the percentage change in stock price on the basis of previous closing price

//   const priceDiff = currentQuote - purchasePrice;
//   //const percent = !purchasePrice || purchasePrice === 0 ? null : ((currentQuote - purchasePrice) / purchasePrice) * 100;

//   const rawPercentage =
//     !purchasePrice || purchasePrice === 0 ? null : ((currentQuote - purchasePrice) / purchasePrice) * 100;

//   // Define a default value for invalid or null percent
//   const DEFAULT_VALUE = -9999999;
//   // Check if percent is a number, if not return default object
//   if (isNaN(percent) || percent === null)
//     return { percent: "-", perValue: DEFAULT_VALUE, priceDiff: purchasePrice, formattedPriceDiff: "" };

//   // If percent is null, set perValue to default value, else set it to percent
//   const perValue = Number(rounderNumber(percent)) ?? DEFAULT_VALUE;

//   // Format the percent value for display
//   //const formattedPercent = formattedPercentage(aggregateTime, percent);

//   const { formattedPercentage, formattedPriceDiff } = formatAggregateData(
//     aggregateTime,
//     perValue,
//     priceDiff,
//     currencyObj
//   );

//   return { percent: formattedPercentage, perValue, priceDiff: purchasePrice, formattedPriceDiff };
// };

// export const formattedPercentage = (aggregateTime, percent) =>
//   `${aggregateTimeOpts[aggregateTime]} ${percent > 0 ? "+" : ""}${parseFloat(percent.toFixed(2)).toString()}%`;

// export const formattedLastPrice = (aggregateTime, lastPrice, currency) =>
//   `${aggregateTimeOpts[aggregateTime]} ${lastPrice > 0 ? "+" : ""}${parseFloat(lastPrice.toFixed(2)).toString()} ${
//     currency.symbol
//   }`;

export const formatAggregateData = (
  aggregateTime: string,
  percent: number,
  priceDiff: number,
  currency: { symbol: string }
) => {
  // Retrieve the label based on the aggregate time option.
  const timeLabel = aggregateTimeOpts[aggregateTime];

  // Format the percentage by ensuring two decimals and prefixing a '+' if the value is positive.
  const percentSign = percent > 0 ? "+" : "";
  const formattedPercentage = `${timeLabel} ${percentSign}${percent.toFixed(2)}%`;

  const _fixedPriceDiff = Number(priceDiff.toFixed(2));
  const _fixedPercent = Number(percent.toFixed(2));

  // Format the lastPrice by ensuring two decimals and prefixing a '+' if the value is positive.
  const priceSign = priceDiff > 0 ? "+" : "";
  const formattedPriceDiff = `${timeLabel} ${currency.symbol} ${priceSign}${priceDiff.toFixed(2)}`;

  return { formattedPercentage, formattedPriceDiff, priceDiff: _fixedPriceDiff, perValue: _fixedPercent };
};

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

    return isGBX && typeof previousDayClosing === "number" ? previousDayClosing / 100 : previousDayClosing;
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

  const closingQuotes = new ClosingQuotes();
  const { success, data } = await closingQuotes.getOne({ market, symbol, currency: currency.code });

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
