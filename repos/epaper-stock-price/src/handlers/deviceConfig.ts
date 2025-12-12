import express from "express";
import redis from "../services/redis";

import { publishData } from "../services/mqtt";

import { MSG_TYPES, DATA_STREAM, SYMBOL_TYPE_OBJ, SYMBOL_TYPE, BACKEND_URL } from "../constants";

import { sendErrorResponse, sendResponse } from "./utils";

import { IPlaylist, IPlaylistConfig, ISingleConfig, IUserReq } from "../models/interfaces";
import PlaylistModel from "../models/playlist";
import DeviceModel from "../models/device";
import UserModel from "../models/user";

import { GetQuoteFromPolygon, PushPolygonQuote } from "./quotes_api/polygon";
import { GetQuoteFromFinage } from "./quotes_api/finage";
//import { GetQuoteFromCoinGecko, PushCoinGeckoQuote } from "./quotes_api/coingecko";
import { GetQuoteFromCommoditiesAPI, PushCommodityAPIQuote } from "./quotes_api/commodities-api";
//import { GetQuoteFromTop10, PushLocalTop10Quote } from "./quotes/top10";
import { getSymbolsOnCycleMode } from "./quotes/helper/playlistCycleMode";

import { GetQuoteFromElectricityPrices, PushElectricityPricesQuote } from "./quotes_api/electricity";
import QuoteCollectorModel, { IMarketSymbol } from "../models/quoteCollector";
import { formatDate } from "./quotes/helper";
import etfs from "./search/finage/etfs.json";
//import indices from "./search/finage/indices.json";
import { GetDataFromCustomAPI, PushDataFromCustomAPI } from "./quotes_api/custom-api";
import { GetQuoteFromTradingViewForAPI, PushTradingViewQuote } from "./quotes_api/trading-view";
import { GetCryptoQuoteAPI, PushCryptoQuote } from "./quotes_api/crypto";
import { PushHumbl3Data } from "./quotes_api/humbl3";
import usIndicesTV from "./jsonFiles/us_indices_tv.json";
import { IGetQuoteFromMarketObjParms, IPushQuote, IPushQuoteParams } from "./quotes_api/interfaces";
//import { GetCryptoQuote } from "./quotes/crypto_zzz";

//** ========== ===================================================================================== =========  **/
//** ========== New Functions for the new APIs integration which allows streams and market properties =========  **/
//** ========== ===================================================================================== =========  **/

export const searchSymbolsNew = async (req: express.Request, res: express.Response) => {
  try {
    const rUser = req.user as IUserReq;

    const { success: userSuccess, data: user } = await UserModel.getById(rUser.userId);

    if (!userSuccess) return sendErrorResponse(res);

    const { stream, market, type, symbol, currency, unit, aggregateTime, divideBy100, manualSearch } = req.body;

    if (!stream && !market && !type && !symbol && !currency) return sendErrorResponse(res, "Invalid request", 1);

    if (!stream) return sendErrorResponse(res, "No stream found", 1);

    if (!market) return sendErrorResponse(res, "No market found", 1);

    if (!type || isNaN(type)) return sendErrorResponse(res, "No type found", 1);

    if (!symbol) return sendErrorResponse(res, "No search query found", 1);

    if (!currency) return sendErrorResponse(res, "No currency found", 1);

    let result;

    // req.body.market = "dk";
    // req.body.stream = "finage";

    //console.log(stream, req.body);

    const paramsObj: IGetQuoteFromMarketObjParms = {
      stream,
      market,
      symbolType: type,
      symbol,
      currency,
      unit,
      divideBy100,
      manualSearch,
    };

    switch (stream) {
      case DATA_STREAM.POLYGON:
        if (type === SYMBOL_TYPE.INDICES) {
          const _market = GetUSIndicesMarketForTV(symbol);
          if (!_market) return sendErrorResponse(res, "Unable to find Index", 1);
          console.log("~~ US Indices from TradingView ~~", `${_market}:${symbol}`);
          result = await GetQuoteFromTradingViewForAPI(
            _market,
            type,
            symbol,
            currency,
            "1d",
            divideBy100,
            manualSearch
          );
        } else {
          result = await GetQuoteFromPolygon(market, type, symbol, currency);
        }
        break;
      case DATA_STREAM.FINAGE:
        result = await GetQuoteFromFinage(market, type, symbol, currency, aggregateTime, divideBy100);
        break;
      case DATA_STREAM.COINGECKO:
        result = await GetCryptoQuoteAPI({ ...paramsObj, symbolType: 2 });
        break;
      case DATA_STREAM.COMMODITES:
        result = await GetQuoteFromCommoditiesAPI(market, type, symbol, currency, unit);
        break;
      // case DATA_STREAM.LOCALTOP10:
      //   return GetQuoteFromTop10(market, type, symbol, currency, user.timeZone, res);
      //   break;
      case DATA_STREAM.ELECTRICITY:
        result = await GetQuoteFromElectricityPrices(market, symbol, currency);
        break;
      case DATA_STREAM.TRADINGVIEW:
        if (type === SYMBOL_TYPE.CRYPTO) {
          result = await GetCryptoQuoteAPI({ ...paramsObj, symbolType: 2 });
        } else {
          result = await GetQuoteFromTradingViewForAPI(market, type, symbol, currency, "1d", divideBy100, manualSearch);
        }

        break;
      case DATA_STREAM.CUSTOMAPI:
        result = await GetDataFromCustomAPI(symbol);
        break;
      default:
        //        return sendErrorResponse(res, "Invalid stream", 1);
        result = { success: false, error: "Invalid stream", data: null };
        break;
    }

    const { success, error, data } = result;

    const errorType = stream === DATA_STREAM.TRADINGVIEW && symbol.includes(".") ? 2 : 1;

    if (!success) return sendErrorResponse(res, error, errorType);

    // if (stream !== DATA_STREAM.ELECTRICITY && type !== SYMBOL_TYPE.OPTIONS) {
    //   data.date = formatDate(data.date, user.timeZone, user.timeFormat);
    // } else {
    //   data.url = `${BACKEND_URL}/api/pages/${data.pageId}?type=png`;
    // }

    switch (type) {
      case SYMBOL_TYPE.ELECTRICITY:
        data.url = `${BACKEND_URL}/api/pages/${data.pageId}?type=png`;
        break;
      case SYMBOL_TYPE.OPTIONS:
      case SYMBOL_TYPE.CUSTOMAPI:
        // Do nothing
        break;
      default:
        data.date = formatDate(data.date, user.timeZone, user.timeFormat);
        break;
    }

    // if (stream !== DATA_STREAM.ELECTRICITY && type !== SYMBOL_TYPE.OPTIONS) {
    //   data.date = formatDate(data.date, user.timeZone, user.timeFormat);
    // } else if (stream === DATA_STREAM.ELECTRICITY) {
    //   data.url = `${BACKEND_URL}/api/pages/${data.pageId}?type=png`;
    // }

    return success ? sendResponse(true, "STOCK_PRICE", data, res) : sendErrorResponse(res, error, 1);

    //
  } catch (error) {
    console.error("Error in SearchSymbol==>", error);
    sendErrorResponse(res);
  }
};

