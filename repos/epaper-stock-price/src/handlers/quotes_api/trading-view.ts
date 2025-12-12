import redis from "../../services/redis";
import { TvApiAdapter } from "../../@tradingview-api-adapter";
import { GetTradingViewQuote, processTradingViewQuote } from "../quotes/trading-view";
import { IGetQuoteFromMarket, IPushQuote } from "./interfaces";
import { processCryptoQuote } from "../quotes/crypto";
import { SYMBOL_TYPE } from "../../constants";

export const GetQuoteFromTradingViewForAPI: IGetQuoteFromMarket = async (
  market,
  symbolType,
  symbol,
  currency,
  aggregateTime = "1d",
  divideBy100 = false,
  manualSearch = false
) => {
  const params = {
    symbolType,
    market,
    symbol,
    currency,
    gainTracking: {
      enabled: false,
      purchasePrice: null,
      noOfStocks: null,
      showFullAssetValue: false,
      isShortSell: false,
    },
    multiplier: { enabled: false, value: 1 },
    aggregateTime,
    unit: "",
    divideBy100,
    manualSearch,
  };

  let quote = await GetTradingViewQuoteFromRedis(params);
  if (quote.success) return { success: true, data: quote.data, error: null };

  //else get quote from Trading View Websockets
  const q = await GetQuoteFromTVWebSockets(params);

  if (q.success) {
    const _symbol = manualSearch ? symbol.replace("/", "") : symbol.replace(/[. -]/g, "_").replace("/", "");
    const key = `TV:TEMP:${market.toUpperCase()}:${_symbol}${currency}`;
    await redis.set(key, JSON.stringify(q.data), "EX", 600);

    return { success: true, data: q.data, error: null };
  }

  return {
    success: false,
    data: null,
    error: "No data found",
  };
};

const GetTradingViewQuoteFromRedis = async (params) => {
  try {
    let quote = await GetTradingViewQuote(params);

    console.log("From REDIS", { quote });

    if (quote.success) return quote;

    const { symbol, manualSearch, currency } = params;

    const _symbol = manualSearch ? symbol : symbol.replace(/[. -]/g, "_").replace("/", "");

    const tempKey = `TV:TEMP:${params.market.toUpperCase()}:${_symbol}${currency}`;
    quote = JSON.parse(await redis.get(tempKey));
    console.log("From TEMP", tempKey, { quote });

    if (quote) return { success: true, data: quote, error: null };

    return { success: false, data: null, error: "No data found" };
  } catch (error) {
    console.error("GetTradingViewQuoteFromRedis", error);
    return { success: false, data: null, error };
  }
};

//** Push Polygon Quote to the devices */
export const PushTradingViewQuote: IPushQuote = async (params) => {
  try {
    let _quote = await GetTradingViewQuoteFromRedis(params);

    if (!_quote.success && _quote?.error === "No data found") {
      console.log("No data found in db, trying to get from Trading View WS");

      _quote = await GetQuoteFromTVWebSockets(params);
    }

    const { success, data: quote } = _quote;

    const { pushObject } = params.deviceData;

    if (success) {
      const dataForDevice = {
        ...quote,
        ...pushObject,
        symbol: quote.symbol,
        currency: quote.currency,
        gainTrackingEnabled: undefined,
        purchasePrice: undefined,
        stream: undefined,
        market: undefined,
      };

      console.log("PushTradingViewQuote", { dataForDevice });

      return { success: true, dataForDevice };
    } else {
      return { success: false, dataForDevice: null };
    }
  } catch (error) {
    console.error("PushTVQuote", error);
    return { success: false, dataForDevice: null };
  }
};

interface IQuote {
  success: boolean;
  data: any;
  error: any;
}

//** Get the quote from Trading View API */
const GetQuoteFromTVWebSockets = async (params): Promise<IQuote> => {
  const { market, symbol, currency, symbolType, manualSearch } = params;

  const _symbol = manualSearch ? symbol : symbol.replace(/[. -]/g, "_").replace("/", "");

  const qSymbol = market.toLowerCase() === "crypto" ? `${_symbol.replace("/", "")}USD` : _symbol;

  const marketAndSymbol = `${market}:${qSymbol}`;

  console.log("GetQuoteFromTVWebSockets", { marketAndSymbol });

  let adapter = new TvApiAdapter();

  let quote = {
    success: false,
    data: null,
    error: null,
  };
  const exChannel = adapter.QuoteChannel([marketAndSymbol], ["lp", "chp", "prev_close_price"]);

  let _quoteResponse;
  exChannel.listen(async (data) => {
    const key = `${marketAndSymbol}`;

    _quoteResponse = { ..._quoteResponse, ...data[key] };

    if (_quoteResponse === undefined || !_quoteResponse.lp) {
      quote = {
        success: false,
        data: null,
        error: `No data for symbol ${_symbol} found`,
      };
    } else {
      const q = {
        price: Number(_quoteResponse.lp.toString()),
        prev_close_price: Number(_quoteResponse.prev_close_price.toString()),
        changePer: Number(_quoteResponse.chp.toString()) ?? -1,
        timestamp: Date.now(),
      };

      if (symbolType === SYMBOL_TYPE.CRYPTO) {
        quote = await processCryptoQuote(params, q);
      } else {
        quote = await processTradingViewQuote(params, q);
      }
    }
  });

  return new Promise((resolve) => {
    setTimeout(() => {
      adapter = null;
      exChannel.destroy();

      resolve(quote); // Resolves the promise with the value after the delay
    }, 3000);
  });
};
