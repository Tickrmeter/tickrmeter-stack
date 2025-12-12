import React, { useState, useEffect } from "react";
import { FormGroup, CustomInput, Row, Col } from "reactstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";

import { SelectField } from "@src/utility/input-fields";

import { lightBarColorOpts, ledBrightnessOptions, calculateBatteryLife } from "../helper";

import PopoverSetup from "@components/popover-setup";

import { SYMBOL_TYPES, getIntervalOptions } from "../helper2";

import SearchSymbolForm from "./b_SearchSymbolForm";
import MultiplierSection from "./common/MultiplierSection";
import GainTrackingSection from "./common/GainTrackingSection";
import { useDeviceConfig } from "../contexts/DeviceConfigContext";
import { useDeviceConfigActions } from "../hooks/useDeviceConfigActions";
import { CheckBoxField } from "@src/utility/input-fields.js";

const ConfigRenderer = ({ resetAutoComplete, setResetAutoComplete }) => {
  const { state } = useDeviceConfig();
  const { symbolDetails, loading, stockQuote, stockQuotePercentage } = state;
  const { setSymbolDetails, setStockQuote, setStockQuotePercentage, setLoading } = useDeviceConfigActions();

  const { dataStream, symbolType } = symbolDetails;

  const [batteryLife, setBatteryLife] = useState("");

  useEffect(() => {
    const { interval, ledBrightness } = symbolDetails;

    if (interval && ledBrightness) {
      const batteryLife = calculateBatteryLife(parseInt(interval), parseInt(ledBrightness), false, 0);
      setBatteryLife(`${batteryLife} days`);
    }
  }, [symbolDetails.interval, symbolDetails.ledBrightness]);

  const onDivideBy100Change = (e) => {
    const { checked } = e.target;
    setSymbolDetails({
      ...symbolDetails,
      extras: {
        ...symbolDetails.extras,
        divideBy100: checked,
      },
    });

    const price2 = checked ? stockQuote.p / 100 : stockQuote.p * 100;

    setStockQuote({
      ...stockQuote,
      p: price2,
      price: checked ? `£${price2.toFixed(2)}` : price2,
    });
  };

  const showDivideBy100 = () => {
    if (symbolDetails.extras?.manualSearch && symbolDetails.dataMarket === "LSE") return true;
    return ["GBp", "GBX"].includes(symbolDetails.currency);
  };

  return (
    <div className="px-2 pb-2">
      <SearchSymbolForm resetAutoCompleteState={{ resetAutoComplete, setResetAutoComplete }} mode="single" />
      {stockQuote && (
        <>
          {symbolType !== SYMBOL_TYPES.ELECTRICITY && (
            <>
              <Row className="justify-content-center">
                <Col xs="12" lg="8" className="mt-1">
                  <SelectField
                    name="interval"
                    label="Interval"
                    options={getIntervalOptions(symbolDetails.dataStream)}
                    onChange={({ target }) => setSymbolDetails({ ...symbolDetails, interval: target.value })}
                    value={symbolDetails.interval}
                    disabled={symbolType === SYMBOL_TYPES.TOP10}
                  />
                </Col>
              </Row>
              <PopoverSetup
                placement="top"
                target="interval"
                triggeringCookie={"Popover4"}
                body={"Specify how often you want to update the TickrMeter with the latest price."}
                title={"Interval"}
                confirmButtonTitle={"Next tip"}
                icon={<FontAwesomeIcon icon={faArrowRight} />}
                nextCookieValue={"Popover5"}
              ></PopoverSetup>
            </>
          )}
          <Row className="justify-content-center">
            <Col xs="12" lg="8" className="mt-1">
              <SelectField
                name="ledBrightness"
                label="LED Brightness"
                options={ledBrightnessOptions}
                onChange={({ target }) => setSymbolDetails({ ...symbolDetails, ledBrightness: target.value })}
                value={symbolDetails.ledBrightness}
              />
            </Col>
          </Row>
          {symbolType === SYMBOL_TYPES.TOP10 && (
            <Row className="justify-content-center">
              <Col xs="12" lg="8" className="mt-1">
                <SelectField
                  name="lightBarColor"
                  label="Light Bar Color"
                  options={lightBarColorOpts}
                  onChange={(e) => setSymbolDetails({ ...symbolDetails, lightBarColor: e.target.value })}
                  disabled={symbolDetails.ledBrightness === "0"}
                />
              </Col>
            </Row>
          )}
          {showDivideBy100() && (
            <Row className="justify-content-center">
              <Col xs="12" lg="8" className="mt-1">
                <CheckBoxField
                  name="divideBy100"
                  label="Divide by 100"
                  onChange={onDivideBy100Change}
                  className="mt-1"
                  checked={symbolDetails.extras?.divideBy100 ?? false}
                />
              </Col>
            </Row>
          )}

          <Row className="justify-content-center">
            <Col xs="12" lg="8" className="mt-1">
              <FormGroup>
                <strong>Estimated Battery Life: {batteryLife}</strong>
              </FormGroup>
            </Col>
          </Row>

          <PopoverSetup
            placement="top"
            target="ledBrightness"
            triggeringCookie={"Popover5"}
            body={"Specify how bright the LED on the TickrMeter should be."}
            title={"Brightness"}
            confirmButtonTitle={"Next tip"}
            icon={<FontAwesomeIcon icon={faArrowRight} />}
            nextCookieValue={"Popover6"}
          ></PopoverSetup>

          {![SYMBOL_TYPES.ELECTRICITY, SYMBOL_TYPES.MUSIC_CREATORS].includes(symbolDetails.symbolType) && (
            <>
              {/* <Row className="justify-content-center">
                <Col xs="12" lg="8" className="mt-1">
                  <CheckBoxField
                    name="showAmountChange"
                    label="Show Amount Change"
                    onChange={(e) => {
                      setSymbolDetails({
                        ...symbolDetails,
                        extras: {
                          ...symbolDetails.extras,
                          showAmountChange: e.target.checked,
                        },
                      });
                      console.log(e.target.checked ? stockQuote.priceDiff : stockQuote.percent);
                      setStockQuotePercentage(e.target.checked ? stockQuote.priceDiff : stockQuote.percent);
                    }}
                    className="mt-1"
                    checked={symbolDetails.extras?.showAmountChange ?? false}
                  />
                </Col>
              </Row> */}
              <Row className="justify-content-center">
                <Col xs="12" lg="8" className="mt-1 mb-1">
                  <div className="multi-label-switch-container">
                    <span className="">Percentage</span>
                    <CustomInput
                      type="switch"
                      id={`showAmountChange`}
                      name="showAmountChange"
                      className="multi-label-switch"
                      label=""
                      onChange={(e) => {
                        setSymbolDetails({
                          ...symbolDetails,
                          extras: {
                            ...symbolDetails.extras,
                            showAmountChange: e.target.checked,
                          },
                        });
                        //console.log(e.target.checked ? stockQuote.priceDiff : stockQuote.percent);
                        setStockQuotePercentage(e.target.checked ? stockQuote.priceDiff : stockQuote.percent);
                      }}
                      checked={symbolDetails.extras?.showAmountChange ?? false}
                    />
                    <span className="">Amount</span>
                  </div>
                </Col>
              </Row>
              <GainTrackingSection
                symbolDetailsState={{ symbolDetails, setSymbolDetails }}
                currentPrice={stockQuote.p}
                resetToCurrent={() => setStockQuotePercentage(stockQuote.percent)}
                setStockQuotePercentage={setStockQuotePercentage}
              />
            </>
          )}

          {symbolType === SYMBOL_TYPES.CRYPTO && (
            <MultiplierSection
              symbolDetailsState={{ symbolDetails, setSymbolDetails }}
              stockQuoteState={{ stockQuote, setStockQuote, setStockQuotePercentage }}
            />
          )}
        </>
      )}
    </div>
  );
};

export default ConfigRenderer;
