import { Col, FormGroup, Label, Row } from "reactstrap";
import SearchSymbolComponent from "../SearchSymbolComponent";
import { getSearchLabel } from "../../helper2";
import { SupportedCurrencySymbols } from "../../helper";

import { useDeviceConfig } from "../../contexts/DeviceConfigContext";
import { useDeviceConfigActions } from "../../hooks/useDeviceConfigActions";
import { useSymbolSearch } from "@device-config/hooks/useSymbolSearch";
import { CheckBoxField, SelectFieldCustom } from "@src/utility/input-fields";

import SearchButton from "../common/SearchButton";
import { currencyCodes } from "../constants";
import { ReactSelect } from "@src/utility/input-fields-select";
import { useEffect, useRef, useState } from "react";
const formatCurrencyOptions = () => {
  return currencyCodes.map(({ code, name, symbol }) => ({
    value: code,
    label: `${code} - ${name} - (${symbol})`,
  }));
};

const cryptoSources = [
  { _id: "tradingview", name: "TradingView" },
  { _id: "coingecko", name: "Coingecko" },
];

const CoingeckoConfig = ({ setSymbolForSearch, resetAutoComplete, mode }) => {
  const {
    state: { symbolDetails },
  } = useDeviceConfig();

  const { setStockQuote, setStockQuotePercentage, setSymbolDetails } = useDeviceConfigActions();

  const { symbolType, searchSymbol, currency } = symbolDetails;

  const { searchForSymbol } = useSymbolSearch();

  const onCurrencyChange = ({ target }) => {
    setSymbolDetails({ ...symbolDetails, currency: target.value });
    if (searchSymbol) {
      searchForSymbol(searchSymbol, target.value);
    }
  };

  const onDataStreamChange = ({ target }) => {
    setSymbolDetails({ ...symbolDetails, dataStream: target.value, searchSymbol: "" });
    setStockQuote(null);
    setStockQuotePercentage(null);
  };

  return (
    <>
      <>
        <Row className="justify-content-center">
          <Col xs="12" lg="8" className="mt-1 d-flex justify-content-end ">
            <CheckBoxField
              className="mb-0"
              name="manualSearch"
              label="Manual Search"
              onChange={(e) => {
                setSymbolDetails({
                  ...symbolDetails,
                  extras: { ...symbolDetails.extras, manualSearch: e.target.checked },
                });
                setStockQuote(null);
                setStockQuotePercentage(null);
              }}
              checked={symbolDetails?.extras?.manualSearch}
            />
          </Col>
        </Row>
        {/* {symbolDetails?.extras?.manualSearch ? <ManualSearch mode={mode} /> : <MarketSymbolFinder mode={mode} />} */}
      </>
      {symbolDetails?.extras?.manualSearch ? (
        <>
          <Row className="justify-content-center">
            <Col xs="12" lg="8" className="mt-1">
              <FormGroup>
                <div>
                  <SelectFieldCustom
                    name="dataStream"
                    label="Source"
                    onChange={onDataStreamChange}
                    value={symbolDetails.dataStream}
                    placeholder="Select crypto source ..."
                    options={cryptoSources}
                  />
                </div>
              </FormGroup>
            </Col>
          </Row>
        </>
      ) : (
        <></>
      )}
      <Row className="justify-content-center">
        <Col xs="12" lg="8" className="mt-1">
          <FormGroup>
            <div className="symbol-label">
              <Label for={"symbolSearch"}>{getSearchLabel(symbolType)}</Label>
            </div>

            <SearchSymbolComponent
              onSearchClick={(symbol) => setSymbolForSearch(symbol, false)}
              reset={resetAutoComplete}
              _searchTerm={searchSymbol}
              addItemToList={symbolDetails?.extras?.manualSearch ?? false}
            />
          </FormGroup>
        </Col>
      </Row>

      <Row className="justify-content-center">
        <Col xs="12" lg="8" className="mt-1">
          <ReactSelect
            name="currency"
            label="Base Currency"
            onChange={onCurrencyChange}
            value={currency}
            placeholder="Select a currency ..."
            options={formatCurrencyOptions()}
            additionalJXS={mode === "single" ? <SearchButton position="right" /> : ""}
          />
        </Col>
      </Row>
    </>
  );
};

export default CoingeckoConfig;
