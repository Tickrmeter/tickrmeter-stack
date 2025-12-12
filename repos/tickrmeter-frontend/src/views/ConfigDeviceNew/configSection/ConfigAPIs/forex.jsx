import { Col, FormGroup, Label, Row } from "reactstrap";
import SearchSymbolComponent from "../SearchSymbolComponent";
import { getSearchLabel } from "../../helper2";
import { useDeviceConfig } from "@src/views/ConfigDeviceNew/contexts/DeviceConfigContext";

const ForexConfig = ({ setSymbolForSearch, resetAutoComplete }) => {
  const { state } = useDeviceConfig();
  const { symbolDetails } = state;

  const { symbolType, searchSymbol, currency } = symbolDetails;

  return (
    <>
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
            />
          </FormGroup>
        </Col>
      </Row>
      <Row className="justify-content-center">
        <Col xs="12" lg="8" className="mt-1">
          <FormGroup>
            <Label for="currency">Target Currency</Label>

            <SearchSymbolComponent
              onSearchClick={(symbol) => setSymbolForSearch(symbol, true)}
              _searchTerm={currency}
            />
          </FormGroup>
        </Col>
      </Row>
    </>
  );
};

export default ForexConfig;
