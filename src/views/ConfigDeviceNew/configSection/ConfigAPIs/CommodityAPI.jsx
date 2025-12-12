import { Col, FormGroup, Label, Row } from "reactstrap";
import SearchSymbolComponent from "../SearchSymbolComponent";

import { getSearchLabel, renderExchangeSymbolsList } from "../../helper2";
import { commoditiesCurrencyList } from "../../helper";
import { useSymbolSearch } from "../../hooks/useSymbolSearch";
import { SelectField, SelectFieldCustom } from "@src/utility/input-fields";
import { useDeviceConfig } from "../../contexts/DeviceConfigContext";
import { useDeviceConfigActions } from "../../hooks/useDeviceConfigActions";
import SearchButton from "../common/SearchButton";

const CommodityAPIConfig = (props) => {
  const { setSymbolForSearch, resetAutoComplete, mode } = props;

  const { state } = useDeviceConfig();
  const { symbolDetails, currency } = state;
  const { setSymbolDetails } = useDeviceConfigActions();

  const { symbolType, dataMarket, searchSymbol } = symbolDetails;

  const { searchForSymbol } = useSymbolSearch();

  const onCurrencyChange = ({ target }) => {
    setSymbolDetails({ ...symbolDetails, currency: target.value });
    if (searchSymbol) {
      searchForSymbol(searchSymbol, target.value);
    }
  };

  return (
    <>
      <Row className="justify-content-center">
        <Col xs="12" lg="8" className="mt-1">
          <FormGroup>
            <div className="symbol-label">
              <Label for={"symbolSearch"}>{getSearchLabel(symbolType)}</Label>
              {renderExchangeSymbolsList(dataMarket, "symbol-links")}
            </div>
            <SearchSymbolComponent
              onSearchClick={(symbol) => setSymbolForSearch(symbol, false)}
              reset={resetAutoComplete}
              _searchTerm={searchSymbol}
            />
          </FormGroup>
        </Col>
      </Row>
      <Row className="justify-content-center">
        <Col xs="12" lg="8" className="mt-1">
          <FormGroup>
            <div>
              <SelectFieldCustom
                name="currency"
                label="Base Currency"
                onChange={onCurrencyChange}
                value={currency}
                placeholder="Select a currency ..."
                options={commoditiesCurrencyList}
                additionalJXS={mode === "single" ? <SearchButton /> : ""}
              />
            </div>
          </FormGroup>
        </Col>
      </Row>
      {symbolDetails.isMetalCommodity && (
        <Row className="justify-content-center">
          <Col xs="12" lg="8" className="mt-1">
            <FormGroup>
              <SelectField
                name="commodityUnit"
                label="Select Unit"
                onChange={({ target }) => setSymbolDetails({ ...symbolDetails, commodityUnit: target.value })}
                value={symbolDetails.commodityUnit}
                placeholder="Select a unit ..."
                options={[
                  { _id: "perOunce", name: "Ounce" },
                  { _id: "perPound", name: "Pound" },
                  { _id: "perGram", name: "Gram" },
                  { _id: "perKg", name: "Kg" },
                ]}
              />
            </FormGroup>
          </Col>
        </Row>
      )}
    </>
  );
};

export default CommodityAPIConfig;
