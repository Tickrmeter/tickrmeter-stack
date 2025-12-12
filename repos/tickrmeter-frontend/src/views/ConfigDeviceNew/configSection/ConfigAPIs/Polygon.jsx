import {
  Col,
  CustomInput,
  Form,
  FormGroup,
  FormText,
  Input,
  InputGroup,
  InputGroupAddon,
  Label,
  Row,
} from "reactstrap";
import SearchSymbolComponent from "../SearchSymbolComponent";
import { DATA_MARKETS, getSearchLabel, SYMBOL_TYPES } from "../../helper2";
import { currencyOptions } from "../../helper";
import { useEffect, useState } from "react";
import { DateTime } from "luxon";
import { DatePicker } from "reactstrap-date-picker";
import { CheckBoxField } from "@src/utility/input-fields";
import { useDeviceConfig } from "../../contexts/DeviceConfigContext";
import { useDeviceConfigActions } from "../../hooks/useDeviceConfigActions";
import SearchButton from "../common/SearchButton";

const PolygonConfig = ({ mode }) => {
  const {
    state: { symbolDetails },
  } = useDeviceConfig();

  const { setSymbolDetails } = useDeviceConfigActions();

  const { symbolType, dataStream, dataMarket, searchSymbol, currency } = symbolDetails;

  const [showOptionSearch, setShowOptionSearch] = useState(true);

  return (
    <>
      {symbolType === SYMBOL_TYPES.OPTIONS && (
        <Row className="justify-content-center">
          <Col xs="12" lg="8">
            <FormGroup>
              <CheckBoxField
                label="Show Options Search"
                name="showOptionSearch"
                checked={showOptionSearch}
                onChange={({ target }) => setShowOptionSearch(target.checked)}
                className="mb-0"
              />
            </FormGroup>
          </Col>
        </Row>
      )}
      <Row className="justify-content-center">
        <Col xs="12" lg="8" className="mt-1">
          <FormGroup>
            {symbolType === SYMBOL_TYPES.STOCK ? (
              <></>
            ) : symbolType === SYMBOL_TYPES.OPTIONS && showOptionSearch ? (
              <>
                <OptionsSearch
                  symbolDetails={symbolDetails}
                  setSymbolDetails={setSymbolDetails}
                  mode={mode}
                  // renderAddButton={<renderAddButton>}
                />
              </>
            ) : (
              <>
                <div className="symbol-label">
                  <Label for={"symbolSearch"}>{getSearchLabel(symbolType)}</Label>
                </div>
                <InputGroup>
                  <Input
                    name="symbolSearch"
                    placeholder={`${symbolType === SYMBOL_TYPES.CRYPTO ? "BTC" : ""}`}
                    onChange={({ target }) =>
                      setSymbolDetails({ ...symbolDetails, searchSymbol: target.value.toUpperCase() })
                    }
                    style={{ textTransform: "uppercase" }}
                    value={searchSymbol}
                  />

                  {/* {dataMarket !== DATA_MARKETS.CRYPTO  && ( */}
                  {mode === "single" && <InputGroupAddon addonType="append">{<SearchButton />}</InputGroupAddon>}
                  {/* )} */}
                </InputGroup>
              </>
            )}
          </FormGroup>
        </Col>
      </Row>
    </>
  );
};

export default PolygonConfig;

