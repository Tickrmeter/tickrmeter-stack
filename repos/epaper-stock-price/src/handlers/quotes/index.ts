import { publishData } from "../../services/mqtt";

import { IDevice, IDeviceWithUser, ISingleConfig } from "../../models/interfaces";
import { DATA_MARKETS, DATA_STREAM, DEFAULT_TIMEZONE, MSG_TYPES, SYMBOL_TYPE } from "../../constants";
import { currencyList, formatDate } from "./helper";
import { IGetQuoteForPlaylist, IGetQuoteForSingleSymbol, IQueryObject } from "./helper/interfaces";
import { GetLEDBrightness } from "./helper/ledBrightness";
import { GetPolygonQuote } from "./polygon";
import { GetFinageQuote } from "./finage";
//import DeviceModelClass from "../../models/device-native";
import DeviceModel from "../../models/device";
import { GetCoinGeckoQuote } from "./coingecko";
import { GetCommodityAPIQuoteDB } from "./commodities-api";
//import { GetLocalTop10Quote } from "./top10";
import { getSymbolsOnCycleMode } from "./helper/playlistCycleMode";
import { GetElectricityPricesQuote } from "./electricity";
import config from "../../conf";

const ALERT_TOPIC = "ALERT";
const NO_CONFIG_MSG = { type: MSG_TYPES.NO_CONFIG, success: false, message: "No configuration found." };
const NO_DEVICE_FOUND = { type: MSG_TYPES.DEVICE_ASSIGNED, success: false, message: "Device Not Found" };

const debugDevices = config?.app?.debugDevices.split(",") || [];
debugDevices.push("AAABBBCCDEE");

