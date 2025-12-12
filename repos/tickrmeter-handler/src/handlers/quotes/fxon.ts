import redis from "../../services/redis";
import { IGetQuoteFromAPIParams, ITickrResponse } from "./helper/interfaces";
import { calculateProfitLossPercentage, formatAggregateData } from "./percentCalculations";
import { allowedCurrencySigns, currencyList, emptyCurrencyObj, getFormattedNumber } from "./helper";

//** ====================== TRADING VIEW API========================================== */
export const GetFXONQuote = async (params) => {
  const { market, symbol, manualSearch } = params;

  const _symbol = manualSearch ? symbol.replace("/", "") : symbol.replace(/[. -]/g, "_").replace("/", "");

  const key = `FXON:TICKER:${_symbol}`;

  const data = await redis.get(key);

  const { lp: price, chp, ts, name, type, prev_close_price, currency } = JSON.parse(data);

  //**  Override currency from the data from API */
  params.currency = currency;

  const response = {
    price,
    prev_close_price,
    changePer: chp ?? -1,
    timestamp: ts,
    name,
    type,
  };

  return await processFXONQuote(params, response);
};

interface IQuoteResponse {
  price: number;
  prev_close_price: number;
  changePer?: number;
  timestamp: number;
  name?: string;
  type?: string;
}

export const processFXONQuote = async (params: IGetQuoteFromAPIParams, quoteData: IQuoteResponse) => {
  try {
    const { symbol, gainTracking, currency, divideBy100, market, aggregateTime, symbolType, multiplier, manualSearch } =
      params;

    const { price: pr, timestamp, name: symbolUI, type } = quoteData;

    // const { price, priceInFloat, _currency } = GetFormatedPrice({
    //   pr,
    //   currency,
    //   divideBy100,
    //   multiplier,
    // });

    //const _curr = allowedCurrencySigns.includes(_currency?.code) ? { symbol: _currency.symbol } : { symbol: "" };
    //console.log("processFXONQuote", { currency, _currency, _curr });
    const priceInFloat = parseFloat(pr.toString());
    const { formattedPercentage, formattedPriceDiff, priceDiff, perValue } =
      gainTracking.enabled || quoteData.changePer === -1
        ? await calculateProfitLossPercentage(
            symbol,
            priceInFloat,
            gainTracking,
            getStockPreviousClosing,
            emptyCurrencyObj,
            divideBy100 ?? false,
            market,
            aggregateTime,
            manualSearch
          )
        : formatAggregateData(
            "1d",
            quoteData.changePer,
            quoteData.prev_close_price - quoteData.price,
            emptyCurrencyObj
          );
    //GetFormattedPercentage("1d", quoteData.changePer);

    const tickrResponse: ITickrResponse = {
      symbol,
      price: pr.toString(),
      p: priceInFloat,
      percent: formattedPercentage,
      perValue,
      pd: priceDiff,
      priceDiff: formattedPriceDiff,
      date: timestamp * 1000,
      name: symbolUI || symbol || undefined,
      currency: "",
    };

    return { success: true, data: tickrResponse, error: null };
  } catch (error) {
    console.error("processTradingViewQuote", error);
    return { success: false, data: null, error: "Error processing quote" };
  }
};


interface IGetFormatedPrice {
  pr: number;
  currency: string;
  divideBy100: boolean;
  multiplier: { enabled: boolean; value: number };
}

export const GetFormatedPrice = (params: IGetFormatedPrice) => {
  const { pr, currency, divideBy100, multiplier } = params;

  const quote = parseFloat(pr.toString());

  const _currency =
    currencyList.find(
      (c) => c.code.toLowerCase() === (currency === "GBp" && !divideBy100 ? "GBX" : currency).toLowerCase()
    ) || emptyCurrencyObj;

  const _curr = allowedCurrencySigns.includes(_currency?.code) ? _currency.symbol : "";

  let priceInFloat = multiplier.enabled ? quote * multiplier.value : quote;
  priceInFloat = divideBy100 ? priceInFloat / 100 : priceInFloat;

  const price = _curr + getFormattedNumber(priceInFloat, _currency.decimal);

  return { price, priceInFloat, _currency };
};

const getStockPreviousClosing = async (market, symbol, aggregateTime = "1d", manualSearch): Promise<number> => {
  let _previousClosingPrice = undefined;
  const _symbol = manualSearch ? symbol.replace("/", "") : symbol.replace(/[. -]/g, "_").replace("/", "");
  const key = `PCP:FXON:${market.toUpperCase()}:${_symbol}`;
  const data = await redis.get(key);
  // console.log("getStockPreviousClosing", { key, data });
  _previousClosingPrice = data;
  return _previousClosingPrice;
};
