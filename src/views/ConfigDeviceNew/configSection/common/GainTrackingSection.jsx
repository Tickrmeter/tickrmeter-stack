import { Col, CustomInput, Row } from "reactstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";

import { CheckBoxField, InputField, SelectField } from "@src/utility/input-fields";
import PopoverSetup from "@components/popover-setup";
import { aggregateTimeOpts, isValidAmount, isValidFolatingNumber } from "../../helper";
import { calculateGainLoss } from "./gainLossCalculation";
import { useEffect } from "react";
import { DATA_MARKETS, STREAM_CONFIG } from "../../helper2";

const GainTrackingSection = ({ symbolDetailsState, currentPrice, resetToCurrent, setStockQuotePercentage }) => {
  const { symbolDetails, setSymbolDetails } = symbolDetailsState;

  const { gainTrackingEnabled, purchasePrice, noOfStocks, isShortSell, showFullAssetValue } = symbolDetails;

  useEffect(() => {
    if (symbolDetails.gainTrackingEnabled) {
      calculateAndSetStockProfit(
        symbolDetails.purchasePrice,
        symbolDetails.noOfStocks,
        symbolDetails.isShortSell,
        symbolDetails.showFullAssetValue
      );
    }
  }, [gainTrackingEnabled]);

  const onPurchasePriceChange = (e) => {
    const val = e.target.value;

    const name = e.target.name;
    if (!isValidAmount(val)) return false;

    const pp = parseFloat(val);

    if (isNaN(pp) && val !== "") return false;
    else if (pp < 0) return false;
    else setSymbolDetails({ ...symbolDetails, [name]: val });
    //.
  };

  const calculateAndSetStockProfit = (purchasePrice, noOfStocks, isShortSell, showFullAssetValue) => {


    const result = calculateGainLoss({
      gainTracking: {
        purchasePrice: isNaN(purchasePrice) ? parseFloat(purchasePrice.toString().replace(",", ".")) : purchasePrice,
        noOfStocks: isNaN(noOfStocks) ? parseFloat(noOfStocks.toString().replace(",", ".")) : noOfStocks,
        isShortSell,
        showFullAssetValue,
      },
      currentPrice,
      currency: symbolDetails.currency,
    });

    // const result = calculateGainLoss({
    //   purchasedPrice,
    //   noOfStocks,
    //   isShortSell,
    //   showFullAssetValue,
    //   currentPrice,
    //   currency: symbolDetails.currency,
    // });

    if (!result || !setStockQuotePercentage) return false;

    setStockQuotePercentage(result.gainlossText);
  };

  const onPurchasePriceBlur = (e) => {
    const val = e.target.value.replace(",", ".");

    const _purchasedPrice = parseFloat(val);

    if (_purchasedPrice === 0 || isNaN(_purchasedPrice) || val === "" || _purchasedPrice < 0) {
      setSymbolDetails({ ...symbolDetails, purchasePrice: "" });
      return resetToCurrent ? resetToCurrent() : false;
    }

    const res = isValidFolatingNumber(val);

    if (!res) return resetToCurrent ? resetToCurrent() : false;

    calculateAndSetStockProfit(_purchasedPrice, noOfStocks, isShortSell, showFullAssetValue);
  };

  const onNoOfStocksBlur = (e) => {
    const val = e.target.value.replace(",", ".");

    if (!isValidFolatingNumber(val)) return false;

    const noOfStocks = parseFloat(val);

    const validNoOfStocks = isNaN(noOfStocks) || noOfStocks <= 0 ? "" : noOfStocks;


    calculateAndSetStockProfit(purchasePrice, validNoOfStocks, isShortSell, showFullAssetValue);
  };

  const onNoOfStocksChange = (e) => {
    const val = e.target.value;

    if (!isValidFolatingNumber(val)) return false;

    //if (val === "0") return false;

    const noOfStocks = parseFloat(val);

    if (isNaN(noOfStocks) && val !== "") return false;
    else if (noOfStocks < 0) return false;
    else setSymbolDetails({ ...symbolDetails, noOfStocks: val });
  };

  const onIsShortSellChange = (checked) => {
    setSymbolDetails({ ...symbolDetails, isShortSell: checked, noOfStocks: checked ? "" : symbolDetails.noOfStocks });
    calculateAndSetStockProfit(purchasePrice, "", checked);
  };

  const onshowFullAssetValueChange = (checked) => {
    setSymbolDetails({ ...symbolDetails, showFullAssetValue: checked });
    calculateAndSetStockProfit(purchasePrice, noOfStocks, isShortSell, checked);
  };

  const isFinageStock = STREAM_CONFIG.finage.stocks.includes(symbolDetails.dataMarket);

  return (
    <>
      <Row className="justify-content-center" id={"gain-tracking-row"}>
        <Col xs="12" lg="8" className="mt-1">
          <Row>
            <Col xs="12" lg="6">
              <CheckBoxField
                name="isGainTrackingEnabled"
                label="Enable Gain Tracking?"
                checked={gainTrackingEnabled}
                onChange={({ target }) => {
                  setSymbolDetails({
                    ...symbolDetails,
                    gainTrackingEnabled: target.checked,
                    purchasePrice: "",
                    noOfStocks: "",
                    isShortSell: false,
                    showFullAssetValue: false,
                  });
                  if (!target.checked && resetToCurrent) {
                    resetToCurrent();
                  } else {
                    return false;
                  }
                }}
              />
            </Col>
            {!gainTrackingEnabled && isFinageStock && (
              <Col xs="12" lg="12">
                <SelectField
                  name="aggregateTime"
                  label="Aggregate Time"
                  options={aggregateTimeOpts}
                  onChange={({ target }) => {
                    setSymbolDetails({ ...symbolDetails, aggregateTime: target.value });
                  }}
                  value={symbolDetails.aggregateTime}
                />
              </Col>
            )}
            <Col xs="12" lg="6" className="text-right">
              {gainTrackingEnabled && (
                <div className="multi-label-switch-container justify-content-end">
                  <span className="">Short</span>
                  <CustomInput
                    type="switch"
                    id={`isShortSellSwitch`}
                    name="isShortSellSwitch"
                    className="multi-label-switch"
                    label=""
                    onChange={(e) => onIsShortSellChange(!e.target.checked)}
                    checked={!isShortSell}
                  />
                  <span className="">Long</span>
                </div>
              )}
            </Col>
          </Row>
        </Col>
      </Row>
      <PopoverSetup
        placement="top"
        target="gain-tracking-row"
        triggeringCookie={"Popover6"}
        body={"Type your purchase price and see additional info on gain or loss on the stock."}
        title={"Gain Tracking"}
        confirmButtonTitle={"Next tip"}
        icon={<FontAwesomeIcon icon={faArrowRight} />}
        nextCookieValue={"Popover7"}
      ></PopoverSetup>
      {gainTrackingEnabled && (
        <Row className="justify-content-center">
          <Col xs="12" lg="8" className="mt-1">
            <Row>
              <Col xs="12" lg="6">
                <InputField
                  name="purchasePrice"
                  label={`Purchase Price`}
                  placeholder="Enter average purchase price"
                  onChange={onPurchasePriceChange}
                  onBlur={onPurchasePriceBlur}
                  value={purchasePrice}
                />
              </Col>
              <Col xs="12" lg="6">
                {!isShortSell && (
                  <>
                    <InputField
                      name="noOfStocks"
                      label={`No of Stocks`}
                      placeholder="Enter no of stocks"
                      onChange={onPurchasePriceChange}
                      onBlur={onNoOfStocksBlur}
                      value={noOfStocks}
                    />
                    <CustomInput
                      type="switch"
                      id={`showFullAssetValueSwitch`}
                      name="showFullAssetValue"
                      className="mt-1"
                      label="Show Full Asset Value?"
                      onChange={(e) => onshowFullAssetValueChange(e.target.checked)}
                      checked={showFullAssetValue}
                    />
                  </>
                )}
              </Col>
            </Row>
          </Col>
        </Row>
      )}
    </>
  );
};

export default GainTrackingSection;