// ** Main function called on the message recieved with UPDATE MSG */
export const getDeviceStocks = async (deviceMac: string, UPDATE_OR_NEW = MSG_TYPES.UPDATE, symbolFromDevice = null) => {
  try {
    //    let DeviceModel = new DeviceModelClass();

    const { success, data: deviceData } = await DeviceModel.getByMacAddress(deviceMac);

    //  DeviceModel = null;

    if (!success) return publishData(deviceMac, JSON.stringify(NO_DEVICE_FOUND));

    const timeZone = deviceData?.user?.timeZone || DEFAULT_TIMEZONE;
    const timeFormat = deviceData?.user?.timeFormat || "12h";

    const userTimeParams = { timeZone, timeFormat };
    // Check configuration
    if (!isConfigAvailable(deviceData)) return publishData(deviceMac, JSON.stringify(NO_CONFIG_MSG));

    // ** CHECK NIGHTMODE ENABLED IN DEVICE CONFIG
    const ledBrigthness = GetLEDBrightness(deviceData, timeZone);
    const { isPlaylist, playlist, config, extras } = deviceData;

    if (isPlaylist) playlist.ledBrightness = ledBrigthness;
    else (config as ISingleConfig).ledBrightness = ledBrigthness;

    // deviceMac, symbolFromDevice, playlist, timeZone

    if (isPlaylist || symbolFromDevice)
      return getQuoteForPlaylistSymbol({
        deviceMac,
        symbolFromDevice,
        playlist,
        userTimeParams,
      });
    else {
      return getQuoteForSingleTickerData({
        deviceMac,
        config,
        msgType: UPDATE_OR_NEW,
        userTimeParams,
        extras,
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
    //const { config } = device;
    const config = device.config as ISingleConfig;
    if (!config) return false;
    if (!config?.symbol || !config?.interval || !config?.symbolType) return false;
  }

  return true;
};

const getQuoteForPlaylistSymbol: IGetQuoteForPlaylist = async (params) => {
  // ---------------------------------------------
  const { deviceMac, symbolFromDevice, playlist, userTimeParams } = params;
  const {
    name,
    cycleInterval,
    updateInterval,
    symbols,
    ledBrightness,
    cycleMode = "default",
    isCalculateOnDaily = false,
  } = playlist;

  console.log("==>", playlist.symbols);

  let playlistSymbol: string;
  let playlistSymbolType: number;
  let playlistCurrency: string;
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
  } else {
    if (!name || !cycleInterval || !updateInterval || !symbols)
      return publishData(deviceMac, JSON.stringify(NO_CONFIG_MSG));

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
  if (symbolData.market === DATA_MARKETS.UK_STOCKS && symbolData.extraConfig.divideBy100 === undefined) {
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
    type: symbolFromDevice ? MSG_TYPES.UPDATE : MSG_TYPES.NEW,
    ...tickerConfig,
    ledBrightness: ledBrightness ?? 100,
    symbols: symbols.map((s) => (s.symbolType === 2 ? `${s.symbol}/${s.currency}` : s.symbol)).join(","),
    alertEnabled: false,
    gainTrackingEnabled: querySymbol?.gainTrackingEnabled || false,
    purchasePrice: querySymbol?.purchasePrice ?? 0,
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
  const { deviceMac, config, msgType = MSG_TYPES.UPDATE, userTimeParams, extras } = params;

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

  if (!interval || !symbol || !symbolType || !currency) return publishData(deviceMac, JSON.stringify(NO_CONFIG_MSG));

  const queryObject: IQueryObject = { stream, market, symbol, currency, symbolType, extraConfig };

  console.log({ queryObject });

  //console.log("extras", extras);

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

  publishDataToDevice(deviceMac, queryObject, configObject, userTimeParams);
};

// ** Function to publish the data to device */
const publishDataToDevice = async (
  deviceMac: string,
  queryObject: IQueryObject,
  configObject: any,
  userTimeParams: { timeZone: string; timeFormat: string }
) => {
  const gainTracking = {
    enabled: configObject?.gainTrackingEnabled || false,
    purchasePrice: configObject?.purchasePrice || -1,
    noOfStocks: configObject?.noOfStocks || "",
    showFullAssetValue: configObject?.showFullAssetValue || false,
    isShortSell: configObject?.isShortSell || false,
    isCalculateOnDaily: configObject?.isCalculateOnDaily || false,
  };

  const multiplier = {
    enabled: Boolean(configObject?.multiplierEnabled) || false,
    value: Number(configObject?.multiplier) || 1,
  };

  let result = { success: false, data: null };

  // check if queryObject.stream is available
  if (!queryObject.stream) queryObject.stream = DATA_STREAM.POLYGON;

  const getQuoteParams = {
    market: queryObject.market,
    symbol: queryObject.symbol,
    symbolType: queryObject.symbolType,
    currency: queryObject.currency,
    gainTracking,
    multiplier,
    unit: queryObject.extraConfig?.unit,
    aggregateTime: queryObject.extraConfig?.aggregateTime,
    divideBy100: queryObject.extraConfig?.divideBy100,
  };

  //console.log({ getQuoteParams });

  switch (queryObject.stream) {
    case DATA_STREAM.POLYGON:
      result = await GetPolygonQuote(getQuoteParams);
      break;

    case DATA_STREAM.FINAGE:
      result = await GetFinageQuote(getQuoteParams);
      break;

    case DATA_STREAM.COINGECKO:
      result = await GetCoinGeckoQuote(getQuoteParams);
      break;

    case DATA_STREAM.COMMODITES:
      result = await GetCommodityAPIQuoteDB(getQuoteParams);

      break;
    case DATA_STREAM.LOCALTOP10:
      //result = await GetLocalTop10Quote(getQuoteParams);
      break;
    case DATA_STREAM.ELECTRICITY:
      result = await GetElectricityPricesQuote(getQuoteParams);

      if (result.success) {
        const pageConfig: IDevice["pageConfig"] = [
          {
            pageId: result.data.pageId,
            ledColor: result.data.color,
          },
        ];

        //const DeviceModel = new DeviceModelClass();
        await DeviceModel.updatePageInfo(deviceMac, pageConfig);

        if (configObject?.alertEnabled) {
          const alertData = CheckElectricityAlert(configObject.alertConfig, result.data.price);
          console.log({ alertData });

          result.data.ledColor = alertData?.ledColor ?? result.data.ledColor;
          result.data.blink = result.data.blink ?? false;
          result.data.alert = alertData ? true : false;
        }
      }

      break;

    default:
      console.log("No stream found");
      break;
  }

  if (debugDevices.includes(deviceMac)) {
    console.log(`-------------------publishDataToDevice 1 ${deviceMac}---------------------`);
    console.log({ getQuoteParams });
    console.log({ multiplier });
    console.log({ result });
    console.log("--------------------------------------------------------------");
  }

  if (!result.success) return;

  const dataForDevice = getDataForDevice(result, configObject, queryObject, userTimeParams);

  if (debugDevices.includes(deviceMac)) {
    console.log(`-------------------publishDataToDevice before publishing ${deviceMac}---------------------`);
    console.log({ dataForDevice });
    console.log("--------------------------------------------------------------");
  }

  publishData(deviceMac, JSON.stringify(dataForDevice));

  if (configObject?.alertEnabled) {
    checkAlert(configObject.alertConfig, result.data.p, deviceMac);
  }
};

const getDataForDevice = (result, configObject, queryObject, userTimeParams) => {
  if (queryObject.stream === DATA_STREAM.ELECTRICITY) {
    return {
      mode: "page",
      page: [
        {
          id: result.data.pageId,
          ledColor: result.data.ledColor,
          rev: result.data.rev,
          blink: result.data.blink,
          alert: result.data.alert,
        },
      ],
      updateInterval: configObject.interval,
      ttl: result.data.ttl,
      ledBrightness: configObject.ledBrightness,
    };
  }

  const _currency = currencyList.find((c) => c.code === queryObject.currency);

  const date = formatDate(result.data.t, userTimeParams.timeZone, userTimeParams.timeFormat);
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
  };
};

const checkAlert = async (alertConfig, price, deviceMac) => {
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

  publishData(`${ALERT_TOPIC}/${deviceMac}`, JSON.stringify(dataForAlert));
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