const GetUSIndicesMarketForTV = (symbol: string) => usIndicesTV.find((f) => f.symbol === symbol)?.market || null;

const mqttTopicsForSymbolSubscriptions = {
  [DATA_STREAM.TRADINGVIEW]: "ON_TV_SYMBOL_SUBSCRIBE",
  [DATA_STREAM.POLYGON]: "ON_POLYGON_SYMBOL_SUBSCRIBE",
};

export const pushToDeviceNew = async (req: express.Request, res: express.Response) => {
  try {
    //    console.log(req.body);
    const rUser = req.user as IUserReq;
    let { isPlaylist, playlistId, deviceId, extras, type } = req.body;

    //console.log(req.body);

    const { success: userSuccess, data: user } = await UserModel.getById(rUser.userId);

    let tickerConfig: ISingleConfig | IPlaylistConfig = null;
    //Query object to to get the ticker config
    let queryObject: any = {
      stream: null,
      market: null,
      symbol: null,
      currency: null,
      type: null,
      gainTrackingEnabled: false,
      purchasePrice: null,
    };

    //Object to push on the device with the ticker config and quote
    let pushObject: any = {};

    //check if isPlaylist is undefined or null set it to false
    if (isPlaylist === undefined || isPlaylist === null) isPlaylist = false;

    const {
      success: s2,
      message,
      data: configData,
    } = isPlaylist ? await getPlaylistQuoteConfig(playlistId, rUser, req.body) : await getSingleQuoteConfig(req.body);
    if (!s2) return sendErrorResponse(res, message, 1);

    pushObject = configData.pushObject;
    tickerConfig = configData.tickerConfig;
    queryObject = configData.queryObject;

    //console.log({ queryObject, pushObject, tickerConfig });

    //console.log("cg", configData);
    const mode = SYMBOL_TYPE_OBJ.find((f) => f.id === queryObject.symbolType)?.mode || "text";

    const { success, error, macAddress } = await DeviceModel.updateTickerSymbol(
      deviceId,
      tickerConfig,
      isPlaylist,
      playlistId,
      extras,
      mode
    );

    if (!success) {
      console.error("Error in updating ticker symbol", macAddress, error);
      return sendErrorResponse(res);
    }

    const isMusicCreatorPl = pushObject.isMusicCreatorPl || false;

    if (isPlaylist) {
      if (!isMusicCreatorPl) {
        const { symbols } = tickerConfig as IPlaylistConfig;

        for (const symbol of symbols) {
          addToQuoteCollector({
            stream: symbol.stream,
            market: symbol.market,
            symbol: symbol.symbol,
            currency: symbol.currency,
            type: symbol.symbolType,
          });
        }
      }
    } else {
      addToQuoteCollector({
        stream: queryObject.stream,
        market: queryObject.market,
        symbol: queryObject.symbol,
        currency: queryObject.currency,
        type: queryObject.symbolType,
      });
    }

    const gainTracking = {
      enabled: queryObject.gainTrackingEnabled || false,
      purchasePrice: queryObject.purchasePrice || null,
      noOfStocks: queryObject.noOfStocks || 1,
      showFullAssetValue: queryObject.showFullAssetValue || false,
      isShortSell: queryObject.isShortSell || false,
    };

    const multiplier = {
      enabled: queryObject.multiplierEnabled || false,
      value: queryObject.multiplier || null,
    };

    let result;

    const pushQuoteParams: IPushQuoteParams = {
      stream: queryObject.stream,
      symbol: queryObject.symbol,
      symbolType: queryObject.symbolType,
      timeZone: user.timeZone,
      gainTracking,
      multiplier,
      currency: queryObject.currency,
      market: queryObject.market,
      deviceData: { macAddress, pushObject, extras },
      unit: queryObject.extraConfig.unit,
      aggregateTime: queryObject.extraConfig.aggregateTime,
      divideBy100: queryObject.extraConfig.divideBy100,
      manualSearch: queryObject.extraConfig.manualSearch,
      extras: queryObject.extraConfig,
      customAPIMapping:
        queryObject.symbolType === SYMBOL_TYPE.CUSTOMAPI
          ? queryObject.extraConfig?.customAPIMapping || null
          : undefined,
    };

    switch (queryObject.stream) {
      //** Polygon/Finage/CoinGecko */
      case DATA_STREAM.POLYGON:
        if (queryObject.symbolType === SYMBOL_TYPE.INDICES) {
          const tvUSIndexMarket = GetUSIndicesMarketForTV(queryObject.symbol);
          if (!tvUSIndexMarket) return sendErrorResponse(res, "Unable to find Index", 1);
          console.log("~~ US Indices from TradingView ~~", `${tvUSIndexMarket}:${queryObject.symbol}`);
          pushQuoteParams.market = tvUSIndexMarket;
          queryObject.market = tvUSIndexMarket;
          result = await PushTradingViewQuote(pushQuoteParams);
        } else {
          result = await PushPolygonQuote(pushQuoteParams);
        }

        break;

      case DATA_STREAM.COINGECKO:
        result = await PushCryptoQuote(pushQuoteParams);
        break;
      case DATA_STREAM.COMMODITES:
        result = await PushCommodityAPIQuote(pushQuoteParams);
        break;
      case DATA_STREAM.TRADINGVIEW:
        if (queryObject.symbolType === SYMBOL_TYPE.CRYPTO) {
          result = await PushCryptoQuote(pushQuoteParams);
        } else {
          result = await PushTradingViewQuote(pushQuoteParams);
        }
        break;
      case DATA_STREAM.ELECTRICITY:
        result = await PushElectricityPricesQuote(pushQuoteParams);
        break;
      case DATA_STREAM.HUMBL3:
        result = await PushHumbl3Data(pushQuoteParams);

        break;
      case DATA_STREAM.CUSTOMAPI:
        result = await PushDataFromCustomAPI(pushQuoteParams);
        break;

      default:
        throw new Error(`Invalid stream: ${queryObject.stream}`);
        break;
    }

    const { success: resultSuccess, dataForDevice } = result;

    if (!resultSuccess) return sendErrorResponse(res, "Error pushing stock", 1);

    // if (resultSuccess) {
    const nonFormattedSymbolTypes = [
      SYMBOL_TYPE.ELECTRICITY,
      SYMBOL_TYPE.OPTIONS,
      SYMBOL_TYPE.CUSTOMAPI,
      SYMBOL_TYPE.MUSIC_CREATORS,
    ];

    if (!nonFormattedSymbolTypes.includes(queryObject.symbolType)) {
      dataForDevice.date = formatDate(dataForDevice.date, user.timeZone, user.timeFormat);
    }

    result.dataForDevice.unit = result.dataForDevice.extraConfig?.unit || undefined;
    result.dataForDevice.extraConfig = undefined;
    result.dataForDevice.noOfStocks = undefined;
    result.dataForDevice.showFullAssetValue = undefined;
    result.dataForDevice.isShortSell = undefined;
    result.dataForDevice.multiplierEnabled = undefined;
    result.dataForDevice.multiplier = undefined;
    result.dataForDevice.commodityCategory = undefined;
    result.dataForDevice.deviceId = undefined;
    result.dataForDevice.isMusicCreatorPl = undefined;

    if (queryObject.symbolType === SYMBOL_TYPE.MUSIC_CREATORS) {
      result.dataForDevice.symbol = undefined;
      result.dataForDevice.currency = undefined;
    }

    if (isPlaylist && isMusicCreatorPl) {
      //process the playlist data for music creator
      await processMusicCreatorPlaylist((tickerConfig as IPlaylistConfig).symbols, macAddress);

      result.dataForDevice.updateInterval = (tickerConfig as IPlaylistConfig).updateInterval;
      result.dataForDevice.name = undefined;
      result.dataForDevice.currency = undefined;
      result.dataForDevice.cycleInterval = undefined;
      result.dataForDevice.cycleMode = undefined;
      result.dataForDevice.isCalculateOnDaily = undefined;
      result.dataForDevice.symbols = undefined;
    }

    publishData(macAddress, JSON.stringify(result.dataForDevice));

    if (canPublishToStream(queryObject.stream, queryObject.symbolType)) {
      //add the symbol to the data streamer

      const symbolsToSubscribe = [];
      if (isPlaylist) {
        for (const symbol of (tickerConfig as IPlaylistConfig).symbols) {
          const symbolToSubscribe = configureSymbolToSubscribe({
            stream: symbol.stream,
            symbolType: symbol.symbolType,
            symbol: symbol.symbol,
            market: symbol.market,
            currency: symbol.currency,
            manualSearch: symbol.extraConfig.manualSearch,
          });

          if (symbolToSubscribe) symbolsToSubscribe.push(symbolToSubscribe);
        }
      } else {
        const symbolToSubscribe = configureSymbolToSubscribe({
          stream: queryObject.stream,
          symbolType: queryObject.symbolType,
          symbol: queryObject.symbol,
          market: queryObject.market,
          currency: queryObject.currency,
          manualSearch: queryObject.extraConfig.manualSearch,
        });
        symbolsToSubscribe.push(symbolToSubscribe);
      }

      console.log({ symbolsToSubscribe });

      const topic =
        queryObject.symbolType === SYMBOL_TYPE.INDICES
          ? mqttTopicsForSymbolSubscriptions[DATA_STREAM.TRADINGVIEW]
          : mqttTopicsForSymbolSubscriptions[queryObject.stream];

      publishData(topic, JSON.stringify(symbolsToSubscribe));
    }

    return sendResponse(true, "Stock pushed successfully.", null, res);
    // } else {
    //   return sendErrorResponse(res, "Error pushing stock", 1);
    // }
  } catch (error) {
    console.error(error);
    return sendErrorResponse(res);
  }
};

