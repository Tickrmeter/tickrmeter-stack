import { DATA_MARKETS, DATA_STREAM, SYMBOL_TYPE } from "../../../constants";
import { IDevice } from "../../../models/interfaces";
import { GetPolygonQuote } from "../polygon";
import { GetFinageQuote } from "../finage";
import { GetCoinGeckoQuote } from "../coingecko";
import { GetCommodityAPIQuoteDB } from "../commodities-api";
import { IGetQuoteParams } from "./interfaces";
import config from "../../../conf";
import { GetTradingViewQuote } from "../trading-view";
import { GetCryptoQuote } from "../crypto";
const debugDevices = config?.app?.debugDevices.split(",") || [];

export const getSymbolsOnCycleMode = async (
  symbols: IDevice["playlist"]["symbols"],
  cycleMode: string,
  isCalculateOnDaily: boolean,

  deviceMac: string
) => {
  if (cycleMode === "default" || cycleMode === undefined || cycleMode === null) return symbols[0];

  //loop through all symbols and get the quotes value and then sort the array on the basis of percentage value

  const quotes = (
    await Promise.all(
      symbols.map(async (s) => {
        const params: IGetQuoteParams = {
          ...s,
          market: s?.market || DATA_MARKETS.US_STOCKS,
          gainTracking: {
            enabled: s.gainTrackingEnabled || false,
            purchasePrice: s.purchasePrice || 0,
            noOfStocks: s.noOfStocks || 1,
            showFullAssetValue: s.showFullAssetValue || false,
            isShortSell: s.isShortSell || false,
            isCalculateOnDaily: isCalculateOnDaily || false,
          },

          multiplier: { enabled: s.multiplierEnabled, value: s.multiplier || 1 },
          aggregateTime: s?.extraConfig?.aggregateTime || "1d",
          unit: s?.extraConfig?.unit || "",
          divideBy100: s?.extraConfig?.divideBy100 || false,
        };

        console.log({ stream: s.stream, symbol: s.symbol });

        switch (s.stream) {
          case DATA_STREAM.POLYGON:
            //add stream to data
            return GetPolygonQuote(params).then((q) => ({
              ...q,
              data: { ...q.data, stream: DATA_STREAM.POLYGON },
            }));
          case DATA_STREAM.TRADINGVIEW:
            return s.symbolType === SYMBOL_TYPE.CRYPTO
              ? GetCryptoQuote(params).then((q) => ({
                  ...q,
                  data: { ...q.data, stream: DATA_STREAM.COINGECKO },
                }))
              : GetTradingViewQuote(params).then((q) => ({
                  ...q,
                  data: { ...q.data, stream: DATA_STREAM.TRADINGVIEW },
                }));

          case DATA_STREAM.FINAGE:
            return GetFinageQuote(params).then((q) => ({
              ...q,
              data: { ...q.data, stream: DATA_STREAM.FINAGE },
            }));

          case DATA_STREAM.COINGECKO:
            return GetCryptoQuote(params).then((q) => ({
              ...q,
              data: { ...q.data, stream: DATA_STREAM.COINGECKO },
            }));

          case DATA_STREAM.COMMODITES:
            return GetCommodityAPIQuoteDB(params).then((q) => ({
              ...q,
              data: { ...q.data, stream: DATA_STREAM.COMMODITES },
            }));

          default:
            return null;
        }
      })
    )
  )
    .filter((q) => q !== null && q.success)
    .map((q) => q.data);

  console.table(quotes);

  if (quotes.length === 0) {
    console.log("There is some issue with quotes, returning the first symbol");
    return symbols[0];
  }

  //debugging
  if (debugDevices.includes(deviceMac)) {
    console.log(` ------------ 0. getSymbolsOnCycleMode-quotes ${deviceMac} - ${cycleMode}---------------`);
    console.log("symbols", symbols);
    console.log("quotes", quotes);
  }

  //sort the array on the basis of perValue and best/worst gain then find the first element in symbols and return
  const sortedQuotes = quotes.sort((a, b) => b.perValue - a.perValue);
  console.table(sortedQuotes);

  //debugging
  if (debugDevices.includes(deviceMac)) {
    console.log(` ------------ 1. getSymbolsOnCycleMode-sortedQuotes ${deviceMac} - ${cycleMode}---------------`);
    console.log("sortedQuotes", sortedQuotes);
  }

  const selectedQuote = cycleMode === "best" ? sortedQuotes[0] : sortedQuotes[sortedQuotes.length - 1];

  //  console.log({ selectedQuote });

  const symbol = symbols.find((s) => {
    if (s.stream !== selectedQuote.stream) return false;

    //if (s.stream === "coingecko") return s.symbol === selectedQuote.name;

    return s.symbol === selectedQuote.symbol;
  });

  //debugging
  if (debugDevices.includes(deviceMac)) {
    console.log(` ------------ 2. getSymbolsOnCycleMode-symbols ${deviceMac} - ${cycleMode}---------------`);
    console.log("symbol", symbol);
  }

  console.log("before:", symbols, selectedQuote);

  return symbol;
};
