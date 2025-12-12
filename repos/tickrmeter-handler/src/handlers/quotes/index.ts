import { publishData } from "../../services/mqtt";

import { IDevice, IDeviceWithUser, IPlaylistConfig, ISingleConfig } from "../../models/interfaces";
import { DATA_MARKETS, DATA_STREAM, DEFAULT_TIMEZONE, MSG_TYPES, SYMBOL_TYPE } from "../../constants";
import { currencyList, formatDate } from "./helper";
import { IGetQuoteForPlaylist, IGetQuoteForSingleSymbol, IQueryObject } from "./helper/interfaces";
import { GetLEDBrightness } from "./helper/ledBrightness";
import { GetPolygonQuote } from "./polygon";
import DeviceModelClass from "../../models/device-native";

//import { GetLocalTop10Quote } from "./top10";
import { getSymbolsOnCycleMode } from "./helper/playlistCycleMode";
import { GetElectricityPricesQuote } from "./electricity";
import config from "../../conf";
import { GetProcessedDataFromCustomAPI } from "./custom-api";
import http from "../../services/http";
import { GetTradingViewQuote } from "./trading-view";
import { GetCryptoQuote } from "./crypto";
import { GetHumbl3Data } from "./humbl3";
import usIndicesTV from "./jsonFiles/us_indices_tv.json";
import redis from "../../services/redis";
import { DateTime } from "luxon";
import { GetFXONQuote } from "./fxon";

const ALERT_TOPIC = "ALERT";
const NO_CONFIG_MSG = { type: MSG_TYPES.NO_CONFIG, success: false, message: "No configuration found." };
const NO_DEVICE_FOUND = { type: MSG_TYPES.DEVICE_ASSIGNED, success: false, message: "Device Not Found" };

const debugDevicesArray = (config?.app?.debugDevices ?? "").split(",") || [];
const debugDevices = [...debugDevicesArray, "2462ABB5B4B4"];

export const print = (mac, msg) => debugDevices.includes(mac) && console.log(DateTime.utc().toJSDate(), msg);

const getDevice = async (deviceMac: string) => {
  try {
    //check if device data is available in redis
    // const deviceKey = `device:${deviceMac}`;

    // const deviceData = await redis.get(deviceKey);

    // if (!deviceData) {
    const DeviceModel = new DeviceModelClass();
    const device = await DeviceModel.getByMacAddress(deviceMac);

    if (!device.success) return { success: false, error: "Device Not Found" };
    //await redis.set(deviceKey, JSON.stringify(device.data));
    return { success: true, data: device.data };
    // } else {
    //   return { success: true, data: JSON.parse(deviceData) };
    // }
  } catch (error) {
    return { success: false, error };
  }
};

// ** Main function called on the message recieved with UPDATE MSG */
export const getDeviceStocks = async (deviceMac: string, UPDATE_OR_NEW = MSG_TYPES.UPDATE, symbolFromDevice = null) => {
  try {
    const requestId = Math.floor(Math.random() * 1000000).toString();

    print(deviceMac, `${requestId} - GET DEVICE DATA`);

    const { success, data: deviceData } = await getDevice(deviceMac);
    print(deviceMac, `${requestId} - AFTER DEVICE DATA`);

    if (!success) return publishData(deviceMac, JSON.stringify(NO_DEVICE_FOUND), requestId);

    const { isPlaylist, playlist, config, extras, user } = deviceData;

    if (extras?.company === "p500") {
      //TODO: we have handled p500 devices in separate application (tickrmeter-thirdparty-handler)
      getQuoteForP500Devices(deviceMac, requestId);
      return;
    }

    const timeZone = user?.timeZone || DEFAULT_TIMEZONE;
    const timeFormat = user?.timeFormat || "12h";

    const userTimeParams = { timeZone, timeFormat };

    // Check configuration
    if (!isConfigAvailable(deviceData)) return publishData(deviceMac, JSON.stringify(NO_CONFIG_MSG), requestId);

    // ** CHECK NIGHTMODE ENABLED IN DEVICE CONFIG
    const ledBrigthness = GetLEDBrightness(deviceData, timeZone);

    if (isPlaylist) playlist.ledBrightness = ledBrigthness;
    else (config as ISingleConfig).ledBrightness = ledBrigthness;

    // deviceMac, symbolFromDevice, playlist, timeZone
    print(deviceMac, `${requestId} - GET QUOTE FOR DEVICE`);
    if (isPlaylist || symbolFromDevice)
      return getQuoteForPlaylistSymbol({
        deviceMac,
        symbolFromDevice,
        playlist,
        userTimeParams,
        requestId,
      });
    else {
      return getQuoteForSingleTickerData({
        deviceMac,
        config,
        msgType: UPDATE_OR_NEW,
        userTimeParams,
        extras,
        requestId,
      });
    }
  } catch (error) {
    console.error("Error in getDeviceStocks", error);
  }
};