const processMusicCreatorPlaylist = async (playlistSymbols: IPlaylistConfig["symbols"], macAddress: string) => {
  try {
    //format the playlist data into the required format and save in the redis

    const playlistData = playlistSymbols.map((symbol) => ({
      symbol: symbol.symbol,
      musicCreatorURL: symbol.extraConfig?.musicCreatorURL || "",
      feature: symbol.extraConfig?.feature || "",
      humbl3Id: symbol.extraConfig?.humbl3Id || "",
    }));

    const currentIndex = 0;

    const humbl3PlData = {
      playlistData,
      currentIndex,
    };

    const redisKey = `PAGEMODE_PLAYLIST:${macAddress}`;

    redis.set(redisKey, JSON.stringify(humbl3PlData), "EX", 60 * 60 * 24); // Set expiration to 24 hours
  } catch (error) {
    console.error("Error in processMusicCreatorPlaylist", error);
  }
};

const canPublishToStream = (stream: string, symbolType: SYMBOL_TYPE) => {
  if (stream === DATA_STREAM.TRADINGVIEW) return true;

  const allowedSymbolTypes = [SYMBOL_TYPE.STOCK, SYMBOL_TYPE.INDICES];

  if (stream === DATA_STREAM.POLYGON && allowedSymbolTypes.includes(symbolType)) return true;

  return false;
};

