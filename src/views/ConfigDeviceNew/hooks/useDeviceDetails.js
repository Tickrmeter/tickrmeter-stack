import { ApiEndPoint, API_PATHS } from "@src/redux/api-paths";
import http from "@src/utility/http";

import { DATA_MARKETS, DATA_STREAMS, SYMBOL_TYPES, symbolCurrencyOverRides } from "../helper2";
import { currencyList, defaultAlertConfig, SupportedCurrencySymbols, symbolDetailsDefault } from "../helper";
import exchanges from "@device-config/configSection/exchanges";
import { useDeviceConfig } from "@device-config/contexts/DeviceConfigContext";
import { useSymbolSearch } from "./useSymbolSearch";
import { useDeviceConfigActions } from "./useDeviceConfigActions";

export const useDeviceDetails = ({ setSelectedPlaylist }) => {
  const { state } = useDeviceConfig();
  const {
    setSymbolDetails,
    setAlertConfig,
    setAlertConfigArr,
    setDeviceDetails,
    setConfigType,
    setLoading,
    setServerError,
  } = useDeviceConfigActions();
  const { symbolDetails, alertConfig, alertConfigArr, deviceDetails, stockQuote } = state;

  const { getQuerySymbol, searchForSymbol, searchForMusicCreator } = useSymbolSearch();

  const handlePlaylistConfig = (device) => {
    setConfigType("playlist");
    setSelectedPlaylist(device.playlistId);
  };

  const handleCustomApiConfig = () => setConfigType("custom-api");

  const createSavedSymbolDetails = (config, extras) => {
    const currencyDecimal = currencyList.find((currency) => currency.code === config.currency)?.decimal || ".";
    const formattedPurchasePrice = config.purchasePrice
      ? config.purchasePrice.toString().replace(".", currencyDecimal)
      : "";

    const savedSymbolDetails = {
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
      extras: { ...extras, ...config?.extraConfig },
    };

    if (config.symbolType === SYMBOL_TYPES.ELECTRICITY) {
      savedSymbolDetails.searchSymbol = config.symbol;
      savedSymbolDetails.exactPrice = config.extraConfig.exactPrice ?? false;
      savedSymbolDetails.extras.addressValue = config.extraConfig?.addressValue ?? "";
      savedSymbolDetails.extras.fullAddress = config.extraConfig?.fullAddress ?? {};
    } else if (config.symbolType === SYMBOL_TYPES.COMMODITY) {
      savedSymbolDetails.isMetalCommodity = config?.extraConfig?.isMetalCommodity ?? false;
      savedSymbolDetails.commodityUnit = config?.extraConfig?.commodityUnit ?? "";
    }

    return savedSymbolDetails;
  };

  const getDeviceDetails = async (deviceId) => {
    try {
      const {
        success,
        data: device,
        message,
        type,
      } = await http.get(`${ApiEndPoint(API_PATHS.GET_MY_DEVICES)}/${deviceId}`);

      if (!success) {
        // error from the API
        if (type === 1) setServerError(message);
        else setServerError("There is an error processing your request, Please try again later.");
        return;
      }

      // success => set device details from response
      setDeviceDetails({ ...device });

      // If device is a playlist type
      if (device?.isPlaylist) return handlePlaylistConfig(device);

      // If there's no config, just return
      if (!device?.config) return;

      if (device.config.symbolType === SYMBOL_TYPES.CUSTOMAPI) return handleCustomApiConfig();

      // Otherwise treat as single ticker
      setConfigType("single");
      const { config, extras } = device;
      const savedSymbolDetails = createSavedSymbolDetails(config, extras);

      if (device?.isPlaylist) {
        setConfigType("playlist");
        setSelectedPlaylist(device.playlistId);
      } else {
        const { config, extras } = device;

        const currencyDecimal = currencyList.find((currency) => currency.code === config.currency)?.decimal;

        const formattedPurchasePrice = config.purchasePrice
          ? config.purchasePrice.toString().replace(".", currencyDecimal)
          : "";

        const savedSymbolDetails = {
          dataStream: config.stream,
          dataMarket: config.market,
          symbolType: config.symbolType,
          searchSymbol: config.symbol,
          currency: config.currency,
          interval: config.interval,
          ledBrightness: config.ledBrightness,
          gainTrackingEnabled: config.gainTrackingEnabled ?? symbolDetailsDefault.gainTrackingEnabled,
          purchasePrice: formattedPurchasePrice, //config.purchasePrice ?? symbolDetailsDefault.purchasePrice,
          noOfStocks: config.noOfStocks ?? symbolDetailsDefault.noOfStocks,
          isShortSell: config.isShortSell ?? symbolDetailsDefault.isShortSell,
          showFullAssetValue: config.showFullAssetValue ?? symbolDetailsDefault.showFullAssetValue,
          multiplierEnabled: config.multiplierEnabled ?? symbolDetailsDefault.multiplierEnabled,
          multiplier: config.multiplier ?? symbolDetailsDefault.multiplier,
          serverConfig: config.symbolType === SYMBOL_TYPES.ELECTRICITY,
          aggregateTime: config?.extraConfig?.aggregateTime ?? symbolDetailsDefault.aggregateTime ?? "1d",
        };
        savedSymbolDetails.extras = extras || {};

        if (config.symbolType === SYMBOL_TYPES.ELECTRICITY) {
          savedSymbolDetails.searchSymbol = config.symbol;
          savedSymbolDetails.exactPrice = config.extraConfig.exactPrice ?? false;
          savedSymbolDetails.extras.addressValue = config.extraConfig?.addressValue ?? "";
          savedSymbolDetails.extras.fullAddress = config.extraConfig?.fullAddress ?? {};
        } else if (config.symbolType === SYMBOL_TYPES.MUSIC_CREATORS) {
          savedSymbolDetails.extras.feature = config?.extraConfig?.feature ?? "";
          savedSymbolDetails.extras.musicCreatorURL = config?.extraConfig?.musicCreatorURL ?? "";
          savedSymbolDetails.extras.humbl3Id = config?.extraConfig?.humbl3Id ?? "";
          savedSymbolDetails.extras.artist_streams = config?.extraConfig?.artist_streams ?? "";
        } else if (config.symbolType === SYMBOL_TYPES.COMMODITY) {
          savedSymbolDetails.isMetalCommodity = config?.extraConfig?.isMetalCommodity ?? false;
          savedSymbolDetails.commodityUnit = config?.extraConfig?.commodityUnit ?? "";
        }

        savedSymbolDetails.extras = { ...savedSymbolDetails.extras, ...config?.extraConfig };

        // If the user manually typed in some symbol or currency
        if (config?.extraConfig?.manualSearch) {
          let _curr = savedSymbolDetails.currency === "-" ? "USD" : savedSymbolDetails.currency;
          _curr = SupportedCurrencySymbols.find((scs) => scs._id === _curr) ? _curr : "other";
          savedSymbolDetails.currency = _curr;
        }

        maybeOverrideMarketStream(savedSymbolDetails, config);


        console.log("Saved symbol details: ", savedSymbolDetails);

        setSymbolDetails(savedSymbolDetails);

        const streamDetails = {
          dataStream: config.stream,
          dataMarket: config.market,
          symbolType: config.symbolType,
          aggregateTime: config?.extraConfig?.aggregateTime ?? symbolDetailsDefault.aggregateTime ?? "1d",
          commodityUnit: config?.extraConfig?.commodityUnit ?? "",
          divideBy100: config?.extraConfig?.divideBy100 ?? false,
          manualSearch: config?.extraConfig?.manualSearch ?? false,
        };
        if (config.symbolType !== SYMBOL_TYPES.MUSIC_CREATORS) {
          searchForSymbol(config.symbol, config.currency, streamDetails);
        } else {
          const streamDetails = {
            dataMarket: config.market,
            feature: config?.extraConfig?.feature,
          };

          searchForMusicCreator(config.extraConfig.humbl3Id, streamDetails, savedSymbolDetails);
        }

        handleAlerts(config);
      }
    } catch (error) {
      setServerError("There is an error processing your request, Please try again later.");
      console.error(error);
    }
    window.scrollTo({
      top: 20,
      behavior: "smooth",
    });
  };

  const maybeOverrideMarketStream = (savedSymbolDetails, config) => {
    const { dataStream, dataMarket, currency } = savedSymbolDetails;

    //Crypto fix
    if (dataStream === DATA_STREAMS.TRADINGVIEW && dataMarket === DATA_MARKETS.CRYPTO) {
      //savedSymbolDetails.dataStream = DATA_STREAMS.COINGECKO;
      savedSymbolDetails.dataMarket = DATA_MARKETS.CRYPTO;
      //config.stream = DATA_STREAMS.COINGECKO;
      config.market = DATA_MARKETS.CRYPTO;
      return;
    }

    const exchange = exchanges.find(
      (ex) =>
        ex._id === dataMarket.toUpperCase() ||
        ex.cc === dataMarket.toUpperCase() ||
        ex.currency === currency.toUpperCase()
    );

    if (!exchange) return;
    // FINAGE -> TRADINGVIEW/POLYGON corrections
    if (dataStream === DATA_STREAMS.FINAGE) {
      if (!exchange) return;

      // If index from USA => Polygon
      if (savedSymbolDetails.symbolType === SYMBOL_TYPES.INDICES && exchange.country === "USA") {
        const symbolWithoutPrefix = savedSymbolDetails.searchSymbol.replace(/^I:/, "");
        const newSymbol = `I:${symbolWithoutPrefix}`;

        savedSymbolDetails.dataStream = DATA_STREAMS.POLYGON;
        savedSymbolDetails.searchSymbol = newSymbol;
        config.stream = DATA_STREAMS.POLYGON;
        config.symbol = newSymbol;
        savedSymbolDetails.dataMarket = exchange._id;
        config.market = exchange._id;
      } else if (savedSymbolDetails.symbolType === SYMBOL_TYPES.FOREX) {
        // FOREX => TRADINGVIEW
        savedSymbolDetails.dataStream = DATA_STREAMS.TRADINGVIEW;
        savedSymbolDetails.dataMarket = "FOREX";
        const newSymbol = config.symbol.replace("/", "");

        savedSymbolDetails.searchSymbol = newSymbol;
        config.symbol = newSymbol;
        config.stream = DATA_STREAMS.TRADINGVIEW;
        config.market = "FOREX";
      } else {
        // Other => TRADINGVIEW
        savedSymbolDetails.dataStream = DATA_STREAMS.TRADINGVIEW;
        config.stream = DATA_STREAMS.TRADINGVIEW;
        savedSymbolDetails.dataMarket = exchange._id;
        config.market = exchange._id;
      }
    } else if (dataStream === DATA_STREAMS.POLYGON && savedSymbolDetails.symbolType === SYMBOL_TYPES.STOCK) {
      // Polygon corrections for STOCK
      savedSymbolDetails.dataMarket = exchange._id;
      config.market = exchange._id;
    }
  };

  const handleAlerts = (config) => {
    if (config?.alertEnabled) {
      // Electricity devices may store multiple alerts in alertConfigArr
      if (config.symbolType === SYMBOL_TYPES.ELECTRICITY) {
        setAlertConfig({
          ...defaultAlertConfig,
          enabled: true,
        });

        // if no existing array, create one with defaults
        if (!config.alertConfigArr || config.alertConfigArr.length === 0) {
          setAlertConfigArr([
            {
              ...defaultAlertConfig,
              ...config.alertConfig,
            },
          ]);
        } else {
          setAlertConfigArr([...config.alertConfigArr]);
        }
      } else {
        const { alertConfig: _alert } = config;
        setAlertConfig({
          enabled: true,
          triggerType: _alert?.triggerType ?? defaultAlertConfig.triggerType,
          triggerValue: _alert?.triggerValue ?? defaultAlertConfig.triggerValue,
          flashLightbar: _alert?.flashLightbar ?? defaultAlertConfig.flashLightbar,
          playSound: _alert?.playSound ?? defaultAlertConfig.playSound,
          soundType: _alert?.soundType ?? defaultAlertConfig.soundType,
          soundDur: _alert?.soundDur ?? defaultAlertConfig.soundDur,
          changeLightBarColor: _alert?.changeLightBarColor ?? defaultAlertConfig.changeLightBarColor,
          lightBarColor: _alert?.lightBarColor ?? defaultAlertConfig.lightBarColor,
        });
      }
    } else {
      setAlertConfig(defaultAlertConfig);
    }
  };

  const saveDeviceConfig = async () => {
    try {
      setLoading(true);

      const alertConfigData = symbolDetails.symbolType === SYMBOL_TYPES.ELECTRICITY ? alertConfigArr[0] : alertConfig;

      const currency =
        symbolDetails.symbolType === SYMBOL_TYPES.CRYPTO && symbolDetails.currency === "-"
          ? "USD"
          : symbolDetails.currency;

      const overrideCurrency = symbolCurrencyOverRides.find(
        (item) => item.market === symbolDetails.dataMarket && item.symbol === symbolDetails.searchSymbol
      )?.currency;

      const dataMarket = symbolDetails.dataMarket;

      const dataStream = symbolDetails.dataStream;

      const data = {
        stream: dataStream,
        market: dataMarket,
        deviceId: deviceDetails._id,
        interval: symbolDetails.interval || symbolDetailsDefault.interval,
        symbol: getQuerySymbol(null, null, symbolDetails),
        symbolUI: stockQuote.symbolUI,
        type: symbolDetails.symbolType,
        alertEnabled: alertConfig.enabled,
        alertConfig: alertConfig.enabled ? alertConfigData : null,
        alertConfigArr: symbolDetails.symbolType === SYMBOL_TYPES.ELECTRICITY ? alertConfigArr : null,
        currency: overrideCurrency || currency,
        ledBrightness: symbolDetails.ledBrightness,
        gainTrackingEnabled: symbolDetails.gainTrackingEnabled,
        purchasePrice: symbolDetails.purchasePrice.replace(",", "."),
        noOfStocks: symbolDetails.noOfStocks,
        isShortSell: symbolDetails.isShortSell,
        showFullAssetValue: symbolDetails.showFullAssetValue,
        multiplier: symbolDetails.multiplier,
        multiplierEnabled: symbolDetails.multiplierEnabled,
        extraConfig: {
          ...symbolDetails.extras,
          commodityUnit: symbolDetails.symbolType === SYMBOL_TYPES.COMMODITY ? symbolDetails.commodityUnit : undefined,
          unit: undefined, //clearing unit as unit is now CommodityUnit
          isMetalCommodity:
            symbolDetails.symbolType === SYMBOL_TYPES.COMMODITY ? symbolDetails.isMetalCommodity : undefined,
          aggregateTime: symbolDetails.aggregateTime,
          exactPrice: symbolDetails.exactPrice,
        },

        extras: {
          lightBarColor:
            symbolDetails.symbolType === SYMBOL_TYPES.TOP10 ? symbolDetails.lightBarColor ?? "Blue" : undefined,
        },
      };

      const { success, message, type } = await http.post(`${ApiEndPoint(API_PATHS.QUOTE_PUSH_MARKET)}`, data);

      if (success) {
        return { success: true, message: "Device configuration pushed successfully." };
      } else {
        return {
          success: false,
          message: type === 1 ? message : "Unable to push device configuration, please try again later.",
        };
      }
    } catch (error) {
      console.error(error);

      return { success: false, message: "Unable to push device configuration, please try again later." };
    } finally {
      setLoading(false);
    }
  };

  return { saveDeviceConfig, getDeviceDetails };
};
