import React, { useState, useEffect } from "react";
import classNames from "classnames";

import { SlideDown } from "react-slidedown";
import "react-slidedown/lib/slidedown.css";

import { AlertCircle, XCircle } from "react-feather";

import { Card, CardHeader, CardTitle, Row, Col, Alert } from "reactstrap";

import SelectPlaylist from "./SelectPlaylist";

import { SYMBOL_TYPES } from "./helper2.js";

import { showToast } from "@src/utility/toast-content";
// import SearchSymbolForm from "./configSection/SearchSymbolForm";
import SymbolTypeSelection from "./configSection/a_SymbolTypeAndMarketSelection";
import ConfigRenderer from "./configSection/ConfigRenderer";
import CreateAlert from "./configSection/CreateAlert";
import DeviceOutput from "./configSection/DeviceOutput";
import SendToTickrmeterButton from "./configSection/SendToTickrmeterButton";
import ConfigType from "./configSection/ConfigType";
import CreateAlertNew from "./configSection/CreateAlertNew";

import { useDeviceConfig, DeviceConfigProvider } from "./contexts/DeviceConfigContext";
import { useDeviceConfigActions } from "./hooks/useDeviceConfigActions";
import { useDeviceDetails } from "./hooks/useDeviceDetails";

const DeviceConfig = ({ closeAndRefresh, deviceId }) => {
  return (
    <DeviceConfigProvider>
      <DeviceConfigContent closeAndRefresh={closeAndRefresh} deviceId={deviceId} />
    </DeviceConfigProvider>
  );
};

//export default DeviceConfig;

const DeviceConfigContent = ({ closeAndRefresh, deviceId }) => {
  //const { state, dispatch } = useDeviceConfig();
  const { state } = useDeviceConfig();
  const { setServerError } = useDeviceConfigActions();
  const { symbolDetails, configType, deviceDetails, serverError, stockQuote } = state;

  // Replace setState calls with dispatch

  // ** Component States
  const [hidden, setHidden] = useState(true);

  const [resetAutoComplete, setResetAutoComplete] = useState(false);

  const [selectedPlaylist, setSelectedPlaylist] = useState("");

  const { saveDeviceConfig, getDeviceDetails } = useDeviceDetails({ setSelectedPlaylist });

  useEffect(() => {
    if (deviceId) {
      setHidden(false);
      getDeviceDetails(deviceId);
    }
  }, [deviceId]);

  //** Call API to get the Device details from the server. */

  const saveConfig = async () => {
    const result = await saveDeviceConfig();

    if (result.success) {
      showToast("success", "Success!", result.message);
      setHidden(true);
      setTimeout(() => {
        closeAndRefresh(true);
      }, 200);
      setServerError(null);
    } else {
      showToast("danger", "Unable to push!", result.message);
    }
  };

  const hideForm = (shouldRefresh = false) => {
    setHidden(true);

    setTimeout(() => {
      closeAndRefresh(shouldRefresh);
    }, 500);
  };

  return (
    <SlideDown className={"react-slidedown"}>
      {!hidden ? (
        <Card id="config-top">
          <CardHeader className={classNames({ "border-bottom": true, "justify-content-end": hidden })}>
            <CardTitle className={classNames({ "d-flex w-100 justify-content-between": !hidden })}>
              <>
                <h4>Config Device - {deviceDetails?.name || deviceDetails?.macAddress}</h4>
                <XCircle size={24} onClick={hideForm} style={{ cursor: "pointer" }} />
              </>
            </CardTitle>
          </CardHeader>

          {serverError && (
            <Alert color="danger" isOpen={serverError !== null} fade={true}>
              <div className="alert-body">
                <AlertCircle size={15} />
                <span className="ml-1">{serverError}</span>
              </div>
            </Alert>
          )}
          <Row className="justify-content-center device-config">
            <Col sm="12">
              <ConfigType />
              {configType === "single" && (
                <>
                  <SymbolTypeSelection resetFuncs={{ setResetAutoComplete }} mode="single" />
                  <ConfigRenderer resetAutoComplete={resetAutoComplete} setResetAutoComplete={setResetAutoComplete} />
                  {stockQuote && (
                    <>{symbolDetails.symbolType === SYMBOL_TYPES.ELECTRICITY ? <CreateAlertNew /> : <CreateAlert />}</>
                  )}
                  <SendToTickrmeterButton saveConfig={saveConfig} />
                  <DeviceOutput />
                </>
              )}
              {configType === "playlist" && (
                <SelectPlaylist
                  deviceId={deviceId}
                  hideForm={hideForm}
                  selectedPlaylistSt={{ selectedPlaylist, setSelectedPlaylist }}
                />
              )}
            </Col>
          </Row>
        </Card>
      ) : null}
    </SlideDown>
  );
};

export default DeviceConfig;
