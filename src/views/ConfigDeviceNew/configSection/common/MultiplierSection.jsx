import { Col, Row } from "reactstrap";
import { CheckBoxField, InputField } from "@src/utility/input-fields";
import { isValidFolatingNumber, getFormattedNumber, currencyList } from "../../helper";

const MultiplierSection = ({ symbolDetailsState, stockQuoteState }) => {
  const { symbolDetails, setSymbolDetails } = symbolDetailsState;
  const { multiplier, multiplierEnabled } = symbolDetails;

  const { stockQuote, setStockQuote, setStockQuotePercentage } = stockQuoteState || {};

  const onMultiplerChange = (e) => {
    const val = e.target.value;
    if (!isValidFolatingNumber(val)) return false;
    const pp = parseFloat(val);
    if (isNaN(pp) && val !== "") return false;
    else if (pp <= 0) return false;
    else if (pp > 10000) return false;
    else setSymbolDetails({ ...symbolDetails, multiplier: val });
  };

  const isStockQuoteState = stockQuote || setStockQuote || setStockQuotePercentage;

  const onMultiplierBlur = (e) => {
    if (!isStockQuoteState) return;

    const val = e.target.value;
    const res = isValidFolatingNumber(val);
    if (!res) return setStockQuotePercentage(stockQuote.percent);

    const _multiplier = parseFloat(val);

    if (isNaN(_multiplier) || val === "" || _multiplier <= 0 || _multiplier > 10000) {
      return false;
    } else {
      const priceWithMultiplier = getFormattedNumber(stockQuote.p * _multiplier);

      const currencySymbol = currencyList.find((currency) => currency.code === stockQuote.currency)?.symbol || "";

      setStockQuote({
        ...stockQuote,
        pwm: priceWithMultiplier,
        price: `${currencySymbol}${priceWithMultiplier}`,
      });
    }
  };

  return (
    <>
      <Row className="justify-content-center" id={"multiplier-row"}>
        <Col xs="12" lg="8" className="mt-1">
          <CheckBoxField
            name="isMultiplierEnabled"
            label="Enable Multiplier?"
            checked={multiplierEnabled}
            onChange={({ target }) => {
              setSymbolDetails({ ...symbolDetails, multiplierEnabled: target.checked, multiplier: "1" });

              if (!target.checked) {
                if (!isStockQuoteState) return;

                setStockQuote({
                  ...stockQuote,
                  pwm: stockQuote.p,
                  price: `${stockQuote.currency}${stockQuote.p}`,
                });
              }
            }}
          />
        </Col>
      </Row>
      {multiplierEnabled && (
        <Row className="justify-content-center">
          <Col xs="12" lg="8" className="mt-1">
            <InputField
              name="multiplier"
              label="Multiplier"
              placeholder="Enter multiplier value (1-10)"
              onChange={onMultiplerChange}
              onBlur={onMultiplierBlur}
              value={multiplier}
            />
          </Col>
        </Row>
      )}
    </>
  );
};

export default MultiplierSection;