const configureSymbolToSubscribe = ({ stream, symbolType, symbol, market, currency, manualSearch }) => {
  if (stream === DATA_STREAM.TRADINGVIEW || symbolType === SYMBOL_TYPE.INDICES) {
    const _market = market.toUpperCase(); //symbolType === SYMBOL_TYPE.CRYPTO && currency !== "USD" ? "COINBASE" : market.toUpperCase();
    const _symbol = manualSearch ? symbol.replace("/", "") : symbol.replace(/[. -]/g, "_").replace("/", "");
    return `${_market}:${_symbol}`;
  } else {
    return symbol;
  }
};

const getPlaylistQuoteConfig = async (playlistId: string, user: IUserReq, body: any) => {
  let playlist: IPlaylist = null;

  if (playlistId) {
    const { success: pls, data } = await PlaylistModel.getById(playlistId);

    //if (!pls) return sendResponse(false, "Playlist not found", null, res, 0);
    if (!pls) return { success: false, message: "Playlist not found" };

    playlist = data;

    if (playlist.userId.toString() !== user.userId.toString())
      return { success: false, message: "You are not authorized to push this playlist", data: null };
  }

  const { name, cycleInterval, updateInterval, symbols, ledBrightness, cycleMode, isCalculateOnDaily } =
    playlist || body;

  if (!name || !cycleInterval || !updateInterval || !symbols || symbols.length === 0)
    return { success: false, message: "Invalid data", data: null };

  // const symbols = _symbols.map((s) => ({
  //   ...s,
  //   symbol: s.stream === DATA_STREAM.COINGECKO ? s.name : s.symbol,
  //   name: s.stream === DATA_STREAM.COINGECKO ? s.symbol : s.name,
  // }));

  const isMusicCreatorPl = symbols[0].symbolType === SYMBOL_TYPE.MUSIC_CREATORS;

  const tickerConfig = {
    name,
    cycleInterval,
    updateInterval,
    symbols,
    ledBrightness,
    cycleMode,
    isCalculateOnDaily,
    isMusicCreatorPl,
  };

  //check if first symbol type is SYMBOL_TYPE.MUSIC_CREATORS, set isMusicCreator to true

  //get stock on the basis of cycle mode, if best then calculate best performer on the stock, if worst then calculate worst performer on the stock else get the 1st stock

  //console.log("===>", { symbols, cycleMode, isCalculateOnDaily, user });
  const querySymbol = await getSymbolsOnCycleMode(symbols, cycleMode, isCalculateOnDaily, user.timeZone);

  // using 1st object to push to device
  const queryObject = {
    stream: querySymbol?.stream ?? "polygon",
    market: querySymbol?.market ?? "us",
    symbol: querySymbol.symbol,
    currency: querySymbol.currency,
    symbolType: querySymbol.symbolType,
    gainTrackingEnabled: querySymbol.gainTrackingEnabled,
    purchasePrice: querySymbol.purchasePrice,
    multiplierEnabled: querySymbol?.stream === DATA_STREAM.COINGECKO ? querySymbol?.multiplierEnabled : false,
    multiplier: querySymbol?.stream === DATA_STREAM.COINGECKO ? symbols[0]?.multiplier : 1,
    extraConfig: {
      aggregateTime: querySymbol?.extraConfig?.aggregateTime || "1d",
      isMetalCommodity: querySymbol?.extraConfig?.isMetalCommodity || false,
      unit: querySymbol?.extraConfig?.unit || "",
      divideBy100: querySymbol?.extraConfig?.divideBy100 ?? true,
    },
  };

  if (isMusicCreatorPl) {
    //add extra config for music creator from playlist symbols
    queryObject.extraConfig = {
      ...queryObject.extraConfig,
      ...querySymbol.extraConfig,
    };
  }

  const pushObject = {
    isPlaylist: true,
    type: MSG_TYPES.NEW,
    isMusicCreatorPl,
    ...tickerConfig,
    symbols: isMusicCreatorPl
      ? querySymbol.symbol
      : symbols.map((s) => (s.dataStream === DATA_STREAM.COINGECKO ? `${s.symbol}/${s.currency}` : s.symbol)).join(","),
  };

  return { success: true, message: "OK", data: { queryObject, pushObject, tickerConfig } };
};

