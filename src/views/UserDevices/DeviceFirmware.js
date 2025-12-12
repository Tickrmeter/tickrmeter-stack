import { useState, useEffect } from "react";
import classNames from "classnames";

import { SlideDown } from "react-slidedown";
import "react-slidedown/lib/slidedown.css";

import { AlertCircle, XCircle } from "react-feather";

import { Card, CardHeader, FormGroup, Button, CardBody, CardTitle, Row, Col, Alert } from "reactstrap";

import { SelectField } from "@src/utility/input-fields";

import http from "@src/utility/http";
import { ApiEndPoint, API_PATHS } from "@src/redux/api-paths";

import { toast, Slide } from "react-toastify";
import ToastContent from "@src/utility/toast-content";

const DeviceFirmware = ({ closeAndRefresh, deviceId }) => {
  // ** Component States
  const [hidden, setHidden] = useState(true);
  const [serverData, setServerData] = useState({ firmwares: null, device: null });
  const [serverError, setServerError] = useState(null);
  const [firmwareId, setFirmwareId] = useState(null);

  // ** React Hook form
  // const { register, errors, formState, handleSubmit, reset } = useForm({
  //   mode: "onChange",
  //   reValidateMode: "onSubmit",
  //   resolver: yupResolver(DeviceSchema),
  //   defaultValues: { ...defaultValues },
  // });

  useEffect(() => {
    if (deviceId) {
      setHidden(false);
      getDeviceAndFirmwares();
    }
  }, [deviceId]);

  //** Call API to get the Device details from the server. */
  const getDeviceAndFirmwares = async () => {
    try {
      const {
        success,
        data: device,
        message,
        type,
      } = await http.get(`${ApiEndPoint(API_PATHS.GET_MY_DEVICES_OTA)}/${deviceId}`);

      if (success) {
        setServerData({ ...device, firmwares: [{ _id: "", name: " -- Select Firmware -- " }, ...device.firmwares] });
        //reset({ ...device });
      } else {
        console.error("message", message);
        if (type === 1) setServerError(message);
        else setServerError("There is an error processing your request, Please try again later.");
      }
    } catch (error) {
      console.error(error);
      setServerError("There is an error processing your request, Please try again later.");
    }
  };

  const pushFirmwareToDevice = async () => {
    if (serverData?.device?._id && serverData?.firmwares && firmwareId) {
      const API_URI = `${ApiEndPoint(API_PATHS.USER_PUSH_FIRMWARE)}/${firmwareId}`;
      const { success, message, type } = await http.post(API_URI, { _id: firmwareId, deviceId: serverData.device._id });

      if (success) {
        toast.success(
          <ToastContent
            type="success"
            title="Success!"
            body={"Firmware pushed successfully, it will take few minutes to complete the process!"}
          />,
          {
            transition: Slide,
            hideProgressBar: true,
            autoClose: 4000,
          }
        );
        setHidden(true);
        setTimeout(() => {
          closeAndRefresh(false);
        }, 200);
      } else {
        toast.error(
          <ToastContent
            type="danger"
            title="Unable to push!"
            body={type === 1 ? message : "Unable to push firmware, please try again later"}
          />,
          { transition: Slide, hideProgressBar: true, autoClose: 4000 }
        );
      }
    }
  };

  const hideForm = (shouldRefresh = false) => {
    setHidden(true);

    setTimeout(() => {
      closeAndRefresh(shouldRefresh);
    }, 500);
  };

  // ** Render form, in a function to clear the render function
  const renderForm = () => (
    <>
      <Row>
        <Col md="2"></Col>
        <Col md="6" sm="12" className="mt-1">
          <SelectField
            name="firmware"
            label="Firmwares"
            options={serverData?.firmwares || []}
            onChange={(e) => setFirmwareId(e.target.value)}
            error={serverError?.firmware}
          />
        </Col>

        <Col md="2" sm="12" className={"d-flex align-items-center"} style={{ marginTop: "26px" }}>
          <FormGroup className="d-flex mb-0">
            <Button.Ripple
              className="mr-1"
              color="primary"
              type="submit"
              disabled={!firmwareId}
              onClick={pushFirmwareToDevice}
            >
              Push Firmware
            </Button.Ripple>
          </FormGroup>
        </Col>
      </Row>
      <Row>
        <Col md="2"></Col>
        <Col md="6" sm="12">
          <div style={{ fontSize: "0.9rem", fontWeight: 500 }}>
            Please make sure device is powered on before pushing the firmware update. It will take few minutes to
            complete the OTA.
          </div>
        </Col>
      </Row>
    </>
  );

  return (
    <SlideDown className={"react-slidedown"}>
      {!hidden ? (
        <Card>
          <CardHeader className={classNames({ "border-bottom": true, "justify-content-end": hidden })}>
            <CardTitle className={classNames({ "d-flex w-100 justify-content-between": !hidden })}>
              <>
                <h4>Update Device Firmware - {serverData?.device?.name}</h4>
                <XCircle size={24} onClick={hideForm} style={{ cursor: "pointer" }} />
              </>
            </CardTitle>
          </CardHeader>

          <CardBody>
            {serverError && (
              <Alert color="danger" isOpen={serverError !== null} fade={true}>
                <div className="alert-body">
                  <AlertCircle size={15} />
                  <span className="ml-1">{serverError}</span>
                </div>
              </Alert>
            )}
            {renderForm()}
          </CardBody>
        </Card>
      ) : null}
    </SlideDown>
  );
};

export default DeviceFirmware;
