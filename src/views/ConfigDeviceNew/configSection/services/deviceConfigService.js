// deviceService.js

import http from "@src/utility/http";
import { currencyList, defaultAlertConfig, symbolDetailsDefault } from "../../helper";
import { DATA_MARKETS, DATA_STREAMS, SYMBOL_TYPES } from "../../helper2";
import { API_PATHS, ApiEndPoint } from "@src/redux/api-paths";
import exchanges from "../exchanges";

export const fetchDeviceDetails = async (deviceId) => {
  try {
    const response = await http.get(`${ApiEndPoint(API_PATHS.GET_MY_DEVICES)}/${deviceId}`);

    if (response.success) {
      return {
        success: true,
        data: processDeviceData(response.data, currencyList),
      };
    }

    return {
      success: false,
      error:
        response.type === 1 ? response.message : "There is an error processing your request, Please try again later.",
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: "There is an error processing your request, Please try again later.",
    };
  }
};

const processDeviceData = (device, currencyList) => {
  if (device?.isPlaylist) {
    return {
      configType: "playlist",
      playlistId: device.playlistId,
    };
  }

  if (!device?.config) return null;

  if (device.config.symbolType === SYMBOL_TYPES.CUSTOMAPI) {
    return { configType: "custom-api" };
  }

  const { config, extras } = device;

  const currencyDecimal = currencyList.find((currency) => currency.code === config.currency)?.decimal;

  const formattedPurchasePrice = config.purchasePrice
    ? config.purchasePrice.toString().replace(".", currencyDecimal)
    : "";

  const symbolDetails = {
    dataStream: config.stream,
    dataMarket: config.market,
    symbolType: config.symbolType,
    searchSymbol: config.symbol,
    currency: config.currency,
    interval: config.interval,
    ledBrightness: config.ledBrightness,
    gainTrackingEnabled: config.gainTrackingEnabled ?? symbolDetailsDefault.gainTrackingEnabled,
    purchasePrice: formattedPurchasePrice,
    noOfStocks: config.noOfStocks ?? symbolDetailsDefault.noOfStocks,
    isShortSell: config.isShortSell ?? symbolDetailsDefault.isShortSell,
    showFullAssetValue: config.showFullAssetValue ?? symbolDetailsDefault.showFullAssetValue,
    multiplierEnabled: config.multiplierEnabled ?? symbolDetailsDefault.multiplierEnabled,
    multiplier: config.multiplier ?? symbolDetailsDefault.multiplier,
    serverConfig: config.symbolType === SYMBOL_TYPES.ELECTRICITY,
    aggregateTime: config?.extraConfig?.aggregateTime ?? symbolDetailsDefault.aggregateTime ?? "1d",
    extras: { ...config?.extraConfig },
  };

  // Handle special symbol types
  if (config.symbolType === SYMBOL_TYPES.ELECTRICITY) {
    symbolDetails.exactPrice = config.extraConfig.exactPrice ?? false;
    symbolDetails.extras = {
      ...extras,
      addressValue: config.extraConfig?.addressValue ?? "",
      fullAddress: config.extraConfig?.fullAddress ?? {},
    };
  } else if (config.symbolType === SYMBOL_TYPES.FOREX) {
    symbolDetails.searchSymbol = config.symbol.split("/")[0];
    symbolDetails.currency = config.symbol.split("/")[1];
  } else if (config.symbolType === SYMBOL_TYPES.COMMODITY) {
    symbolDetails.isMetalCommodity = config?.extraConfig?.isMetalCommodity ?? false;
    symbolDetails.commodityUnit = config?.extraConfig?.commodityUnit ?? "";
  }

  const _curr = config.currency === "-" ? "USD" : config.currency;
  const exchange = exchanges.find(
    (ex) =>
      ex._id === config.market.toUpperCase() ||
      ex.cc === config.market.toUpperCase() ||
      ex.currency === _curr.toUpperCase()
  );


  if (config.stream === DATA_STREAMS.FINAGE) {
    if (exchange) {
      symbolDetails.dataMarket = exchange._id;
      config.market = exchange._id;

      if (config.symbolType === SYMBOL_TYPES.INDICES && exchange.country === "USA") {
        const ss = `I:${symbolDetails.searchSymbol.replace(/^I:/, "")}`;

        symbolDetails.searchSymbol = ss;
        config.symbol = ss;

        symbolDetails.dataStream = DATA_STREAMS.POLYGON;
        config.stream = DATA_STREAMS.POLYGON;
      } else {
        symbolDetails.dataStream = DATA_STREAMS.TRADINGVIEW;
        config.stream = DATA_STREAMS.TRADINGVIEW;
      }
    }
  } else if (config.stream === DATA_STREAMS.POLYGON && config.symbolType === SYMBOL_TYPES.STOCK) {
    if (exchange) {
      symbolDetails.dataMarket = exchange._id;
      config.market = exchange._id;
    }
  }

  // if (config.symbolType === SYMBOL_TYPES.INDICES || config.symbolType === SYMBOL_TYPES.STOCKS) {
  //   if (exchange) {
  //     symbolDetails.dataMarket = exchange._id;
  //     if (exchange.country === "USA" && config.symbolType === SYMBOL_TYPES.INDICES) {
  //       symbolDetails.searchSymbol = `I:${symbolDetails.searchSymbol.replace(/^I:/, "")}`;
  //     }
  //   }
  // }

  const alertConfig = config?.alertEnabled ? processAlertConfig(config, symbolDetails.symbolType) : defaultAlertConfig;

  return {
    configType: "single",
    symbolDetails,
    alertConfig,
    alertConfigArr: getAlertConfigArray(config),
    streamDetails: getStreamDetails(config),
  };
};

const processAlertConfig = (config, symbolType) => {
  const { alertConfig } = config;

  if (symbolType === SYMBOL_TYPES.ELECTRICITY) {
    return {
      ...defaultAlertConfig,
      enabled: true,
    };
  }

  return {
    enabled: config.alertEnabled,
    triggerType: alertConfig.triggerType ?? defaultAlertConfig.triggerType,
    triggerValue: alertConfig.triggerValue ?? defaultAlertConfig.triggerValue,
    flashLightbar: alertConfig.flashLightbar ?? defaultAlertConfig.flashLightbar,
    playSound: alertConfig.playSound ?? defaultAlertConfig.playSound,
    soundType: alertConfig.soundType ?? defaultAlertConfig.soundType,
    soundDur: alertConfig.soundDur ?? defaultAlertConfig.soundDur,
    changeLightBarColor: alertConfig.changeLightBarColor ?? defaultAlertConfig.changeLightBarColor,
    lightBarColor: alertConfig.lightBarColor ?? defaultAlertConfig.lightBarColor,
  };
};

const getAlertConfigArray = (config) => {
  if (config.symbolType === SYMBOL_TYPES.ELECTRICITY) {
    if (!config.alertConfigArr || config.alertConfigArr.length === 0) {
      return [
        {
          ...defaultAlertConfig,
          ...config.alertConfig,
        },
      ];
    }
    return [...config.alertConfigArr];
  }
  return [];
};

const getStreamDetails = (config) => ({
  dataStream: config.stream,
  dataMarket: config.market,
  symbolType: config.symbolType,
  aggregateTime: config?.extraConfig?.aggregateTime ?? symbolDetailsDefault.aggregateTime ?? "1d",
  commodityUnit: config?.extraConfig?.commodityUnit ?? "",
  divideBy100: !!(
    config.market === DATA_MARKETS.UK_STOCKS &&
    (config?.extraConfig?.divideBy100 === undefined || config?.extraConfig?.divideBy100 === true)
  ),
});
