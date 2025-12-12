import { Col, FormGroup, Label, Row } from "reactstrap";
import SearchSymbolComponent from "../../SearchSymbolComponent";
import { getSearchLabel, SYMBOL_TYPES } from "../../../helper2";
import { CheckBoxField, SelectField } from "@src/utility/input-fields";
import { useState } from "react";

const ETFAndIndicesConfig = (props) => {
  const { symbolDetails, setSymbolForSearch, onConfigChange, resetAutoComplete, getSearchButtonForAutoComplete } =
    props;

  const { symbolType, dataStream, dataMarket, searchSymbol } = symbolDetails;

  // const [showCurrency, setShowCurrency] = useState(currency !== "-");

  const getCurrencyOpts = () => {
    const _currencyOpts = [
      { _id: "-", name: "No Currency" },
      { _id: "USD", name: "USD" },
      { _id: "GBP", name: "GBP" },
      { _id: "EUR", name: "EUR" },
    ];

    return symbolType === SYMBOL_TYPES.INDICES ? _currencyOpts : _currencyOpts.slice(1);
  };

  return (
    <>
      <Row className="justify-content-center">
        <Col xs="12" lg="8" className="mt-1">
          <FormGroup>
            <div className="symbol-label">
              <Label for={"symbolSearch"}>{getSearchLabel(symbolType)}</Label>
            </div>

            <SearchSymbolComponent
              symbolType={symbolType}
              dataStream={dataStream}
              dataMarket={dataMarket}
              onSearchClick={(symbol) => setSymbolForSearch(symbol, false)}
              searchButton={getSearchButtonForAutoComplete()}
              onConfigChange={onConfigChange}
              reset={resetAutoComplete}
              _searchTerm={searchSymbol}
            />
          </FormGroup>
        </Col>
      </Row>
      {/* {symbolType === SYMBOL_TYPES.INDICES && (
        <Row className="justify-content-center">
          <Col xs="12" lg="8" className="mt-1">
            <CheckBoxField
              name="showCurrency"
              onChange={({ target }) => {
                setShowCurrency(target.checked);
                onConfigChange({ name: "currency", value: target.checked ? "USD" : "-" });
              }}
              label="Show Currency?"
              className="mt-1"
              checked={showCurrency}
            />
          </Col>
        </Row>
      )} */}
      {/* {(symbolType === SYMBOL_TYPES.ETF || showCurrency) && ( */}
      <Row className="justify-content-center">
        <Col xs="12" lg="8" className="mt-1">
          <FormGroup>
            <SelectField
              name="currency"
              label="Select Currency"
              onChange={({ target }) => onConfigChange({ name: "currency", value: target.value })}
              value={symbolDetails.currency}
              placeholder="Select stock currency  ..."
              options={getCurrencyOpts()}
            />
          </FormGroup>
        </Col>
      </Row>
      {/* )} */}
    </>
  );
};

export default ETFAndIndicesConfig;