const isConfigAvailable = (device: IDeviceWithUser) => {
  if (!device) return false;
  if (device.isPlaylist && !device.playlist) return false;

  if (!device.isPlaylist) {
    const config = device.config as ISingleConfig;
    if (!config) return false;
    if (!config?.symbol || !config?.interval || !config?.symbolType) return false;
  }

  return true;
};

const getQuoteForP500Devices = async (deviceMac: string, requestId: string) => {
  try {
    const req = {
      type: "UPDATE",
      device: deviceMac,
    };

    const p500Url = config?.app?.p500URL;

    if (!p500Url) {
      console.error("P500 URL not found in config");
      return;
    }
    const res = await http.post(p500Url, req);

    if (res?.price) {
      publishData(deviceMac, JSON.stringify(res), requestId);
    }
  } catch (error) {
    console.error("Error in getQuoteForP500Devices", error);
    return;
  }
};

const getMusicCreatorsNextPlaylistSymbol = async (deviceMac: string, playlistSymbols: IPlaylistConfig["symbols"]) => {
  try {
    //get data from redis
    const redisKey = `PAGEMODE_PLAYLIST:${deviceMac}`;
    const redisData = JSON.parse(await redis.get(redisKey)) || null;

    if (!redisData) return playlistSymbols[0];

    //console.log("redisData", redisData);

    const { playlistData, currentIndex } = redisData;

    const newIndex = currentIndex + 1 > playlistData.length - 1 ? 0 : currentIndex + 1;

    const newSymbol = playlistData[newIndex];

    if (!newSymbol) return playlistSymbols[0];

    const humbl3PlDataString = JSON.stringify({
      playlistData,
      currentIndex: newIndex,
    });

    //set new index in redis
    redis.set(redisKey, humbl3PlDataString, "EX", 60 * 60 * 24); // Set expiration to 24 hours

    return newSymbol;
  } catch (error) {
    console.error("Error in getMusicCreatorsNextPlaylistSymbol", error);
    return playlistSymbols[0];
  }
};

