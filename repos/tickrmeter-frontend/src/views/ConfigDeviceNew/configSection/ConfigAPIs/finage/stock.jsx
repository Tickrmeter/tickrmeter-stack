import { Col, FormGroup, FormText, Input, InputGroup, InputGroupAddon, Label, Row } from "reactstrap";
import SearchSymbolComponent from "@device-config/configSection/SearchSymbolComponent";
import {
  DATA_MARKETS,
  getSearchLabel,
  SYMBOL_TYPES,
  DATA_STREAMS,
  isSymbolSearchAvailable,
  renderExchangeSymbolsList,
} from "@src/views/ConfigDeviceNew/helper2";
import { CheckBoxField, SelectField } from "@src/utility/input-fields";

const FinageStockConfig = (props) => {
  const {
    symbolDetails,
    setSymbolDetails,
    setSymbolForSearch,
    onConfigChange,
    getSearchButtonForAutoComplete,
    resetAutoComplete,
    renderAddButton,
  } = props;
  const { symbolType, dataStream, dataMarket, searchSymbol } = symbolDetails;

  return (
    <>
      <Row className="justify-content-center">
        <Col xs="12" lg="8" className="mt-1">
          <FormGroup>
            <div className="symbol-label">
              <Label for={"symbolSearch"}>{getSearchLabel(symbolType)}</Label>
              {renderExchangeSymbolsList(dataMarket, "symbol-links")}
            </div>

            {isSymbolSearchAvailable(dataStream, dataMarket) ? (
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
            ) : (
              <>
                <InputGroup>
                  <Input
                    name="symbolSearch"
                    placeholder={`${
                      symbolType === SYMBOL_TYPES.STOCK
                        ? "TSLA"
                        : symbolType === SYMBOL_TYPES.FOREX
                        ? "USD"
                        : symbolType === SYMBOL_TYPES.CRYPTO
                        ? "BTC"
                        : ""
                    }`}
                    onChange={({ target }) =>
                      onConfigChange({ name: "searchSymbol", value: target.value.toUpperCase() })
                    }
                    style={{ textTransform: "uppercase" }}
                    value={searchSymbol}
                  />

                  {!(dataStream === DATA_STREAMS.POLYGON && dataMarket === DATA_MARKETS.CRYPTO) && (
                    <InputGroupAddon addonType="append">{renderAddButton()}</InputGroupAddon>
                  )}
                </InputGroup>
              </>
            )}
          </FormGroup>
        </Col>
      </Row>
      {dataMarket === DATA_MARKETS.UK_STOCKS && (
        <Row className="justify-content-center">
          <Col xs="12" lg="8" className="mt-1">
            <FormGroup>
              <SelectField
                name="currency"
                label="Select Currency"
                onChange={({ target }) => onConfigChange({ name: "currency", value: target.value })}
                value={symbolDetails.currency}
                placeholder="Select stock currency  ..."
                options={[
                  { _id: "GBP", name: "GBP" },
                  { _id: "GBX", name: "GBX" },
                  { _id: "USD", name: "USD" },
                  { _id: "EUR", name: "EUR" },
                ]}
                formText={
                  <div className="">
                    <FormText color="muted" className="mb-1 font-italic">
                      On LSE, securities are listed in different Currencies. please select the correct currency
                    </FormText>
                    <CheckBoxField
                      name="divideBy100"
                      label="Divide by 100"
                      onChange={({ target }) => {
                        setSymbolDetails((prev) => ({
                          ...prev,
                          extras: { ...prev.extras, divideBy100: target.checked },
                        }));
                      }}
                      className="mt-1"
                      checked={symbolDetails.extras?.divideBy100 ?? true}
                    />
                  </div>
                }
              />
            </FormGroup>
          </Col>
        </Row>
      )}
    </>
  );
};

export default FinageStockConfig;
