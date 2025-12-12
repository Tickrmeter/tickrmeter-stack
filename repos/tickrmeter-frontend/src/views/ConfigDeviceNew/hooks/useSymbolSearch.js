// hooks/useSymbolSearch.js
import { useDeviceConfig } from "../contexts/DeviceConfigContext";
import { useDeviceConfigActions } from "./useDeviceConfigActions";
import { SYMBOL_TYPES, DATA_STREAMS, humbl3BaseUrl, featureMapping } from "../helper2";
import { stockMarkets, SupportedCurrencySymbols } from "../helper";

import { API_PATHS, ApiEndPoint } from "@src/redux/api-paths";
import http from "@src/utility/http";

import { DateTime } from "luxon";
import { getUserData } from "@src/auth/utils";

export const useSymbolSearch = () => {
  const { state } = useDeviceConfig();
  const { symbolDetails, top10List } = state;

  const { setStockQuote, setStockQuotePercentage, setSymbolDetails, setLoading, setServerError, setTop10List } =
    useDeviceConfigActions();

  const getQuerySymbol = (symbolParam, currencyParam, symbolDetails) => {
    //const { dataStream, dataMarket, symbolType, searchSymbol, currency } = symbolDetails;
    return symbolParam ?? symbolDetails.searchSymbol;
    // switch (symbolType) {
    //   case SYMBOL_TYPES.STOCK:
    //   case SYMBOL_TYPES.FOREX:
    //   case SYMBOL_TYPES.CRYPTO:
    //   case SYMBOL_TYPES.INDICES:
    //   case SYMBOL_TYPES.MUSIC_CREATORS:
    //     return symbolParam ?? searchSymbol;

    //   case SYMBOL_TYPES.ETF:
    //   case SYMBOL_TYPES.COMMODITY:
    //   case SYMBOL_TYPES.TOP10:
    //   case SYMBOL_TYPES.ELECTRICITY:
    //   case SYMBOL_TYPES.OPTIONS:
    //     return symbolParam ?? searchSymbol;

    //   default:
    //     throw new Error(`Invalid symbol type: ${symbolType}`);
    // }
  };

  const getTop10Options = async () => {
    if (top10List.length > 0) return top10List;

    try {
      setLoading(true);
      const url = `${ApiEndPoint(API_PATHS.AUTO_COMPELETE_SEARCH)}/local-top10/local-top10?q=top10&t=7`;
      const { success, data: symbols } = await http.get(url);

      if (!success) return [];

      const options = symbols.map((symbol) => ({
        _id: symbol.symbol,
        name: `${symbol.symbol} - ${symbol.name}`,
      }));

      setTop10List(options);
      return options;
    } catch (error) {
      console.error(error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchSymbolData = async (symbolParam, currencyParam, streamDetails) => {
    try {
      setLoading(true);
      const querySymbol = symbolParam ?? symbolDetails?.searchSymbol;

      const dataMarket = streamDetails?.dataMarket || symbolDetails.dataMarket;
      const symbolType = streamDetails?.symbolType || symbolDetails.symbolType;
      const dataStream = streamDetails?.dataStream || symbolDetails.dataStream;

      const currency =
        currencyParam ??
        symbolDetails.currency ??
        stockMarkets.find((dm) => dm._id === symbolDetails.dataMarket)?.currency ??
        "-";

      // if (symbolType === SYMBOL_TYPES.CRYPTO) {
      //   dataStream = DATA_STREAMS.TRADINGVIEW;
      //   dataMarket = DATA_MARKETS.CRYPTO;
      // }

      const dataObject = {
        symbol: querySymbol.trim().toUpperCase(),
        stream: dataStream,
        market: dataMarket,
        type: streamDetails?.symbolType || symbolDetails.symbolType,
        currency,

        aggregateTime: streamDetails ? streamDetails.aggregateTime : symbolDetails.aggregateTime,
        unit: streamDetails
          ? streamDetails?.unit || streamDetails?.commodityUnit
          : symbolDetails?.isMetalCommodity
          ? symbolDetails?.commodityUnit || "perOunce"
          : "",
        divideBy100: streamDetails?.divideBy100 ?? symbolDetails.extras?.divideBy100 ?? false,
        manualSearch: streamDetails?.manualSearch ?? symbolDetails?.extras?.manualSearch ?? false,
      };

      return await http.post(`${ApiEndPoint(API_PATHS.SEARCH_SYMBOL_MARKET)}`, dataObject);
    } catch (error) {
      console.error(error);
      return { success: false, message: "There is an error processing your request, Please try again later.", type: 1 };
    } finally {
      setLoading(false);
    }
  };

  const searchForSymbol = async (symbolParam, currencyParam, streamDetails = null) => {
    try {
      setLoading(true);
      setStockQuote(null);
      setServerError(null);

      const { success, data, message, type } = await fetchSymbolData(symbolParam, currencyParam, streamDetails);

      if (success) {
        setStockQuote(data);
        setStockQuotePercentage(data.percent);

        if ("commodityCategory" in data) {
          setSymbolDetails({
            ...symbolDetails,
            currency: data.currency,
            searchSymbol: data.symbol,
            isMetalCommodity: data.commodityCategory === "Metals",
            commodityUnit:
              data.commodityCategory === "Metals" && symbolDetails.commodityUnit === ""
                ? "perOunce"
                : symbolDetails.commodityUnit,
          });
        }
        setServerError(null);
      } else {
        setServerError(type === 1 ? message : "There is an error processing your request, Please try again later.");
      }
    } catch (error) {
      console.error(error);
      setServerError("There is an error processing your request, Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const resetAlertQuoteAndPercentage = () => {
    setStockQuote(null);
    setStockQuotePercentage(null);
  };

  const searchForMusicCreator = async (id, streamDetails, savedSymbolDetails, mode, playlistFuncs) => {
    const url = new URL(`${humbl3BaseUrl}/v1/audience`);

    const userDetails = getUserData();
    const userTimeZone = userDetails?.timeZone || "UTC";
    const userTimeOffset = DateTime.now().setZone(userTimeZone).offset;

    const dataMarket = streamDetails?.dataMarket || symbolDetails.dataMarket;
    const feature = streamDetails?.feature || symbolDetails.extras?.feature;

    const _symbolDetails = savedSymbolDetails || symbolDetails;

    let pathName = `/${dataMarket}/`;

    pathName += feature.includes("artist") ? "artists" : "tracks";
    pathName += `/${id}/${featureMapping[feature]}`;

    url.pathname += pathName;

    url.searchParams.set("dateTimeOffset", userTimeOffset);

    const res = await http.get(url);

    if (!res.value || !res.title) {
      setServerError("Data for selected Track / Artist is not available, Please try again later");
      setStockQuote(null);
      return;
    }

    setServerError(null);

    const name = feature.includes("track") ? `${res.title} by ${res.subTitle}` : res.title;

    const symbolDetailsObj = {
      ..._symbolDetails,
      searchSymbol: name,
      extras: {
        ..._symbolDetails.extras,
        feature,
        musicCreatorURL: `${pathName}${url.search}`,
        humbl3Id: id,
        displaySource: res?.displaySource,
        displayLabel: res?.displayLabel,
        displayTimeFrame: res?.displayTimeFrame,
        title: res?.title,
        subTitle: res?.subTitle,
      },
    };

    setSymbolDetails(symbolDetailsObj);

    if (mode === "playlist") {
      // setStockQuotePercentage(res.difference ? Math.abs(res.difference) : 0);
      const { playlistState, plErrorState } = playlistFuncs;
      const playlistSymbol = {
        ...symbolDetailsObj,
        dataStream: DATA_STREAMS.HUMBL3,
        stream: DATA_STREAMS.HUMBL3,
        market: symbolDetailsObj.dataMarket,
        symbol: symbolDetailsObj.searchSymbol,
        value: res.value,
        extraConfig: {
          ...symbolDetailsObj.extras,
        },
      };

      const { playlist, setPlaylist } = playlistState;

      setPlaylist([...playlist, playlistSymbol]);
    } else {
      setStockQuote({
        price: res.value.toLocaleString(),
        name: res.title,
        subTitle: res.subTitle,
        type: _symbolDetails.dataMarket,
        date: DateTime.now().toFormat("HH:mm"),
        feature: res.displayLabel,
        percent: res.difference ? `${Math.abs(res.difference).toFixed(2)}%` : "",
        isUp: res.difference ? res.difference > 0 : false,
        displayLabel: res.displayLabel,
        displayTimeFrame: res.displayTimeFrame,
        displaySource: res.displaySource,
      });
    }
  };

  return {
    searchForSymbol,
    fetchSymbolData,
    getTop10Options,
    getQuerySymbol,
    resetAlertQuoteAndPercentage,
    searchForMusicCreator,
  };
};
