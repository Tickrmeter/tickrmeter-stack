import { Col, FormGroup, Row } from "reactstrap";
import { useDeviceConfig } from "../contexts/DeviceConfigContext";
import { SYMBOL_TYPES } from "@device-config/helper2";

import { BsSpotify, BsYoutube } from "react-icons/bs";

const DeviceOutput = () => {
  const { state } = useDeviceConfig();
  const { stockQuote, stockQuotePercentage, symbolDetails } = state;
  const isElectricityPrice = stockQuote?.name === "Electricity Prices";
  const electricityAddress = symbolDetails?.extras?.addressValue || null;

  const renderName = () => {
    if (isElectricityPrice) {
      return (
        <>
          Electricity Prices <br />
          {electricityAddress}
        </>
      );
    }
    return stockQuote?.name || "Tickrmeter";
  };

  const renderSymbol = () => {
    if (isElectricityPrice && electricityAddress) return "";

    if (symbolDetails.symbolType === SYMBOL_TYPES.MUSIC_CREATORS) {
      return stockQuote?.type?.toLowerCase() === "spotify" ? (
        <BsSpotify style={{ color: "#fff", width: "2rem", height: "2rem" }} />
      ) : (
        <BsYoutube style={{ color: "#fff", width: "2rem", height: "2rem" }} />
      );
    }

    return stockQuote?.symbolUI || stockQuote?.symbol?.replace(new RegExp("\\?.*"), "") || "TSLA";
  };

  if (!stockQuote) return null;

  return (
    <>
      {stockQuote && (
        <>
          {symbolDetails.symbolType === SYMBOL_TYPES.MUSIC_CREATORS ? (
            <>
              <Humbl3View
                stockQuote={stockQuote}
                renderSymbol={renderSymbol}
                stockQuotePercentage={stockQuotePercentage}
                renderName={renderName}
                symbolDetails={symbolDetails}
              />
            </>
          ) : (
            <StockView
              stockQuote={stockQuote}
              renderSymbol={renderSymbol}
              stockQuotePercentage={stockQuotePercentage}
              renderName={renderName}
            />
          )}
        </>
      )}
    </>
  );
};

export default DeviceOutput;

const StockView = ({ stockQuote, renderSymbol, stockQuotePercentage, renderName }) => (
  <>
    <Row>
      <Col sm="12">
        <FormGroup>
          <Row className="stock-view">
            <Col sm="4" className="left symbol">
              {renderSymbol()}
            </Col>

            <Col sm="8" className="right">
              <div className="top text-center" id="date">
                {stockQuote?.date || "21:39PM Sun 02 May 2021"}
              </div>
              <div className="center text-center" id="price">
                {stockQuote?.price || "$232.57"}
              </div>
              <div className="bottom text-center" id="percent">
                {stockQuotePercentage || "-"}
              </div>
            </Col>
          </Row>
        </FormGroup>
      </Col>
    </Row>
    <Row>
      <Col sm="12" className="text-center">
        <h4>{renderName()}</h4>
      </Col>
    </Row>
  </>
);

const Humbl3View = ({ stockQuote, renderSymbol, stockQuotePercentage, renderName, symbolDetails }) => {

  return (
    <>
      <Row>
        <Col sm="12">
          <FormGroup>
            <Row className="stock-view">
              <Col sm="12" className="right humbl3" style={{}}>
                <div className="top d-flex justify-content-between text-right" id="date">
                  <div>{stockQuote?.feature}</div>
                  <div>{stockQuote?.displayTimeFrame}</div>
                </div>
                <h1>{stockQuote?.price || "23257"}</h1>
                <div className="center text-left" id="price">
                  <div style={{ fontSize: "20px", lineHeight: 1 }}>{stockQuote?.name}</div>
                  <div style={{ fontSize: "16px", fontWeight: "normal", lineHeight: 1 }}>{stockQuote?.subTitle}</div>
                </div>
                <div className="bottom text-right humbl3" id="percent">
                  <div className="type">{stockQuote?.displaySource}</div>
                  <div>
                    {stockQuote?.isUp ? "🠕" : "🠗"}
                    {stockQuote?.percent}
                  </div>
                </div>
              </Col>
            </Row>
          </FormGroup>
        </Col>
      </Row>
      <Row>
        <Col sm="12" className="text-center">
          <h4>{renderName()}</h4>
        </Col>
      </Row>
    </>
  );
};
