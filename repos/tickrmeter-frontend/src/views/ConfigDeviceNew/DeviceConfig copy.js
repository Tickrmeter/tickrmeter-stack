import React, { useState, useEffect } from "react";
import classNames from "classnames";

import { SlideDown } from "react-slidedown";
import "react-slidedown/lib/slidedown.css";

import { AlertCircle, XCircle } from "react-feather";

import { Card, CardHeader, CardTitle, Row, Col, Alert } from "reactstrap";

import http from "@src/utility/http";
import { ApiEndPoint, API_PATHS } from "@src/redux/api-paths";

import { defaultAlertConfig, symbolDetailsDefault, stockMarkets, currencyList } from "./helper";

import SelectPlaylist from "./SelectPlaylist";

import { DATA_MARKETS, DATA_STREAMS, SYMBOL_TYPES, symbolCurrencyOverRides } from "./helper2.js";

import { showToast } from "@src/utility/toast-content";
// import SearchSymbolForm from "./configSection/SearchSymbolForm";
import SymbolTypeSelection from "./configSection/a_SymbolTypeAndMarketSelection";
import ConfigRenderer from "./configSection/ConfigRenderer";
import CreateAlert from "./configSection/CreateAlert";
import DeviceOutput from "./configSection/DeviceOutput";
import SendToTickrmeterButton from "./configSection/SendToTickrmeterButton";
import ConfigType from "./configSection/ConfigType";
import CreateAlertNew from "./configSection/CreateAlertNew";
import CustomAPIConfig from "./configSection/customAPIs";