const getQuoteForPlaylistSymbol: IGetQuoteForPlaylist = async (params) => {
  // ---------------------------------------------
  const { deviceMac, symbolFromDevice, playlist, userTimeParams, requestId } = params;
  const {
    name,
    cycleInterval,
    updateInterval,
    symbols,
    ledBrightness,
    cycleMode = "default",
    isCalculateOnDaily = false,
  } = playlist;

  let playlistSymbol: string;
  let playlistSymbolType: number;
  let playlistCurrency: string;
  let isMusicCreatorPl = false;
  // let gainTracking = { enabled: false, purchasePrice: -1 };

  if (symbolFromDevice) {
    const { symbols: plSymbols } = playlist;

    const plSymbol = plSymbols.find((s) => s.symbol === symbolFromDevice);

    if (plSymbol) {
      playlistSymbol = plSymbol.symbol;
      playlistCurrency = plSymbol.currency || null;
      playlistSymbolType = plSymbol.symbolType;
    } else {
      const _split = symbolFromDevice.split("/");
      playlistSymbol = _split[0];
      playlistSymbolType = _split.length > 1 ? 2 : 1;
      playlistCurrency = playlistSymbolType === 2 ? _split[1] : null;

      //return publishData(deviceMac, JSON.stringify(NO_CONFIG_MSG));
      if (debugDevices.includes(deviceMac)) {
        console.log(`----------------IF SYMBOL FOR DEVICE ${deviceMac}-------------------------`);
        console.log({ playlistSymbol, playlistSymbolType, playlistCurrency });
        console.log("----------------------------------------------------------------------");
      }
    }
  } else if (playlist.symbols[0].symbolType === SYMBOL_TYPE.MUSIC_CREATORS) {
    // playlistSymbol = playlist.symbols[0].symbol;
    // playlistCurrency = playlist.symbols[0].currency || null;
    // playlistSymbolType = playlist.symbols[0].symbolType;

    const newSymbol = await getMusicCreatorsNextPlaylistSymbol(deviceMac, playlist.symbols);
    playlistSymbol = newSymbol.symbol;
    playlistCurrency = null;
    playlistSymbolType = 11;
    isMusicCreatorPl = true;
  } else {
    if (!name || !cycleInterval || !updateInterval || !symbols)
      return publishData(deviceMac, JSON.stringify(NO_CONFIG_MSG), requestId);

    playlistSymbol = symbols[0].symbol;
    playlistCurrency = symbols[0].currency || null;
    playlistSymbolType = symbols[0].symbolType;
  }

  const symbolData = playlistCurrency
    ? playlist.symbols.find((s) =>
        s.symbolType === 3
          ? s.symbol === playlistSymbol || s.symbol === symbolFromDevice
          : s.symbol === playlistSymbol && s.currency === playlistCurrency
      )
    : playlist.symbols.find((s) => s.symbol === playlistSymbol);

  const symbolIndex = !symbolData
    ? -1
    : playlist.symbols.findIndex((s) =>
        s.symbolType === 2
          ? s.symbol === symbolData.symbol && s.currency === symbolData.currency
          : s.symbol === symbolData.symbol
      );

  const tickerConfig = { name, cycleInterval, updateInterval, symbols, symbolIndex, cycleMode, isCalculateOnDaily };
  //symbolIndex is the index of the symbol in the playlist

  // ** For UK Stocks divide by 100, if not set */
  if (symbolData?.market === DATA_MARKETS.UK_STOCKS) {
    // Ensure extraConfig is initialized with default values
    symbolData.extraConfig = symbolData.extraConfig || {
      aggregateTime: "1d",
      isMetalCommoidity: false,
      unit: "",
      divideBy100: false,
      manualSearch: false,
    };

    // Now safely update divideBy100
    symbolData.extraConfig.divideBy100 = true;
  }

  // ** For cycle mode */
  const querySymbol =
    cycleMode === "default"
      ? symbolData
      : await getSymbolsOnCycleMode(symbols, cycleMode, isCalculateOnDaily, deviceMac);

  // using 1st object to push to device
  const queryObject: IQueryObject = {
    stream: querySymbol?.stream || DATA_STREAM.POLYGON,
    market: querySymbol?.market || "us",
    symbol: querySymbol?.symbol,
    currency: querySymbol?.currency,
    symbolType: querySymbol?.symbolType,
    extraConfig: querySymbol?.extraConfig,
  };

  const configObject = {
    isPlaylist: true,
    isMusicCreatorPl,
    type: symbolFromDevice ? MSG_TYPES.UPDATE : MSG_TYPES.NEW,
    ...tickerConfig,
    ledBrightness: ledBrightness ?? 100,
    symbols: symbols
      .map((s) => (s.stream === DATA_STREAM.COINGECKO ? `${s.symbol}/${s.currency}` : s.symbol))
      .join(","),
    alertEnabled: false,
    gainTrackingEnabled: querySymbol?.gainTrackingEnabled || false,
    purchasePrice: querySymbol?.purchasePrice ?? 0,
    noOfStocks: querySymbol?.noOfStocks || "",
    showFullAssetValue: querySymbol?.showFullAssetValue || false,
    isShortSell: querySymbol?.isShortSell || false,
    multiplierEnabled: querySymbol?.multiplierEnabled || false,
    multiplier: querySymbol?.multiplier || 1,
  };

  if (debugDevices.includes(deviceMac)) {
    console.log(`-----------GET QUOTE FROM SYMBOL BEFORE RETURN ${deviceMac}-------------------`);
    console.log({
      queryObject,
      configObject,
      timezone: userTimeParams.timeZone,
      tickerConfig,
      querySymbol,
      cycleMode,
      playlistSymbol,
      playlistCurrency,
      symbolData,
      playlist,
    });
    console.log("-----------------------------------------------------------------");
  }

  return publishDataToDevice(deviceMac, queryObject, configObject, userTimeParams);
};

