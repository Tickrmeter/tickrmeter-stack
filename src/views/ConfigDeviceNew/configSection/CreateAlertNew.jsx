import { Row, Col, CustomInput, Label, FormText, Button } from "reactstrap";

import { CheckBoxField, InputField, SelectField } from "@src/utility/input-fields";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import PopoverSetup from "@components/popover-setup";
import { X, Plus } from "react-feather";
import { triggerTypeOptions, lightBarColorOpts } from "../helper";
import { useDeviceConfig } from "../contexts/DeviceConfigContext";
import { useDeviceConfigActions } from "../hooks/useDeviceConfigActions";

const CreateAlertNew = () => {
  const { state } = useDeviceConfig();
  const { alertConfig: _alertConf, alertConfigArr } = state;

  const { setAlertConfig: _setAlertConf, setAlertConfigArr } = useDeviceConfigActions();

  const updateAlertConfigArr = (type, value, index) => {
    const newArr = [...alertConfigArr];
    newArr[index][type] = value;
    setAlertConfigArr(newArr);
  };

  return (
    <div className="py-0 px-2 ">
      <Row className="justify-content-center align-items-end" id={"alert-row"}>
        <Col xs="6" lg="4" className="mt-1 font-medium-2">
          Alerts
          <FormText color="muted">Get alerts at certain thresholds.</FormText>
        </Col>
        <Col xs="6" lg="4" className="mt-1 text-right">
          <CustomInput
            type="switch"
            id={`alert-switch`}
            name="alert-switch"
            className="mt-1"
            label=""
            onChange={(e) => _setAlertConf({ ..._alertConf, enabled: e.target.checked })}
            checked={_alertConf.enabled}
          />
        </Col>
      </Row>
      <PopoverSetup
        placement="top"
        target="alert-row"
        triggeringCookie={"Popover7"}
        body={"Get notified by the LED light when the price is higher or lower than a custom value."}
        title={"Alerts"}
        confirmButtonTitle={"Okay"}
        icon={<FontAwesomeIcon icon={faCheck} />}
        nextCookieValue={"ShowLast"}
      ></PopoverSetup>
      {_alertConf.enabled && (
        <>
          {alertConfigArr?.map((alertConfig, index) => {
            return (
              <AlertRow
                index={index}
                alertConfigArr={alertConfigArr}
                setAlertConfigArr={setAlertConfigArr}
                updateAlertConfigArr={updateAlertConfigArr}
                alertConfig={alertConfig}
              />
            );
          })}
          {/* <Row className="justify-content-center">
            <Col xs="12" lg="8" className="mt-1">
              <Button
                color="link"
                size="sm"
                onClick={() => {
                  setAlertConfigArr([...alertConfigArr, { ...defaultAlertConfig, enabled: true }]);
                }}
              >
                <Plus size={18} /> Add another alert
              </Button>
            </Col>
          </Row> */}
        </>
      )}
    </div>
  );
};

export default CreateAlertNew;

const AlertRow = ({ index, alertConfigArr, setAlertConfigArr, updateAlertConfigArr, alertConfig }) => {
  return (
    <Row key={`alert${index}`} className="m-0 justify-content-center">
      <Col xs="12" lg="8" className="mt-1" style={{ border: "1px solid #ccc", borderRadius: "10px" }}>
        <>
          {/* Remove button on top right of last element*/}
          {index === alertConfigArr.length - 1 && index !== 0 && (
            <Button
              color="link"
              size="sm"
              style={{ position: "absolute", right: "10px", top: "10px", padding: 0, zIndex: 100 }}
              onClick={() => {
                const newArr = [...alertConfigArr];
                newArr.pop();
                setAlertConfigArr(newArr);
              }}
            >
              <X size={18} />
            </Button>
          )}

          <Row>
            <Col xs={12} sm={8} className="mt-1">
              <SelectField
                name={`triggerType${index}`}
                label="Trigger Type"
                type="select"
                options={triggerTypeOptions}
                value={alertConfig.triggerType}
                onChange={(e) => updateAlertConfigArr("triggerType", e.target.value, index)}
              />
            </Col>
            <Col xs={12} sm={4} className="mt-1">
              <InputField
                name={`triggerValue${index}`}
                label="Value"
                type="number"
                value={alertConfig.triggerValue}
                onChange={(e) => updateAlertConfigArr("triggerValue", e.target.value, index)}
              />
            </Col>
          </Row>
          <Row>
            <Col xs="12" className="mt-1">
              <CheckBoxField
                name={`changeLightBarColor${index}`}
                label="Change Light Bar Color"
                checked={alertConfig.changeLightBarColor}
                onChange={(e) => updateAlertConfigArr("changeLightBarColor", e.target.checked, index)}
              />
            </Col>
          </Row>
          {alertConfig.changeLightBarColor && (
            <>
              <Row className="align-items-end">
                <Col sm="8" xs="12" className="mt-1">
                  <SelectField
                    name={`lightBarColor${index}`}
                    label="Light Bar Color"
                    options={lightBarColorOpts}
                    onChange={(e) => updateAlertConfigArr("lightBarColor", e.target.value, index)}
                    value={alertConfig.lightBarColor}
                  />
                </Col>
                <Col sm="4" xs="12" className="mt-1 d-flex">
                  <CheckBoxField
                    name={`flashLight${index}`}
                    label="Flash Lightbar"
                    checked={alertConfig.flashLightbar}
                    onChange={(e) => updateAlertConfigArr("flashLightbar", e.target.checked, index)}
                  />
                </Col>
              </Row>
            </>
          )}
          <Row>
            <Col xs="12" className="mt-1 d-flex">
              <CheckBoxField
                name={`playSound${index}`}
                label="Play Sound"
                checked={alertConfig.playSound}
                onChange={(e) => updateAlertConfigArr("playSound", e.target.checked, index)}
                disabled={true}
              />

              <div style={{ marginLeft: "10px", fontStyle: "italic" }}>- Coming Soon</div>
            </Col>
          </Row>
        </>
      </Col>
    </Row>
  );
};
