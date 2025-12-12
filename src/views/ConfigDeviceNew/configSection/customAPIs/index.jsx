import { useEffect, useState } from "react";
import http from "@src/utility/http";
import { InputField, SelectField } from "@src/utility/input-fields";
import { Button, Col, FormGroup, Row, Spinner } from "reactstrap";
import { DATA_MARKETS, DATA_STREAMS, getIntervalOptions, SYMBOL_TYPES } from "./../../helper2";
import { API_PATHS, ApiEndPoint } from "@src/redux/api-paths";
import DeviceOutput from "../DeviceOutput";
import { ledBrightnessOptions, symbolDetailsDefault } from "../../helper";
import SendToTickrmeterButton from "../SendToTickrmeterButton";
import { showToast } from "@src/utility/toast-content";

const customSymbolDetailsDefaults = {
  dataStream: DATA_STREAMS.CUSTOMAPI,
  symbolType: SYMBOL_TYPES.CUSTOMAPI,
  dataMarket: DATA_MARKETS.CUSTOMAPI,
  ledBrightness: "100",
  interval: "5",
  searchSymbol: "",
  placeholder1: { key: "", value: "" },
  placeholder2: { key: "", value: "" },
  placeholder3: { key: "", value: "" },
  placeholder4: { key: "", value: "" },
  extraConfig: {
    placeholder1: "",
    placeholder2: "",
    placeholder3: "",
    placeholder4: "",
  },
};

const isValidURL = (url) => {
  const urlRegex = new RegExp(
    "^(https?://)" + // protocol (mandatory)
      "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // domain name
      "((\\d{1,3}\\.){3}\\d{1,3}))" + // OR ip (v4) address
      "(\\:\\d+)?(\\/[-a-z\\d%_.~+:]*)*" + // port and path (including colons)
      "(\\?[;&a-z\\d%_.~+=-]*)?" + // query string
      "(\\#[-a-z\\d_]*)?$",
    "i"
  );
  return urlRegex.test(url);
};