const getSingleQuoteConfig = async (body: any) => {
  const {
    stream,
    market,
    interval,
    symbol,
    type,
    currency,
    ledBrightness,
    alertEnabled,
    alertConfig,
    gainTrackingEnabled,
    purchasePrice,
    noOfStocks,
    showFullAssetValue,
    isShortSell,
    multiplierEnabled,
    multiplier,
    symbolUI,
    extraConfig,
  } = body;

  if (!stream || !market || !interval || !symbol || !type || !currency) {
    console.log("Invalid data", stream, market, interval, symbol, type, currency);
    return { success: false, message: "Invalid data", data: null };
  }

  const mode = SYMBOL_TYPE_OBJ.find((f) => f.id === type)?.mode || "text";
  //console.log({ stream, market, interval, symbol, type, currency });

  //console.log("===.", { extraConfig });

  const _extraConfig = {
    ...extraConfig,
    aggregateTime: extraConfig?.aggregateTime || "1d",
    isMetalCommodity: extraConfig?.isMetalCommodity || false,
    unit: extraConfig?.commodityUnit || "",
  };

  //console.log("XX===.", { _extraConfig });

  const tickerConfig = {
    stream,
    market,
    symbol,
    interval,
    symbolType: type,
    currency,
    ledBrightness,
    alertEnabled,
    alertConfig,
    gainTrackingEnabled: mode === "page" ? undefined : gainTrackingEnabled,
    purchasePrice: mode === "page" ? undefined : purchasePrice,
    noOfStocks: noOfStocks || "",
    showFullAssetValue: showFullAssetValue || false,
    isShortSell: isShortSell || false,
    multiplierEnabled: mode === "page" ? undefined : type === SYMBOL_TYPE.CRYPTO ? multiplierEnabled : false,
    multiplier: mode === "page" ? undefined : type === SYMBOL_TYPE.CRYPTO ? multiplier : 1,
    symbolUI,
    extraConfig: _extraConfig,
  };

  const queryObject = {
    stream,
    market,
    symbol,
    symbolType: type,
    currency,
    gainTrackingEnabled: mode === "page" ? undefined : gainTrackingEnabled,
    purchasePrice: mode === "page" ? undefined : purchasePrice,
    noOfStocks: noOfStocks || 1,
    showFullAssetValue: showFullAssetValue || false,
    isShortSell: isShortSell || false,
    multiplierEnabled: mode === "page" ? undefined : multiplierEnabled,
    multiplier: mode === "page" ? undefined : multiplier,
    extraConfig: _extraConfig,
  };

  const pushObject = {
    isPlaylist: false,
    type: MSG_TYPES.NEW,
    ...tickerConfig,
    alertConfig: tickerConfig.alertEnabled ? tickerConfig.alertConfig : undefined,
    deviceId: body.deviceId,
  };

  // console.log("========================================================================");
  // console.log({ queryObject, pushObject, tickerConfig });
  // console.log("========================================================================");

  return { success: true, message: "OK", data: { queryObject, pushObject, tickerConfig } };
};