// ** For publishing single Ticker Data */
const getQuoteForSingleTickerData: IGetQuoteForSingleSymbol = async (params) => {
  const { deviceMac, config, msgType = MSG_TYPES.UPDATE, userTimeParams, extras, requestId } = params;

  const {
    stream,
    market,
    interval,
    symbol,
    symbolType,
    currency,
    alertEnabled,
    alertConfig,
    ledBrightness,
    extraConfig,
  } = config as ISingleConfig;

  if (!interval || !symbol || !symbolType || !currency) {
    print(deviceMac, `${requestId} - NO CONFIG FOUND`);
    return publishData(deviceMac, JSON.stringify(NO_CONFIG_MSG), requestId);
  }

  const queryObject = { stream, market, symbol, currency, symbolType, extraConfig };

  //console.log("extras", extras);
  print(deviceMac, `${requestId} - CREATING configOBject`);
  const configObject = {
    isPlaylist: false,
    type: msgType || MSG_TYPES.UPDATE,
    ...config,
    ledBrightness: ledBrightness ?? 100,
    alertEnabled: alertEnabled || false,
    alertConfig: alertEnabled ? alertConfig : undefined,
    ledColor: symbolType === SYMBOL_TYPE.TOP10 ? extras?.lightBarColor || "Blue" : undefined,
    isCalculateOnDaily: false,
  };

  publishDataToDevice(deviceMac, queryObject, configObject, userTimeParams, requestId);
};
const GetUSIndicesMarketForTV = (symbol: string) => usIndicesTV.find((f) => f.symbol === symbol)?.market || null;

