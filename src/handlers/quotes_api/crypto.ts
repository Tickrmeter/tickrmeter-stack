import { DATA_MARKETS, DATA_STREAM, SYMBOL_TYPE } from "../../constants";
import { GetCryptoQuote, GetQuoteFromCoinGecko, processCryptoQuote } from "../quotes/crypto";

import { IGetQuoteFromMarketObj, IPushQuote } from "../quotes_api/interfaces";
import { GetQuoteFromTradingViewForAPI } from "../quotes_api/trading-view";
import { coinsById } from "../quotes/helper";

export const GetCryptoQuoteAPI: IGetQuoteFromMarketObj = async (params) => {
  //1st we try to get the quote from tradingview api

  const { stream, market, symbolType, symbol, currency, manualSearch } = params;

  console.log("We here ... ");
  let quote = null;
  // Check if manual search is requested
  if (manualSearch) {
    console.log("Manual search requested for crypto:", symbol);
    // TODO: Implement manual search functionality
    // This is a placeholder for the actual manual
    //  search implementation

    switch (stream) {
      case DATA_STREAM.TRADINGVIEW:
        quote = await GetQuoteFromTradingViewForAPI(market, symbolType, symbol, currency);
        break;
      case DATA_STREAM.COINGECKO:
        quote = await GetCryptoQuote({
          market: DATA_MARKETS.CRYPTO,
          symbolType: SYMBOL_TYPE.CRYPTO,
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
          aggregateTime: "1d",
          unit: "",
          manualSearch: true,
        });

        break;
      default:
        break;
    }
  } else {
    const _symbol = coinsById[symbol.toLowerCase()]?.symbol?.toUpperCase();

    quote = await GetQuoteFromTradingViewForAPI(market, symbolType, _symbol, currency);

    if (quote.success && quote.data?.lp) {
      const { lp: price, chp, ts, name, type } = quote.data;

      const response = {
        price,
        changePer: chp ?? -1,
        timestamp: ts,
        name,
        type,
      };

      quote = await processCryptoQuote(
        {
          ...params,
          gainTracking: {
            enabled: false,
            purchasePrice: null,
            noOfStocks: null,
            showFullAssetValue: false,
            isShortSell: false,
          },
          multiplier: { enabled: false, value: 1 },
        },
        response
      );
    } else {
      quote = await GetCryptoQuote({
        market: DATA_MARKETS.CRYPTO,
        symbolType: SYMBOL_TYPE.CRYPTO,
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
        aggregateTime: "1d",
        unit: "",
      });
    }
  }

  return {
    success: quote.success,
    data: quote.data,
    error: quote.error,
  };
};

export const PushCryptoQuote: IPushQuote = async (params) => {
  const { success, data: quote } = await GetCryptoQuote(params);

  console.log("PushCryptoQuote", { success, quote });

  const { pushObject } = params.deviceData;

  if (success) {
    const dataForDevice = {
      ...quote,
      ...pushObject,
      symbol: quote.symbol,
      gainTrackingEnabled: undefined,
      purchasePrice: undefined,
    };

    return { success: true, dataForDevice };
  } else {
    return { success: false, dataForDevice: null };
  }
};