export const addToQuoteCollector = async (data: IMarketSymbol) => {
  try {
    const { success, data: qc } = await QuoteCollectorModel.getOne(data);

    if (!success) {
      if (data.market === "etf") {
        const etfData = etfs.find(
          (f) => f.symbol === data.symbol && f.currency.toUpperCase() === data.currency.toUpperCase()
        );
        const meta = etfData ? { country: etfData.country, currency: etfData.currency } : null;
        data.meta = meta;
      } else if (data.market === "indices") {
        const indexData = usIndicesTV.find((f) => f.symbol === data.symbol);

        const meta = indexData ? { tvMarket: indexData.market } : null;
        data.meta = meta;
      }

      const { success: s2, data: newQuoteCollector, error } = await QuoteCollectorModel.add(data);
      //if (!s2) console.error("Error in adding quote collector", newQuoteCollector, data, error);
    } else if (success && data.type === SYMBOL_TYPE.INDICES) {
      //~~ update the meta data for indices
      const indexData = usIndicesTV.find((f) => f.symbol === data.symbol);
      const meta = indexData ? { tvMarket: indexData.market } : null;
      if (meta) await QuoteCollectorModel.updateMeta(data, meta);
    } else {
      console.log("Already exists in quote collector", data);
    }
  } catch (error) {
    //console.error("Error in addToQuoteCollector", error, { data });
  }
};

export const disableAlert = async (req: express.Request, res: express.Response) => {
  try {
    const { deviceId } = req.body;
    //console.log(deviceId, req.params.id);

    if (deviceId === req.params.id) {
      publishData(`ALERT/${deviceId}`, JSON.stringify({ type: MSG_TYPES.ALERT_DISABLE }));
    }
    return sendResponse(true, "Alert disabled successfully.", null, res);
  } catch (error) {
    console.error(error);

    return sendErrorResponse(res, "Error disabling alert.", 1);
  }
};

//** ========== ===================================================================================== =========  **/
//** ========== Old Functions for the old APIs integration which does not allows streams and market properties =========  **/
//** ========== ===================================================================================== =========  **/
// import { searchCoinsList, searchETFList, searchIndicesList } from "./quotes/helper";
// import { GetQuoteFromAlphaVantage, SearchSymbolFromApi } from "./quotes/alphavantage";

// // ** 1st Search for symbol */
// export const searchSymbols = async (req: express.Request, res: express.Response) => {
//   try {
//     const user = req.user as IUserReq;
//     const type = parseInt(req.params.type, 10);
//     const symbol = req.params.symbol;
//     const currency = req.params.currency;

//     //console.log({ type, symbol, currency });
//     if (!type || isNaN(type)) return sendErrorResponse(res, "No type found", 1);
//     if (!symbol) return sendErrorResponse(res, "No search query found", 1); // res.status(400).send(getErrorObject("Empty search query."));
//     if (!currency) return sendErrorResponse(res, "No currency found", 1);

//     if (type === 1) getStockData(symbol, user.timeZone, res);
//     else if (type === 2) getCryptoData(symbol, currency, user.timeZone, res);
//     else return sendErrorResponse(res, "Invalid type", 1);
//   } catch (error) {
//     console.error("Error in SearchSymbol==>", error);
//     sendErrorResponse(res);
//   }
// };

// // ** STOCK APIs */
// //#region Stock API

// const getStockData = async (search: string, timeZone: string, res: express.Response) => {
//   try {
//     const url = stockAPIURL(search);

//     const queryAPIResponse: any = await http.getAPI(url);

//     const { count, results, error } = queryAPIResponse;

//     if (error) return sendErrorResponse(res);

//     if (count === 0 || !results || results.length === 0)
//       return sendResponse(false, `No Stock found against symbol ${search}`, null, res, 1);

//     const stocks = results[0];
//     //console.log(stocks);

//     const stockQuote = await getStockQuoteFromAPI(
//       stocks.ticker,
//       { enabled: false, purchasePrice: null },
//       timeZone,
//       stocks.currency_name.toUpperCase(),
//       stocks.name
//     );

//     if (stockQuote.success) return sendResponse(true, "STOCK_PRICE", stockQuote.data, res);
//     else return sendErrorResponse(res, "Error from API \n\n" + stockQuote.error);
//   } catch (error) {
//     throw error;
//   }
// };

// const getStockPreviousClosing = async (symbol: string): Promise<number> => {
//   const url = buildURL(`v2/aggs/ticker/${symbol.toUpperCase()}/prev?unadjusted=true`);

//   const response: any = await http.getAPI(url, true);

//   if (response.status === "OK" && response?.resultsCount > 0) {
//     const previousPrice = response.results.find((f) => f.T === symbol);
//     if (previousPrice) {
//       return parseFloat(previousPrice.c.toString()) || 0;
//     }
//   }
// };

// const calculatePercentage = (
//   previousClosingOrPurchasePrice: number,
//   currentQuote: number,
//   gainTrackingEnabled: boolean
// ) => {
//   const percent =
//     previousClosingOrPurchasePrice === 0
//       ? null
//       : ((currentQuote - previousClosingOrPurchasePrice) / previousClosingOrPurchasePrice) * 100;