//const expirationDateFormat = "yyMMdd";
const OptionsSearch = (props) => {
  const [optionsConfig, setOptionsConfig] = useState({
    tickerSymbol: "",
    underlyingStock: "",
    expirationDate: "",
    callPutOpt: "",
    strikePrice: "",
  });
  const { symbolDetails, setSymbolDetails, mode } = props;
  const [optionsTickerSymbol, setOptionsTickerSymbol] = useState(symbolDetails?.searchSymbol);

  useEffect(() => {
    if (!symbolDetails?.searchSymbol) return;
    const _tickerOpts = parseOptionTicker(symbolDetails?.searchSymbol) || "";

    //console.log(symbolDetails?.searchSymbol, _tickerOpts);

    const { expirationDate } = _tickerOpts;

    const _expirationDate = expirationDate ? DateTime.fromFormat(_tickerOpts.expirationDate, "yyMMdd").toISODate() : "";

    _tickerOpts.expirationDate = _expirationDate;

    setOptionsConfig({ ..._tickerOpts });
  }, []);

  useEffect(() => {
    const tickerSymbol = makeOptionsTickerSymbol();

    setSymbolDetails({ ...symbolDetails, searchSymbol: tickerSymbol });
  }, [optionsConfig]);

  const makeOptionsTickerSymbol = () => {
    const { underlyingStock, expirationDate, callPutOpt, strikePrice } = optionsConfig;

    const _expDate = expirationDate ? DateTime.fromISO(expirationDate).toFormat("yyMMdd") : "";

    const _optionsTickerSymbol =
      underlyingStock === "" && _expDate === "" && callPutOpt === "" && strikePrice === ""
        ? ""
        : `${underlyingStock.toUpperCase()}${_expDate}${callPutOpt.toUpperCase()}${strikePrice}`;

    setOptionsTickerSymbol(_optionsTickerSymbol);
    return _optionsTickerSymbol;
  };

  const parseOptionTicker = (tickerSymbol) => {
    if (!tickerSymbol) return {};

    const regex = /^([A-Z]+)(\d{6})([CP])(\d{8,9})$/;
    const match = tickerSymbol.match(regex);

    if (!match) {
      console.error(tickerSymbol, "Invalid option ticker format");
      return null;
    }

    const [, underlyingStock, expirationString, optionTypeChar, strikePriceString] = match;

    const year = parseFloat(expirationString.slice(0, 2)) + 2000;
    const month = parseFloat(expirationString.slice(2, 4));
    const day = parseFloat(expirationString.slice(4, 6));
    const expirationDate = DateTime.utc(year, month, day);

    const optionType = optionTypeChar.toUpperCase();

    return {
      tickerSymbol,
      underlyingStock,
      expirationDate: expirationDate.toFormat("yyMMdd"),
      callPutOpt: optionType,
      strikePrice: strikePriceString,
    };
  };

  const handleChange = (v, f) => {
    const expirationDate = v ? DateTime.fromISO(v).toISODate() : "";
    setOptionsConfig({ ...optionsConfig, expirationDate });
  };

  const formatStrikePrice = (strikePrice) => {
    // Multiply the strike price by 1000 to get the correct format (to handle 5 decimal places)
    const formattedPrice = (strikePrice * 1000).toFixed(0);
    // Pad with leading zeros to make sure the result is always 8 digits
    return formattedPrice.padStart(8, "0");
  };

  const parseStrikePrice = (formattedPrice) => (formattedPrice ? parseFloat(formattedPrice, 10) / 1000 : "");

  return (
    <>
      {/* <Row>
        <Col xs="12" lg="6">
          <FormText color="muted" className="font-italic">
            {optionsTickerSymbol}
          </FormText>
        </Col>
      </Row> */}
      <Row>
        <Col xs="12" lg="6">
          <FormGroup>
            <div className="symbol-label">
              <Label for={"symbolSearch"}>Ticker</Label>
            </div>

            <Input
              name="underlyingStock"
              onChange={({ target }) =>
                setOptionsConfig({ ...optionsConfig, underlyingStock: target.value.toUpperCase() })
              }
              style={{ textTransform: "uppercase" }}
              value={optionsConfig.underlyingStock}
            />
          </FormGroup>
        </Col>
        <Col xs="12" lg="6">
          <FormGroup>
            <div className="symbol-label">
              <Label for="date">Expiration Date</Label>
            </div>

            <DatePicker
              id="expirationDate"
              name="expirationDate"
              value={optionsConfig.expirationDate}
              onChange={(v, f) => handleChange(v, f)}
              onClear={() => setOptionsConfig({ ...optionsConfig, expirationDate: "" })}
              dateFormat="YYYY-MM-DD"
              minDate={DateTime.now({ tz: "America/New_York" }).toFormat("yyyy-MM-dd")}
              maxDate={DateTime.now({ tz: "America/New_York" }).plus({ years: 2 }).toFormat("yyyy-MM-dd")}
            />
          </FormGroup>
        </Col>
        <Col xs="12" lg="6">
          <FormGroup>
            <div className="symbol-label">
              <Label for="date">Stike Price</Label>
            </div>

            <Input
              name="strikePrice"
              onChange={({ target }) =>
                setOptionsConfig({ ...optionsConfig, strikePrice: formatStrikePrice(target.value) })
              }
              type="number"
              style={{ textTransform: "uppercase" }}
              value={parseStrikePrice(optionsConfig.strikePrice)}
            />
          </FormGroup>
        </Col>
        <Col xs="12" lg="6" className="d-flex align-items-center">
          <CustomInput
            type="radio"
            id={`optionsCall-rbtn`}
            name="optionsCallPut"
            className="mt-1 mr-3"
            label="Call"
            onChange={() => setOptionsConfig({ ...optionsConfig, callPutOpt: "C" })}
            checked={optionsConfig.callPutOpt === "C"}
          />
          <CustomInput
            type="radio"
            id={`optionsPut-rbtn`}
            name="optionsCallPut"
            className="mt-1"
            label="Put"
            onChange={() => setOptionsConfig({ ...optionsConfig, callPutOpt: "P" })}
            checked={optionsConfig.callPutOpt === "P"}
          />
        </Col>
      </Row>

      {mode === "single" && (
        <Row>
          <Col xs="12" lg="8">
            <FormGroup className="mt-2">{<SearchButton />}</FormGroup>
          </Col>
        </Row>
      )}

      <></>
    </>
  );
};
