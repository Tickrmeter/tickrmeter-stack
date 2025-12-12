import { TvApiAdapter } from "../../@tradingview-api-adapter";
import { IGetQuoteFromMarket } from "./interfaces";
import { GetFinageQuote } from "../quotes/finage";
import { IPushQuote } from "./interfaces";
import { DATA_MARKETS } from "../../constants";
import { isMarketAllowedForTradingView } from "../quotes/helper";

//import { getStockData, getCryptoData, getForexData, getIndiceOrETFData } from "./../quotes/finage";

export const GetQuoteFromFinage: IGetQuoteFromMarket | any = async (
  market,
  symbolType,
  symbol,
  currency,
  aggregateTime = "1d",
  divideBy100 = false
) => {
  const params = {
    symbolType,
    market,
    symbol,
    gainTracking: {
      enabled: false,
      purchasePrice: null,
      noOfStocks: null,
      showFullAssetValue: false,
      isShortSell: false,
    },
    currency,
    multiplier: { enabled: false, value: 1 },
    aggregateTime,
    unit: "",
    divideBy100,
  };

  let quote = await GetFinageQuote(params);

  console.log("GetQuoteFromFinageAPI", { quote });

  if (!quote.success && quote.error === "No data found") {
    console.log("No data found in db, trying to get from Trading View");

    const q = await getQuoteFromTV(market, symbol);
    if (q.success) return q;
  }

  return {
    success: quote.success,
    data: quote.data,
    error: quote.error,
  };
};

const getQuoteFromTV = async (market, symbol) =>
  isMarketAllowedForTradingView(market)
    ? await GetQuoteFromTVWebSockets(market, symbol)
    : { success: false, data: null, error: "Trading View not enabled for this market" };

//** Push Polygon Quote to the devices */
export const PushFinageQuote: IPushQuote = async (params) => {
  try {
    let _quote = await GetFinageQuote(params);

    const { market, symbol } = params;

    if (!_quote.success && _quote.error === "No data found") {
      console.log("No data found in db, trying to get from Trading View");

      _quote = await getQuoteFromTV(market, symbol);
    }

    const { success, data: quote } = _quote;

    const { pushObject } = params.deviceData;

    if (success) {
      const dataForDevice = {
        ...quote,
        ...pushObject,
        symbol: params.symbolType === 3 ? quote.symbol : quote.symbol, //! Temporary fix for symbol length
        currency: params.symbolType === 3 ? undefined : quote.currency,
        gainTrackingEnabled: undefined,
        purchasePrice: undefined,
        stream: undefined,
        market: undefined,
      };

      return { success: true, dataForDevice };
    } else {
      return { success: false, dataForDevice: null };
    }
  } catch (error) {
    console.error("PushFinageQuote", error);
    return { success: false, dataForDevice: null };
  }
};

const marketExchangeMapping = {
  [DATA_MARKETS.DK_STOCKS]: "OMXCOP",
};

interface IQuote {
  success: boolean;
  data: any;
  error: any;
}

//** Get the quote from Trading View API */
const GetQuoteFromTVWebSockets = async (market: string, symbol: string): Promise<IQuote> => {
  const marketAndSymbol = `${marketExchangeMapping[market]}:${symbol}`;

  let adapter = new TvApiAdapter();

  let quote = {
    success: false,
    data: null,
    error: null,
  };
  const exChannel = adapter.QuoteChannel([marketAndSymbol], ["lp", "chp"]);

  exChannel.listen((data) => {
    const key = `finage:${market}:${symbol.replace(/[. -]/g, "_")}`;
    console.log(key, data[key]);
    const _q = data[key];

    if (_q === undefined) {
      quote = {
        success: false,
        data: null,
        error: `No data for symbol ${symbol} found`,
      };
    } else {
      quote = {
        success: true,
        data: {
          symbol,
          price: _q?.lp.toString(),
          p: _q.lp,
          percent: `1 day ${_q.chp}%`,
          perValue: _q.chp,
          date: Date.now(),
          name: symbol,
          currency: "DKK",
        },
        error: null,
      };
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