// ** Function to publish the data to device */
const publishDataToDevice = async (
  deviceMac: string,
  queryObject: IQueryObject,
  configObject: any,
  userTimeParams: { timeZone: string; timeFormat: string },
  requestId?: string
) => {
  print(deviceMac, `${requestId} - START PUBLISH FUNCTION`);

  const gainTracking = {
    enabled: configObject?.gainTrackingEnabled || false,
    purchasePrice: configObject?.purchasePrice || -1,
    isCalculateOnDaily: configObject?.isCalculateOnDaily || false,
    noOfStocks: configObject?.noOfStocks || "",
    showFullAssetValue: configObject?.showFullAssetValue || false,
    isShortSell: configObject?.isShortSell || false,
  };

  const multiplier = {
    enabled: Boolean(configObject?.multiplierEnabled) || false,
    value: Number(configObject?.multiplier) || 1,
  };

  let result = { success: false, data: null };

  // check if queryObject.stream is available
  if (!queryObject.stream) queryObject.stream = DATA_STREAM.POLYGON;

  print(deviceMac, `${requestId} - CREATING getQuoteParams`);

  const getQuoteParams = {
    macAddress: deviceMac,
    stream: queryObject.stream,
    market: queryObject.market,
    symbol: queryObject.symbol,
    symbolType: queryObject.symbolType,
    currency: queryObject.currency,
    gainTracking,
    multiplier,
    unit: queryObject.extraConfig?.unit,
    aggregateTime: queryObject.extraConfig?.aggregateTime,
    divideBy100: queryObject.extraConfig?.divideBy100,
    manualSearch: queryObject.extraConfig?.manualSearch,
    extras: queryObject.extraConfig,
    customAPIMapping:
      queryObject.symbolType === SYMBOL_TYPE.CUSTOMAPI ? queryObject.extraConfig?.customAPIMapping || null : undefined,
    ...userTimeParams,
  };

  let isPageModeStream = false;

  switch (queryObject.stream) {
    case DATA_STREAM.POLYGON:
      //generate random request Id

      if (queryObject.symbolType === SYMBOL_TYPE.INDICES) {
        const _market = GetUSIndicesMarketForTV(queryObject.symbol);
        if (_market) getQuoteParams.market = _market || "NASDAQ";

        result = await GetTradingViewQuote(getQuoteParams);
      } else {
        result = await GetPolygonQuote({ ...getQuoteParams, requestId });
      }
      break;

    case DATA_STREAM.FINAGE:
    case DATA_STREAM.TRADINGVIEW:
      // print(deviceMac, `${requestId} - TradingView CALL START`);
      if (queryObject.symbolType === SYMBOL_TYPE.CRYPTO) {
        result = await GetCryptoQuote(getQuoteParams);
      } else {
        result = await GetTradingViewQuote(getQuoteParams);
      }

      print(deviceMac, `${requestId} - ${JSON.stringify(result, null, 2)} - TradingView CALL AFTER`);
      break;

    case DATA_STREAM.FXON:
      result = await GetFXONQuote(getQuoteParams);
      break;

    case DATA_STREAM.COINGECKO:
      result = await GetCryptoQuote(getQuoteParams);
      break;
    //case DATA_STREAM.FINAGE:
    case DATA_STREAM.COMMODITES:
      const dataToSend = {
        device: deviceMac,
        params: {
          getQuoteParams,
          configObject,
          userTimeParams,
        },
      };
      //console.log("HTTPSTREAMSTOCKS", JSON.stringify(dataToSend));
      return publishData("HTTPSTREAMSTOCKS", JSON.stringify(dataToSend), requestId);

    case DATA_STREAM.ELECTRICITY:
      isPageModeStream = true;
      result = await GetElectricityPricesQuote(getQuoteParams);

      if (result.success) {
        const pageConfig: IDevice["pageConfig"] = [
          {
            pageId: result.data.pageId,
            ledColor: result.data.color,
          },
        ];

        const DeviceModel = new DeviceModelClass();
        if (result.data.pageId !== -1) await DeviceModel.updatePageInfo(deviceMac, pageConfig);

        if (configObject?.alertEnabled) {
          const alertData = CheckElectricityAlert(configObject.alertConfig, result.data.price);

          result.data.ledColor = alertData?.ledColor ?? result.data.ledColor;
          result.data.blink = result.data.blink ?? false;
          result.data.alert = alertData ? true : false;
        }
      }

      break;

    case DATA_STREAM.CUSTOMAPI:
      result = await GetProcessedDataFromCustomAPI(getQuoteParams);
      break;

    case DATA_STREAM.HUMBL3:
      isPageModeStream = true;
      result = await GetHumbl3Data(getQuoteParams);

      if (result.success) {
        const pageConfig: IDevice["pageConfig"] = [
          {
            pageId: result.data.pageId,
            ledColor: result.data.color,
          },
        ];

        const DeviceModel = new DeviceModelClass();
        await DeviceModel.updatePageInfo(deviceMac, pageConfig);

        // if (configObject?.alertEnabled) {
        //   const alertData = CheckElectricityAlert(configObject.alertConfig, result.data.price);

        //   result.data.ledColor = alertData?.ledColor ?? result.data.ledColor;
        //   result.data.blink = result.data.blink ?? false;
        //   result.data.alert = alertData ? true : false;
        // }
      }

      break;

    default:
      console.log("No stream found", queryObject.stream);
      break;
  }

  if (isPageModeStream) {
    //console.log("==== PAGE MODE STREAM ====", result);
    //console.log("==== PAGE MODE STREAM ====", { stream: queryObject.stream, result, deviceMac });
    const dataForDevice = getDataForPageModeDevice(result, configObject);
    //console.log("==== PAGE MODE STREAM ====", deviceMac, { p: dataForDevice.page });
    publishData(deviceMac, JSON.stringify(dataForDevice));
    return;
  }

  if (!result?.success) {
    // console.error("publishDataToDevice: Result is not success", getQuoteParams, result);
    return;
  }

  print(deviceMac, `${requestId} - POLYGON PUBLISH DATA TO DEVICE`);
  const dataForDevice = getDataForDevice(result, configObject, queryObject, userTimeParams);

  print(deviceMac, `${requestId} - POLYGON AFTER DATA TO DEVICE ${JSON.stringify(dataForDevice)}`);

  publishData(deviceMac, JSON.stringify(dataForDevice), requestId);

  if (configObject?.alertEnabled) {
    checkAlert(configObject.alertConfig, result.data.p, deviceMac, requestId);
  }
};