//   if (gainTrackingEnabled) {
//     return percent === null ? "" : percent > 0 ? `Profit +${percent.toFixed(2)}%` : `Loss ${percent.toFixed(2)}%`;
//   } else {
//     return percent === null ? "" : `1 day ${percent > 0 ? "+" : ""} ${percent.toFixed(2)}%`;
//   }
// };

// export const getStockQuoteFromAPI = async (
//   symbol: string,
//   gainTracking: { enabled: boolean; purchasePrice: number | null },
//   timeZone: string,
//   currency: string = "USD",
//   stockName: string = null
// ) => {
//   const url = buildURL(`v2/last/trade/${symbol.toUpperCase()}?`);

//   const cSymbol = currSymbols[currency];

//   let response: any = await http.getAPI(url, true);

//   if (response.status !== "OK") {
//     return { success: false, error: response.error.error, status: response.status };
//   }

//   const { results } = response;

//   if (results) {
//     let percent = "";
//     if (gainTracking.enabled && gainTracking.purchasePrice !== null && !isNaN(gainTracking.purchasePrice)) {
//       percent = calculatePercentage(gainTracking.purchasePrice, results.p, gainTracking.enabled);
//     } else {
//       const previousClosing = await getStockPreviousClosing(symbol);
//       percent = calculatePercentage(previousClosing, results.p, gainTracking.enabled);
//     }
//     //const percent = previousClosing === 0 ? "" : ((results.p - previousClosing) / previousClosing) * 100;

//     const date = formatDate(results.y / 1000000000, timeZone);
//     const price = cSymbol.symbol + getFormattedNumber(parseFloat(results.p.toString())); // round(results.p.toString(), 2);
//     const quote = parseFloat(results.p.toString());

//     response = {
//       symbol,
//       price,
//       p: quote,
//       percent,
//       date,
//       name: stockName || undefined,
//     };

//     return { success: true, data: response };
//   }
// };

//#endregion

// ** CRYPTO APIs **
//#region "CRYPTO APIs"

// const getCryptoData = async (cryptoCurrency: string, fiatCurrency: string, timeZone: string, res: express.Response) => {
//   try {
//     const cryptoQuote = await getCryptoQuoteFromAPI(cryptoCurrency, timeZone, fiatCurrency, {
//       enabled: false,
//       purchasePrice: null,
//     });

//     if (cryptoQuote.success) return sendResponse(true, "STOCK_PRICE", cryptoQuote.data, res);
//     else if (cryptoQuote.error === "notfound")
//       return sendResponse(false, `No crypto pair found for ${cryptoCurrency}-${fiatCurrency}`, null, res, 1);
//     else return sendErrorResponse(res, "Error from API \n\n" + cryptoQuote.error);
//   } catch (error) {
//     console.error(error);
//     throw error;
//   }
// };

// export const getCryptoQuoteFromAPI = async (
//   cryptoCurrency: string,
//   timeZone: string,
//   fiatCurrency: string = "USD",
//   gainTracking: { enabled: boolean; purchasePrice: number | null }
// ) => {
//   try {
//     const url = cryptoAPIURL(cryptoCurrency, fiatCurrency);

//     const queryAPIResponse: any = await http.getAPI(url);

//     const { last, status, error } = queryAPIResponse;

//     if (error) return { success: false, error };

//     if (status === "notfound") return { success: false, error: status };
//     if (status !== "success") return { success: false, error: status };

//     const { price, timestamp } = last;

//     if (price) {
//       //const percent = previousClosing === 0 ? "" : ((price - previousClosing) / previousClosing) * 100;

//       let percent = "";
//       if (gainTracking.enabled && gainTracking.purchasePrice !== null && !isNaN(gainTracking.purchasePrice)) {
//         percent = calculatePercentage(gainTracking.purchasePrice, price, gainTracking.enabled);
//       } else {
//         const previousClosing = await getCrptoPreviousClosing(cryptoCurrency, fiatCurrency);
//         percent = calculatePercentage(previousClosing, price, gainTracking.enabled);
//       }

//       const cSymbol = currSymbols[fiatCurrency];

//       const date = formatDate(timestamp / 1000, timeZone);
//       const quote = getFormattedNumber(price);

//       const response = {
//         symbol: cryptoCurrency,
//         price: cSymbol.symbol + quote,
//         p: quote,
//         percent,
//         date,
//         name: cryptoCurrency,
//       };

//       return { success: true, data: response };
//     }
//   } catch (error) {
//     throw error;
//   }
// };

// const getCrptoPreviousClosing = async (cryptoCurrency: string, fiatCurrency: string): Promise<number> => {
//   const url = buildURL(`v2/aggs/ticker/X:${cryptoCurrency.toUpperCase()}${fiatCurrency}/prev?adjusted=false`);

//   const response: any = await http.getAPI(url, true);

//   if (response.status === "OK" && response?.resultsCount > 0) {
//     const previousPrice = response.results.find((f) => f.T === `X:${cryptoCurrency.toUpperCase()}${fiatCurrency}`);

//     if (previousPrice) {
//       return parseFloat(previousPrice.c.toString()) || 0;
//     }
//   }
// };

