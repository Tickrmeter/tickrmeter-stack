import React from "react";
import { FormGroup, Row, Col, CustomInput, Label } from "reactstrap";

import { CheckBoxField, InputField, SelectField } from "@src/utility/input-fields";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import PopoverSetup from "@components/popover-setup";

import { triggerTypeOptions, defaultAlertConfig, soundTypeOptions, lightBarColorOpts } from "../helper";
import { SYMBOL_TYPES } from "../helper2.js";
import { useDeviceConfig } from "../contexts/DeviceConfigContext";
import { useDeviceConfigActions } from "../hooks/useDeviceConfigActions";

const CreateAlert = () => {
  const { state } = useDeviceConfig();
  const { symbolDetails, alertConfig } = state;
  const { setAlertConfig } = useDeviceConfigActions();

  // const { alertConfig, setAlertConfig } = alertState;

  if (symbolDetails.symbolType === SYMBOL_TYPES.TOP10) return <></>;

  const updateAlertConfig = (type, value) => setAlertConfig({ ...alertConfig, [type]: value });

  return (
    <div className="py-0 px-2 ">
      <Row className="justify-content-center" id={"alert-row"}>
        <Col xs="12" lg="8" className="mt-1">
          <CheckBoxField
            name="enabled"
            label="Create Alert?"
            checked={alertConfig.enabled}
            onChange={(e) => {
              !e.target.checked ? setAlertConfig(defaultAlertConfig) : updateAlertConfig("enabled", true);
            }}
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

      {alertConfig.enabled && (
        <Row className="m-0 justify-content-center">
          <Col xs="12" lg="8" className="mt-1" style={{ border: "1px solid #ccc", borderRadius: "10px" }}>
            <Row style={{ background: "#d0d2d6", borderRadius: "10px 10px 0px 0px", padding: "10px" }}>
              <Col xs="12" className="font-weight-bold">
                Create Alert for {symbolDetails.searchSymbol}
              </Col>
            </Row>

            {/* {symbolDetails.symbolType === SYMBOL_TYPES.ELECTRICITY ? (
              <CreateAlertElectricity updateAlertConfig={updateAlertConfig} alertConfig={alertConfig} />
            ) : ( */}
            <>
              <Row>
                <Col xs={12} sm={8} className="mt-1">
                  <SelectField
                    name="triggerType"
                    label="Trigger Type"
                    type="select"
                    options={triggerTypeOptions}
                    value={alertConfig.triggerType}
                    onChange={(e) => updateAlertConfig("triggerType", e.target.value)}
                  />
                </Col>
                <Col xs={12} sm={4} className="mt-1">
                  <InputField
                    name="triggerValue"
                    label="Value"
                    type="number"
                    value={alertConfig.triggerValue}
                    onChange={(e) => updateAlertConfig("triggerValue", e.target.value)}
                  />
                </Col>
              </Row>

              <Row>
                <Col xs="12" className="mt-1 d-flex">
                  <CheckBoxField
                    name="playSound"
                    label="Play Sound"
                    checked={alertConfig.playSound}
                    onChange={(e) => updateAlertConfig("playSound", e.target.checked)}
                    disabled={process.env.NODE_ENV === "production"}
                  />
                  {process.env.NODE_ENV === "production" && (
                    <div style={{ marginLeft: "10px", fontStyle: "italic" }}>- Coming Soon</div>
                  )}
                </Col>
              </Row>
              {alertConfig.playSound && (
                <>
                  <Row>
                    <Col xs="12" className="mt-1">
                      <SelectField
                        name="soundType"
                        label="Sound Type"
                        options={soundTypeOptions}
                        onChange={(e) => updateAlertConfig("soundType", e.target.value)}
                        value={alertConfig.soundType}
                      />
                    </Col>
                  </Row>
                  <Row>
                    <Col xs="12">
                      <FormGroup>
                        <Label>Sound Duration</Label>
                        <div>
                          <CustomInput
                            type="radio"
                            label="Once"
                            name="soundDur"
                            id="sound-dur-once"
                            inline
                            checked={alertConfig.soundDur === "Once"}
                            onChange={() => setAlertConfig({ ...alertConfig, soundDur: "Once" })}
                          />
                          <CustomInput
                            type="radio"
                            label="Continuous"
                            name="soundDur"
                            id="sound-dur-continuous"
                            inline
                            checked={alertConfig.soundDur === "Continuous"}
                            onChange={() => setAlertConfig({ ...alertConfig, soundDur: "Continuous" })}
                          />
                        </div>
                      </FormGroup>
                    </Col>
                  </Row>
                </>
              )}
              <Row>
                <Col xs="12" className="mt-1">
                  <CheckBoxField
                    name="changeLightBarColor"
                    label="Change Light Bar Color"
                    checked={alertConfig.changeLightBarColor}
                    onChange={(e) => updateAlertConfig("changeLightBarColor", e.target.checked)}
                  />
                </Col>
              </Row>
              {alertConfig.changeLightBarColor && (
                <>
                  <Row>
                    <Col xs="12" className="mt-1">
                      <SelectField
                        name="lightBarColor"
                        label="Light Bar Color"
                        options={lightBarColorOpts}
                        onChange={(e) => updateAlertConfig("lightBarColor", e.target.value)}
                        value={alertConfig.lightBarColor}
                      />
                    </Col>
                  </Row>
                  <Row>
                    <Col xs="12" className="mt-1">
                      <CheckBoxField
                        name="flashLight"
                        label="Flash Lightbar"
                        checked={alertConfig.flashLightbar}
                        onChange={(e) => updateAlertConfig("flashLightbar", e.target.checked)}
                      />
                    </Col>
                  </Row>
                </>
              )}
            </>
            {/* )} */}
          </Col>
        </Row>
      )}
    </div>
  );
};

export default CreateAlert;

const CreateAlertElectricity = ({ alertConfig, updateAlertConfig }) => {
  return (
    <>
      <Row>
        {/*<Col xs={12} sm={8} className="mt-1">
           <SelectField
            name="triggerType"
            label="Trigger Type"
            type="select"
            options={triggerTypeOptions}
            value={alertConfig.triggerType}
            onChange={(e) => updateAlertConfig("triggerType", e.target.value)}
          /> 
        </Col>*/}
        <Col xs={12} sm={4} className="mt-1">
          <SelectField
            name="lightBarColor"
            label="Less than "
            options={lightBarColorOpts}
            onChange={(e) => updateAlertConfig("lightBarColor", e.target.value)}
            value={alertConfig.lightBarColor}
          />
        </Col>
        <Col xs={12} sm={4} className="mt-1">
          <InputField
            name="triggerValue"
            label="Alert Value"
            type="number"
            value={alertConfig.triggerValue}
            onChange={(e) => updateAlertConfig("triggerValue", e.target.value)}
          />
        </Col>

        <Col xs={12} sm={4} className="mt-1">
          <SelectField
            name="lightBarColor"
            label="Higher than "
            options={lightBarColorOpts}
            onChange={(e) => updateAlertConfig("lightBarColor", e.target.value)}
            value={alertConfig.lightBarColor}
          />
        </Col>
      </Row>
    </>
  );
};
