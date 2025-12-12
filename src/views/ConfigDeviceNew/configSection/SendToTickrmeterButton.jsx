import { useDeviceConfig } from "../contexts/DeviceConfigContext";
import { SYMBOL_TYPES } from "../helper2";
import { useDeviceConfigActions } from "../hooks/useDeviceConfigActions";

const { Row, Col, Spinner, FormGroup, Button } = require("reactstrap");

const SendToTickrmeterButton = ({ saveConfig }) => {
  const { state } = useDeviceConfig();
  const { symbolDetails, alertConfig, alertConfigArr, stockQuote, loading } = state;

  const getButtonDisabled = () => {
    const { searchSymbol } = symbolDetails;

    if (!searchSymbol) return true;

    if (symbolDetails.symbolType === SYMBOL_TYPES.ELECTRICITY) {
      //get the last item in the array of alertConfigArr

      const alertConfig = alertConfigArr[alertConfigArr.length - 1];

      const { enabled, triggerValue, flashLightbar, playSound, changeLightBarColor } = alertConfig;

      if (enabled) {
        if (triggerValue === "") return true;

        if (!playSound && !changeLightBarColor) return true;
      }
    } else if (symbolDetails.symbolType === SYMBOL_TYPES.CUSTOMAPI) {
      const { placeholder1, placeholder2, placeholder3, placeholder4 } = symbolDetails;

      if (!placeholder1?.value || !placeholder2?.value || !placeholder3?.value || !placeholder4?.value) return true;
    } else {
      const { enabled, triggerValue, flashLightbar, playSound, changeLightBarColor } = alertConfig;
      if (enabled) {
        if (triggerValue === "") return true;

        if (!playSound && !changeLightBarColor) return true;
      }
    }
    return false;
  };

  return (
    <>
      {stockQuote && (
        <Row className="justify-content-center">
          <Col xs={10} sm={8} md={6} lg={4} className="mt-1">
            {loading ? (
              <Spinner type="grow" color="primary" style={{ width: "3rem", height: "3rem" }} />
            ) : (
              <FormGroup className="d-block mb-0">
                <Button.Ripple
                  className="mr-1"
                  block
                  color="primary"
                  disabled={getButtonDisabled()}
                  onClick={saveConfig}
                >
                  Send to Tickrmeter
                </Button.Ripple>
              </FormGroup>
            )}
          </Col>
        </Row>
      )}
    </>
  );
};
export default SendToTickrmeterButton;