const getDataForPageModeDevice = (result, configObject) => {
  const isMusicCreatorPl = configObject?.isMusicCreatorPl || false;

  const dataToSend = {
    mode: "page",
    type: isMusicCreatorPl ? "NEW" : undefined,
    page: [
      {
        id: result.data?.pageId ?? -1,
        ledColor: result.data?.ledColor ?? "#000000",
        rev: result.data?.rev ?? -1,
        blink: result.data?.blink ?? false,
        alert: result.data?.alert ?? false,
      },
    ],
    updateInterval: configObject.updateInterval || configObject.interval || 300,
    ttl: result.data?.ttl || 300,
    ledBrightness: configObject?.ledBrightness || 0,
  };

  if (!result.success) {
    console.error("getDataForDevice: Result is not success", result);
    return { ...dataToSend, error: "Error in getting data" };
  }

  return dataToSend;
};

const getDataForDevice = (result, configObject, queryObject, userTimeParams) => {
  try {
    const _currency = currencyList.find((c) => c.code === queryObject.currency);

    //console.log(result);

    const nonDateSymbolTypes = [SYMBOL_TYPE.OPTIONS, SYMBOL_TYPE.CUSTOMAPI];
    const isShowAmountChange = configObject.extraConfig?.showAmountChange || false;

    if (isShowAmountChange) {
      result.data.percent = result.data.priceDiff;
      result.data.perValue = result.data.pd;
    }

    const date = nonDateSymbolTypes.includes(queryObject.symbolType)
      ? result.data.date
      : formatDate(result.data.date, userTimeParams.timeZone, userTimeParams.timeFormat);

    return {
      ...result.data,
      ...configObject,
      date,
      symbol: result.data.symbol,
      currency: queryObject.symbolType === 3 ? undefined : _currency?.symbol || " ",
      unit: queryObject.extraConfig?.unit || undefined,
      gainTrackingEnabled: undefined,
      purchasePrice: undefined,
      stream: undefined,
      market: undefined,
      extraConfig: undefined,
      noOfStocks: undefined,
      showFullAssetValue: undefined,
      isShortSell: undefined,
      multiplierEnabled: undefined,
      multiplier: undefined,
      isCalculateOnDaily: undefined,
      commodityCategory: undefined,
      priceDiff: undefined,
      pd: undefined,
    };
  } catch (error) {
    console.error("Error in getDataForDevice", error);

    throw error;
  }
};

const checkAlert = async (alertConfig, price, deviceMac, requestId) => {
  const { triggerType, triggerValue } = alertConfig;

  const raiseAlert =
    triggerType.toLowerCase() === "less than" && parseFloat(price) < triggerValue
      ? true
      : triggerType.toLowerCase() === "greater than" && parseFloat(price) > triggerValue
      ? true
      : false;

  const dataForAlert = raiseAlert
    ? {
        type: MSG_TYPES.ALERT_ENABLE,
        ...alertConfig,
        triggerType: undefined,
        triggerValue: undefined,
      }
    : { type: MSG_TYPES.ALERT_DISABLE };

  publishData(`${ALERT_TOPIC}/${deviceMac}`, JSON.stringify(dataForAlert), requestId);
};

const CheckElectricityAlert = (alertConfig, price) => {
  const { triggerType, triggerValue } = alertConfig;

  const raiseAlert =
    triggerType.toLowerCase() === "less than" && parseFloat(price) < triggerValue
      ? true
      : triggerType.toLowerCase() === "greater than" && parseFloat(price) > triggerValue
      ? true
      : false;

  if (!raiseAlert) return null;

  return { ledColor: alertConfig.lightBarColor, blink: alertConfig.flashLightbar };
};