//#endregion
// //** ========== ===================================================================================== =========  **/
// export const pushToDevice = async (req: express.Request, res: express.Response) => {
//   try {
//     const { isPlaylist, playlistId, deviceId } = req.body;
//     const user = req.user as IUserReq;

//     let tickerConfig: IDevice["config"] | IDevice["playlist"] = null;
//     //Query object to to get the ticker config
//     let queryObject: any = {
//       symbol: null,
//       currency: null,
//       type: null,
//       gainTrackingEnabled: false,
//       purchasePrice: null,
//     };

//     //Object to push on the device with the ticker config and quote
//     let pushObject: any = {};

//     if (isPlaylist) {
//       // Playlist/Multiple tickers

//       let playlist: IPlaylist = null;
//       if (playlistId) {
//         const { success: pls, data } = await PlaylistModel.getById(playlistId);

//         if (!pls) return sendResponse(false, "Playlist not found", null, res, 0);

//         playlist = data;

//         if (playlist.userId.toString() !== user.userId.toString())
//           return sendResponse(false, "You are not authorized to push this playlist", null, res, 1);
//       }

//       const {
//         name,
//         cycleInterval,
//         updateInterval,
//         symbols,
//         ledBrightness,
//         cycleMode,
//         isCalculateOnDaily ,
//       } = playlist || req.body;

//       if (!name || !cycleInterval || !updateInterval || !symbols || symbols.length === 0) return sendErrorResponse(res);

//       tickerConfig = { name, cycleInterval, updateInterval, symbols, ledBrightness, cycleMode, isCalculateOnDaily };

//       // using 1st object to push to device
//       queryObject = {
//         symbol: symbols[0].symbol,
//         currency: symbols[0].currency,
//         symbolType: symbols[0].symbolType,
//         gainTrackingEnabled: symbols[0].gainTrackingEnabled,
//         purchasePrice: symbols[0].purchasePrice,
//       };

//       pushObject = {
//         isPlaylist: true,
//         type: MSG_TYPES.NEW,
//         ...tickerConfig,
//         symbols: symbols.map((s) => (s.symbolType === 2 ? `${s.symbol}/${s.currency}` : s.symbol)).join(","),
//       };
//     } else {
//       // Single Ticker
//       const {
//         interval,
//         symbol,
//         type,
//         currency,
//         ledBrightness,
//         alertEnabled,
//         alertConfig,
//         gainTrackingEnabled,
//         purchasePrice,
//       } = req.body;

//       if (!deviceId || !interval || !symbol || !type || !currency) return sendErrorResponse(res);

//       tickerConfig = {
//         stream: "polygon",
//         market: "us",
//         symbol,
//         interval,
//         symbolType: type,
//         currency,
//         ledBrightness,
//         alertEnabled,
//         alertConfig,
//         gainTrackingEnabled,
//         purchasePrice,
//       };

//       queryObject = { symbol, currency, symbolType: type, gainTrackingEnabled, purchasePrice };
//       pushObject = {
//         isPlaylist: false,
//         type: MSG_TYPES.NEW,
//         ...tickerConfig,
//         alertConfig: tickerConfig.alertEnabled ? tickerConfig.alertConfig : undefined,
//       };
//     }

//     const { success, error, macAddress } = await DeviceModel.updateTickerSymbol(
//       deviceId,
//       tickerConfig,
//       isPlaylist,
//       playlistId,
//       {}
//     );

//     if (!success) return sendErrorResponse(res);

//     const gainTracking = {
//       enabled: queryObject.gainTrackingEnabled || false,
//       purchasePrice: queryObject.purchasePrice || null,
//     };

//     const { success: success2, data: quote } =
//       queryObject.symbolType === 1
//         ? await getStockQuoteFromAPI(queryObject.symbol, gainTracking, user.timeZone)
//         : queryObject.symbolType === 2
//         ? await getCryptoQuoteFromAPI(queryObject.symbol, user.timeZone, queryObject.currency, gainTracking)
//         : { success: false, data: null };

//     //console.log("quoteObject", { success2, quote });

//     if (success2) {
//       const dataForDevice = { ...quote, ...pushObject, gainTrackingEnabled: undefined, purchasePrice: undefined };

//       publishData(macAddress, JSON.stringify(dataForDevice));

//       //console.log(dataForDevice);
//       // res.send({ success: true, message: "Stock pushed successfully." });
//       return sendResponse(true, "Stock Pushed successfully.", null, res);
//     } else {
//       return sendErrorResponse(res);
//     }
//   } catch (error) {
//     console.error(error);
//     return sendErrorResponse(res);
//   }
// };

// const getErrorObject = (error: string) => ({ success: false, error, type: 1 });

// const round = (num, dec) => {
//   const [sv, ev] = num.toString().split("e");
//   return Number(Number(Math.round(parseFloat(sv + "e" + dec)) + "e-" + dec) + "e" + (ev || 0));
// };
// const getFormattedNumber = (num: number) => num.toFixed(num > 9999 ? 0 : num > 999 ? 1 : 2);
// const formatDate = (sec: number, tz: string) => DateTime.fromSeconds(sec, { zone: tz }).toFormat("hh:mma dd MMM yyyy");