const DeviceConfig = ({ closeAndRefresh, deviceId }) => {
  // ** Component States
  const [hidden, setHidden] = useState(true);
  const [loading, setLoading] = useState(false);

  const [deviceDetails, setDeviceDetails] = useState(null);
  const [serverError, setServerError] = useState(null);
  //  const [firmwareId, setFirmwareId] = useState(null);

  const [configType, setConfigType] = useState("single");

  // const [stockSymbol, setStockSymbol] = useState(null);
  const [stockQuote, setStockQuote] = useState(null);
  const [stockQuotePercentage, setStockQuotePercentage] = useState(null);

  const [symbolDetails, setSymbolDetails] = useState({ ...symbolDetailsDefault });
  const [alertConfig, setAlertConfig] = useState(defaultAlertConfig);
  const [alertConfigArr, setAlertConfigArr] = useState([{ ...defaultAlertConfig }]);

  // const [batteryLife, setBatteryLife] = useState("");

  const [resetAutoComplete, setResetAutoComplete] = useState(false);

  const [top10List, setTop10List] = useState([]);

  const [selectedPlaylist, setSelectedPlaylist] = useState("");

  useEffect(() => {
    if (deviceId) {
      setHidden(false);
      getDevice();
      // getMyPlaylists();
    }
  }, [deviceId]);

  //** Call API to get the Device details from the server. */
  const getDevice = async () => {
    try {
      const {
        success,
        data: device,
        message,
        type,
      } = await http.get(`${ApiEndPoint(API_PATHS.GET_MY_DEVICES)}/${deviceId}`);

      if (success) {
        setDeviceDetails({ ...device });

        if (device?.isPlaylist) {
          setConfigType("playlist");
          setSelectedPlaylist(device.playlistId);
        } else {
          if (!device?.config) return;

          if (device.config.symbolType === SYMBOL_TYPES.CUSTOMAPI) {
            setConfigType("custom-api");
            return;
          }

          setConfigType("single");
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

          if (config.symbolType === SYMBOL_TYPES.ELECTRICITY) {
            savedSymbolDetails.searchSymbol = config.symbol;
            savedSymbolDetails.exactPrice = config.extraConfig.exactPrice ?? false;
            savedSymbolDetails.extras = extras || {};
            savedSymbolDetails.extras.addressValue = config.extraConfig?.addressValue ?? "";
            savedSymbolDetails.extras.fullAddress = config.extraConfig?.fullAddress ?? {};
          } else if (config.symbolType === SYMBOL_TYPES.FOREX) {
            savedSymbolDetails.searchSymbol = config.symbol.split("/")[0];
            savedSymbolDetails.currency = config.symbol.split("/")[1];
          } else if (config.symbolType === SYMBOL_TYPES.COMMODITY) {
            savedSymbolDetails.isMetalCommodity = config?.extraConfig?.isMetalCommodity ?? false;
            savedSymbolDetails.commodityUnit = config?.extraConfig?.commodityUnit ?? "";
          }

          savedSymbolDetails.extras = { ...savedSymbolDetails.extras, ...config?.extraConfig };

          setSymbolDetails(savedSymbolDetails);

          const streamDetails = {
            dataStream: config.stream,
            dataMarket: config.market,
            symbolType: config.symbolType,
            aggregateTime: config?.extraConfig?.aggregateTime ?? symbolDetailsDefault.aggregateTime ?? "1d",
            commodityUnit: config?.extraConfig?.commodityUnit ?? "",
            divideBy100: !!(
              config.market === DATA_MARKETS.UK_STOCKS &&
              (config?.extraConfig?.divideBy100 === undefined || config?.extraConfig?.divideBy100 === true)
            ),
          };

          searchForSymbol(config.symbol, config.currency, streamDetails);

          if (config?.alertEnabled) {
            const { alertConfig } = config;

            if (config.symbolType === SYMBOL_TYPES.ELECTRICITY) {
              setAlertConfig({
                ...defaultAlertConfig,
                enabled: true,
              });

              //check if old configuration exists and set it in array
              if (!config.alertConfigArr || config.alertConfigArr.length === 0) {
                setAlertConfigArr([
                  {
                    ...defaultAlertConfig,
                    ...alertConfig,
                  },
                ]);
              } else {
                setAlertConfigArr([...config.alertConfigArr]);
              }
            } else {
              setAlertConfig({
                enabled: config.alertEnabled,
                triggerType: alertConfig.triggerType ?? defaultAlertConfig.triggerType,
                triggerValue: alertConfig.triggerValue ?? defaultAlertConfig.triggerValue,
                flashLightbar: alertConfig.flashLightbar ?? defaultAlertConfig.flashLightbar,
                playSound: alertConfig.playSound ?? defaultAlertConfig.playSound,
                soundType: alertConfig.soundType ?? defaultAlertConfig.soundType,
                soundDur: alertConfig.soundDur ?? defaultAlertConfig.soundDur,
                changeLightBarColor: alertConfig.changeLightBarColor ?? defaultAlertConfig.changeLightBarColor,
                lightBarColor: alertConfig.lightBarColor ?? defaultAlertConfig.lightBarColor,
              });
            }
          } else {
            setAlertConfig(defaultAlertConfig);
          }
        }

        //setSymbolDetails({ symbolType:  });
        //reset({ ...device });
      } else {
        if (type === 1) setServerError(message);
        else setServerError("There is an error processing your request, Please try again later.");
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

  const getTop10Options = async () => {
    setLoading(true);
    try {
      if (top10List.length > 0) return top10List;

      const url = `${ApiEndPoint(API_PATHS.AUTO_COMPELETE_SEARCH)}/local-top10/local-top10?q=top10&t=7`;
      const { success, data: symbols } = await http.get(url);
      if (!success) return [];

      const options = symbols.map((symbol) => ({
        _id: symbol.symbol,
        name: `${symbol.symbol} - ${symbol.name}`,
      }));

      setTop10List(options);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getQuerySymbol = (symbolParam, currencyParam, symbolDetails) => {
    const { dataStream, dataMarket, symbolType, searchSymbol, currency } = symbolDetails;

    switch (symbolType) {
      case SYMBOL_TYPES.STOCK:
        if (
          [
            DATA_MARKETS.US_STOCKS,
            DATA_MARKETS.UK_STOCKS,
            DATA_MARKETS.CA_STOCKS,
            DATA_MARKETS.DK_STOCKS,
            DATA_MARKETS.SE_STOCKS,
          ].includes(dataMarket)
        ) {
          return symbolParam ?? searchSymbol;
        } else {
          return searchSymbol.replace(/[_ -]/g, ".");
        }
      case SYMBOL_TYPES.CRYPTO:
        return dataStream === DATA_STREAMS.COINGECKO ? symbolParam ?? searchSymbol : searchSymbol;
      case SYMBOL_TYPES.FOREX:
        return `${symbolParam ?? searchSymbol}/${currencyParam ?? currency}`;
      case SYMBOL_TYPES.INDICES:
      case SYMBOL_TYPES.ETF:
      case SYMBOL_TYPES.COMMODITY:
      case SYMBOL_TYPES.TOP10:
        return symbolParam ?? searchSymbol;
      case SYMBOL_TYPES.ELECTRICITY:
        return symbolParam ?? searchSymbol;
      case SYMBOL_TYPES.OPTIONS:
        return symbolParam ?? searchSymbol;

      default:
        throw new Error(`Invalid symbol type: ${symbolType}`);
    }
  };

  const searchForSymbol = async (symbolParam, currencyParam, streamDetails = null) => {
    try {
      setLoading(true);
      setStockQuote(null);
      setServerError(null);

      const querySymbol = getQuerySymbol(symbolParam, currencyParam, symbolDetails);

      const dataObject = {
        symbol: querySymbol.trim(),
        stream: streamDetails?.dataStream || symbolDetails.dataStream,
        market: streamDetails?.dataMarket || symbolDetails.dataMarket,
        type: streamDetails?.symbolType || symbolDetails.symbolType,
        currency:
          currencyParam ??
          symbolDetails.currency ??
          stockMarkets.find((dm) => dm._id === symbolDetails.dataMarket)?.currency ??
          "-",
        aggregateTime: streamDetails ? streamDetails.aggregateTime : symbolDetails.aggregateTime,
        unit: streamDetails
          ? streamDetails?.unit || streamDetails?.commodityUnit
          : symbolDetails?.isMetalCommodity
          ? symbolDetails?.commodityUnit || "perOunce"
          : "",
        divideBy100:
          streamDetails?.divideBy100 ??
          (symbolDetails.dataMarket === DATA_MARKETS.UK_STOCKS &&
            (symbolDetails?.extras?.divideBy100 === undefined || symbolDetails?.extras?.divideBy100 === true)),
      };

      const { success, data, message, type } = await http.post(
        `${ApiEndPoint(API_PATHS.SEARCH_SYMBOL_MARKET)}`,
        dataObject
      );

      if (success) {
        // const isDivideBy100 = streamDetails?.divideBy100 ?? data?.extras?.divideBy100;
        // if (isDivideBy100) {
        //   data.p2 = data.p / 100;
        //   const currSymbol = currencyList.find((curr) => curr.code === data.currency);
        //   data.price = currSymbol?.symbol + parseFloat(data?.p2?.toFixed(2));
        //   console.log(data);
        // }

        setStockQuote({ ...data });
        setStockQuotePercentage(data.percent);

        if ("commodityCategory" in data) {
          setSymbolDetails((prev) => ({
            ...prev,
            isMetalCommodity: data.commodityCategory === "Metals",
            commodityUnit:
              data.commodityCategory === "Metals" && prev.commodityUnit === "" ? "perOunce" : prev.commodityUnit,
          }));
        }

        setServerError(null);
      } else {
        if (type === 1) setServerError(message);
        else setServerError("There is an error processing your request, Please try again later.");
      }
    } catch (error) {
      console.error(error);
      setServerError("There is an error processing your request, Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
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

      const data = {
        stream: symbolDetails.dataStream,
        market: symbolDetails.dataMarket,
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
        showToast("success", "Success!", "Device configuration pushed successfully.");
        setHidden(true);
        setTimeout(() => {
          closeAndRefresh(true);
        }, 200);
        setServerError(null);
      } else {
        showToast(
          "danger",
          "Unable to push!",
          type === 1 ? message : "Unable to push device configuration, please try again later."
        );
      }
    } catch (error) {
      console.error(error);
      showToast("error", "Unable to push!", "Unable to push device configuration, please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const hideForm = (shouldRefresh = false) => {
    setHidden(true);

    setTimeout(() => {
      closeAndRefresh(shouldRefresh);
    }, 500);
  };

  const resetAlertQuoteAndPercentage = () => {
    //setAlertConfig(defaultAlertConfig);
    setStockQuote(null);
    setStockQuotePercentage(null);
  };

  // ** Render functions, in a function to clear the render function

  //** triggered on config form change */

  //** Single or Playlist button */

  //** Sent to tickrmeter button */

  return (
    <SlideDown className={"react-slidedown"}>
      {!hidden ? (
        <Card id="config-top">
          <CardHeader className={classNames({ "border-bottom": true, "justify-content-end": hidden })}>
            <CardTitle className={classNames({ "d-flex w-100 justify-content-between": !hidden })}>
              <>
                <h4>Config Device - {deviceDetails?.name || deviceDetails?.macAddress}</h4>
                <XCircle size={24} onClick={hideForm} style={{ cursor: "pointer" }} />
              </>
            </CardTitle>
          </CardHeader>

          {serverError && (
            <Alert color="danger" isOpen={serverError !== null} fade={true}>
              <div className="alert-body">
                <AlertCircle size={15} />
                <span className="ml-1">{serverError}</span>
              </div>
            </Alert>
          )}
          <Row className="justify-content-center device-config">
            <Col sm="12">
              <ConfigType configType={configType} setConfigType={setConfigType} />
              {/* <div className="d-flex mb-1 mt-1 symbolType justify-content-center flex-column align-items-center "></div> */}
              {configType === "single" && (
                <>
                  <SymbolTypeSelection
                    defaults={symbolDetailsDefault}
                    symbolDetailsState={{ itemDetails: symbolDetails, setItemDetails: setSymbolDetails }}
                    setItemDetails={setSymbolDetails}
                    resetFuncs={{ setResetAutoComplete, resetAlertQuoteAndPercentage }}
                    top10Opts={{ showTop10: true, getTop10Options }}
                    mode="single"
                  />
                  <ConfigRenderer
                    symbolDetailsState={{ symbolDetails, setSymbolDetails }}
                    funcs={{ resetAlertQuoteAndPercentage, searchForSymbol, resetAutoComplete }}
                    stockQuoteState={{ stockQuote, setStockQuote, stockQuotePercentage, setStockQuotePercentage }}
                    others={{ loading, setLoading, top10List, setResetAutoComplete }}
                  />
                  {stockQuote && (
                    <>
                      {symbolDetails.symbolType !== SYMBOL_TYPES.ELECTRICITY ? (
                        <CreateAlert symbolDetails={symbolDetails} alertState={{ alertConfig, setAlertConfig }} />
                      ) : (
                        <CreateAlertNew
                          symbolDetails={symbolDetails}
                          alertState={{ alertConfig, setAlertConfig }}
                          alertStateArr={{ alertConfigArr, setAlertConfigArr }}
                        />
                      )}
                    </>
                  )}
                  <SendToTickrmeterButton
                    symbolDetails={symbolDetails}
                    saveConfig={saveConfig}
                    alertConfig={alertConfig}
                    alertConfigArr={alertConfigArr}
                    stockQuote={stockQuote}
                    loading={loading}
                  />
                  <DeviceOutput
                    stockQuote={stockQuote}
                    stockQuotePercentage={stockQuotePercentage}
                    electricityAddress={symbolDetails?.extras?.addressValue || null}
                    extras={symbolDetails?.extras}
                  />
                </>
              )}
              {configType === "playlist" && (
                <SelectPlaylist
                  deviceId={deviceId}
                  hideForm={hideForm}
                  selectedPlaylistSt={{ selectedPlaylist, setSelectedPlaylist }}
                />
              )}
              {configType === "custom-api" && (
                <CustomAPIConfig
                  setServerError={setServerError}
                  deviceDetails={deviceDetails}
                  setHidden={setHidden}
                  closeAndRefresh={closeAndRefresh}
                />
              )}
            </Col>
          </Row>
        </Card>
      ) : null}
    </SlideDown>
  );
};

export default DeviceConfig;