const CustomAPIConfig = ({ setServerError, deviceDetails, setHidden, closeAndRefresh }) => {
  const [customAPIData, setCustomAPIData] = useState(customSymbolDetailsDefaults);
  const [formatedData, setFormattedData] = useState([]);
  const [loading, isLoading] = useState(false);

  useEffect(() => {
    if (deviceDetails?._id) {
      setCustomConfig();
    }
  }, [deviceDetails.config.symbolType]);

  const setCustomConfig = async () => {
    const { config } = deviceDetails;

    if (config.symbolType !== SYMBOL_TYPES.CUSTOMAPI) return;

    const apiData = await fetchAPIData(config?.symbol);

    const getPlaceholderValue = (phKey) => {
      return {
        key: phKey,
        value: apiData.find((item) => item.key === phKey)?.value ?? "",
      };
    };

    const { customAPIMapping } = config.extraConfig;

    setCustomAPIData({
      ...config,
      searchSymbol: config?.symbol,
      placeholder1: getPlaceholderValue(customAPIMapping?.placeholder1),
      placeholder2: getPlaceholderValue(customAPIMapping?.placeholder2),
      placeholder3: getPlaceholderValue(customAPIMapping?.placeholder3),
      placeholder4: getPlaceholderValue(customAPIMapping?.placeholder4),
    });
  };

  const saveConfig = async () => {
    try {
      isLoading(true);

      const data = {
        ...symbolDetailsDefault,
        stream: DATA_STREAMS.CUSTOMAPI,
        market: DATA_MARKETS.CUSTOMAPI,
        deviceId: deviceDetails._id,
        interval: customAPIData.interval || symbolDetailsDefault.interval,
        symbol: customAPIData.searchSymbol,
        symbolUI: "Custom API",
        type: SYMBOL_TYPES.CUSTOMAPI,
        currency: "-",
        ledBrightness: customAPIData.ledBrightness,
        extraConfig: {
          customAPIMapping: {
            layout: "1",
            placeholder1: customAPIData.placeholder1.key,
            placeholder2: customAPIData.placeholder2.key,
            placeholder3: customAPIData.placeholder3.key,
            placeholder4: customAPIData.placeholder4.key,
          },
        },
        dataStream: undefined,
        dataMarket: undefined,
      };

      //console.log(data);

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
    } finally {
      isLoading(false);
    }
  };

  const fetchAPIData = async (url) => {
    try {
      isLoading(true);
      setServerError(null);

      // if (url !== customAPIData.searchSymbol) {

      setCustomAPIData({
        ...customAPIData,
        placeholder1: customSymbolDetailsDefaults.placeholder1,
        placeholder2: customSymbolDetailsDefaults.placeholder2,
        placeholder3: customSymbolDetailsDefaults.placeholder3,
        placeholder4: customSymbolDetailsDefaults.placeholder4,
      });
      setFormattedData([]);

      const dataObject = {
        stream: DATA_STREAMS.CUSTOMAPI,
        market: DATA_MARKETS.CUSTOMAPI,
        symbol: url || customAPIData.searchSymbol,
        type: SYMBOL_TYPES.CUSTOMAPI,
        currency: "-",
      };

      const { success, data, message } = await http.post(`${ApiEndPoint(API_PATHS.SEARCH_SYMBOL_MARKET)}`, dataObject);

      if (!success) {
        console.error(message);
        setServerError(message.error);
        return;
      }

      setFormattedData(data);
      return data;
    } catch (error) {
      console.error(error);
    } finally {
      isLoading(false);
    }
  };

  const onPlaceholderChange = (key, value) => {
    const placeholderVal = formatedData.find((item) => item.key === value)?.value ?? "";
    setCustomAPIData({
      ...customAPIData,
      [key]: { key: value, value: placeholderVal },
      extraConfig: { ...customAPIData.extraConfig, [key]: value },
    });
  };

  return (
    <div className="px-2 pb-2">
      <Row className="justify-content-center">
        <Col xs="12" lg="8" className="mt-1">
          <FormGroup>
            <InputField
              name={`customAPIURL`}
              labelClassName="w-100"
              label={
                <div className="d-flex justify-content-between">
                  <div>API URL</div>
                  <div className="form-text text-muted">(e.g. https://api.example.com)</div>
                </div>
              }
              value={customAPIData.searchSymbol}
              onChange={(e) => setCustomAPIData({ ...customAPIData, searchSymbol: e.target.value })}
              error={
                customAPIData.searchSymbol === "" || isValidURL(customAPIData.searchSymbol?.trim())
                  ? null
                  : { message: "Invalid URL" }
              }
            />
            <Button
              color="primary"
              className="mt-2"
              onClick={() => fetchAPIData(null)}
              disabled={!isLoading || !isValidURL(customAPIData.searchSymbol)}
            >
              {loading ? <Spinner /> : "Fetch Data"}
            </Button>
          </FormGroup>
        </Col>
      </Row>
      {formatedData.length > 0 && (
        <>
          <Row className="justify-content-center">
            <Col xs="12" lg="8" className="mt-1">
              <SelectField
                name="ledBrightness"
                label="LED Brightness"
                options={ledBrightnessOptions}
                onChange={({ target }) => setCustomAPIData({ ...customAPIData, ledBrightness: target.value })}
                value={customAPIData.ledBrightness}
              />
            </Col>
          </Row>
          <Row className="justify-content-center">
            <Col xs="12" lg="8" className="mt-1">
              <SelectField
                name="interval"
                label="Interval"
                options={getIntervalOptions(DATA_STREAMS.CUSTOMAPI)}
                onChange={({ target }) => setCustomAPIData({ ...customAPIData, interval: target.value })}
                value={customAPIData.interval}
              />
            </Col>
          </Row>
          <Row className="justify-content-center">
            <Col xs="12" lg="8" className="mt-1">
              <PlaceHolder
                name="placeholder1"
                options={formatedData}
                onPlaceholderChange={onPlaceholderChange}
                value={customAPIData.placeholder1}
                label="Placeholder 1"
              />
              <PlaceHolder
                name="placeholder2"
                options={formatedData}
                onPlaceholderChange={onPlaceholderChange}
                value={customAPIData.placeholder2}
                label="Placeholder 2"
              />
              <PlaceHolder
                name="placeholder3"
                options={formatedData}
                onPlaceholderChange={onPlaceholderChange}
                value={customAPIData.placeholder3}
                label="Placeholder 3"
              />
              <PlaceHolder
                name="placeholder4"
                options={formatedData}
                onPlaceholderChange={onPlaceholderChange}
                value={customAPIData.placeholder4}
                label="Placeholder 4"
              />
            </Col>
          </Row>
          <Row className="justify-content-center">
            <Col xs="12" lg="8" className="mt-1">
              <DeviceOutput
                stockQuote={{
                  symbol: customAPIData?.placeholder1?.value?.toString() || "P1",
                  price: customAPIData?.placeholder2?.value?.toString() || "P2",
                  date: customAPIData?.placeholder3?.value?.toString() || "P3",
                }}
                stockQuotePercentage={customAPIData.placeholder4.value.toString() || "P4"}
              />
            </Col>
          </Row>
          <SendToTickrmeterButton
            symbolDetails={customAPIData}
            alertConfig={{}}
            alertConfigArr={[]}
            stockQuote={customAPIData}
            loading={loading}
            saveConfig={saveConfig}
          />
        </>
      )}
    </div>
  );
};

export default CustomAPIConfig;

const PlaceHolder = ({ options, onPlaceholderChange, value, label, name }) => {
  return (
    <Row>
      <Col xs="12" lg="8" className="mt-1">
        <FormGroup>
          <SelectField
            className="w-[200px]"
            name={name}
            label={label}
            id={name}
            placeholder={`Select ${label}`}
            options={options.map((item) => {
              return {
                _id: item.key,
                name: item.key,
              };
            })}
            onChange={(e) => onPlaceholderChange(name, e.target.value)}
            value={value?.key}
          />
        </FormGroup>
      </Col>
      <Col xs="12" lg="4" className="mt-1 align-items-end d-flex">
        <FormGroup>
          <span>{value?.value}</span>
        </FormGroup>
      </Col>
    </Row>
  );
};
