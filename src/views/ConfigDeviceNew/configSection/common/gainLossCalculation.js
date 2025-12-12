import {
  currencyList,
  emptyCurrencyObj,
  formatNumberToMagnitude,
  ignoredCurrencySymbols,
  roundNumber,
} from "../../helper";

/**
 * Calculates the percentage gain or loss of a stock transaction.
 *
 * @param {Object} params - The parameters for the calculation.
 * @param {number|string} params.purchasePrice - The purchase price of the stock.
 * @param {number|string} params.noOfStocks - The number of stocks purchased.
 * @param {boolean} params.isShortSell - Whether the transaction is a short sell.
 *
 * @param {number} params.currentPrice - The current price of the stock.
 *
 * @returns {number|null} The percentage gain or loss of the transaction, or null if the input is invalid.
 */
const calculateStockProfit = ({ purchasePrice, noOfStocks, isShortSell, currentPrice }) => {
  // Parse the purchase price and number of stocks as floats and integers respectively

  const parsedPurchasePrice = parseFloat(purchasePrice);
  const parsedNoOfStocks = parseFloat(noOfStocks || "1");

  // If either the purchase price or number of stocks is not a number or less than zero, return null
  if (isNaN(parsedPurchasePrice) || isNaN(parsedNoOfStocks) || parsedPurchasePrice < 0 || parsedNoOfStocks < 0) {
    return null;
  }

  // Calculate the gain or loss
  // If it's a short sell, subtract the current price from the purchase price
  // Otherwise, subtract the purchase price from the current price
  // Multiply by the number of stocks
  const gainOrLoss =
    (isShortSell ? parsedPurchasePrice - currentPrice : currentPrice - parsedPurchasePrice) * parsedNoOfStocks;

  // Calculate the percentage gain or loss
  const percentageGainOrLoss = (gainOrLoss / (parsedPurchasePrice * parsedNoOfStocks)) * 100;

  // Return the percentage gain or loss
  return percentageGainOrLoss;
};

/**
 * Calculates the gain or loss for a given currency.
 *
 * @param {Object} params - The parameters for the function.
 * @param {Object} params.gainTracking - An object containing information about the gain tracking.
 * @param {number} params.currentPrice - The current price of the currency.
 * @param {string} params.currency - The code of the currency.
 * @returns {Object} An object containing the gain or loss text and the percentage gain or loss.
 */
export const calculateGainLoss = ({ gainTracking, currentPrice, currency }) => {
  const { purchasePrice, noOfStocks, showFullAssetValue, isShortSell } = gainTracking;

  // Calculate the percentage gain or loss
  const percentageGainOrLoss = calculateStockProfit({
    purchasePrice,
    noOfStocks,
    isShortSell,
    currentPrice,
  });

  // If there's no percentage gain or loss, exit the function
  if (!percentageGainOrLoss) return { gainlossText: "", percentageGainOrLoss: -9999999 };

  // Determine if the percentage gain or loss is a loss
  const isLoss = percentageGainOrLoss < 0;

  // Get the currency object or empty currency object
  const currencyObj = currencyList.find((c) => c.code === currency) || emptyCurrencyObj;

  // Format the percentage gain or loss text
  const gainlossText = `${isLoss ? "" : "+"}${roundNumber(percentageGainOrLoss, currencyObj.decimal)}%`;

  // Start building the final text with either "Loss" or "Profit"
  let finalText = `${isLoss ? "Loss" : "Profit"} ${gainlossText}`;

  // If there are stocks
  if (noOfStocks !== "") {
    // Calculate the profit
    let profit = showFullAssetValue ? currentPrice * noOfStocks : (currentPrice - purchasePrice) * noOfStocks;
    // If it's a short sell, invert the profit
    profit = isShortSell ? profit * -1 : profit;

    // Determine if the profit is negative
    const isNegative = profit < 0;

    // Get the absolute value of the profit
    const positiveProfit = Math.abs(profit);

    // Format the profit value and unit
    const roundedProfit = formatNumberToMagnitude(positiveProfit, currencyObj.decimal);

    const currencySymbol = ignoredCurrencySymbols.includes(currency) ? "" : currencyObj.symbol || "";

    // Format the profit text
    const profitText = `${isNegative ? "-" : ""}${roundedProfit}`;

    // Update the final text with the profit and gain/loss text
    finalText = `${currencySymbol}${profitText} (${gainlossText})`;
  }

  return { gainlossText: finalText, percentageGainOrLoss };
};
