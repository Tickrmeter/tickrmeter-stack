import { useState, useEffect } from "react";
import classNames from "classnames";

import { SlideDown } from "react-slidedown";
import "react-slidedown/lib/slidedown.css";

import { AlertCircle, XCircle } from "react-feather";

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

import { Card, CardHeader, Form, FormGroup, Button, CardBody, CardTitle, Row, Col, Alert, Label } from "reactstrap";

import { CheckBoxFieldControl, InputField } from "@components/fields/input-fields-new";
import { SelectFieldControl } from "@src/@core/components/fields/SelectField";

import http from "@src/utility/http";
import { ApiEndPoint, API_PATHS } from "@src/redux/api-paths";

import { toast, Slide } from "react-toastify";
import ToastContent from "@src/utility/toast-content";

import { DeviceSchema, deviceDefaults as defaultValues, getTimeOptions } from "./helper";

const DeviceForm = ({ closeAndRefresh, deviceId }) => {
  // ** Component States
  const [hidden, setHidden] = useState(true);
  //const [deviceDetails, setDeviceDetails] = useState({ ...defaultValues });
  const [serverError, setServerError] = useState(null);

  // ** React Hook form
  const { register, formState, handleSubmit, reset, watch, control } = useForm({
    mode: "onChange",

    resolver: yupResolver(DeviceSchema),
    defaultValues: { ...defaultValues },
  });

  const { errors } = formState;

  useEffect(() => {
    if (deviceId) {
      setHidden(false);
      getDeviceForEdit();
    }
  }, [deviceId]);

  const nightMode = watch("nightMode");

  //** Call API to get the Device details from the server. */
  const getDeviceForEdit = async () => {
    try {
      const {
        success,
        data: device,
        message,
        type,
      } = await http.get(`${ApiEndPoint(API_PATHS.GET_MY_DEVICES)}/${deviceId}`);

      if (success) {
        //setDeviceDetails({ ...device });
        reset({ ...device });
      } else {
        if (type === 1) setServerError(message);
        else setServerError("There is an error processing your request, Please try again later.");
      }
    } catch (error) {
      setServerError("There is an error processing your request, Please try again later.");
    }
  };

  // ** Form Events
  // const onInputChange = (e) =>
  //   e.target.type === "checkbox"
  //     ? setDeviceDetails({ ...deviceDetails, [e.target.name]: e.target.checked })
  //     : setDeviceDetails({ ...deviceDetails, [e.target.name]: e.target.value });

  const onSubmit = async (data) => {
    if (formState.isValid) {
      const { success, message, type } = await http.put(`${ApiEndPoint(API_PATHS.UPDATE_MY_DEVICE)}/${deviceId}`, {
        ...data,
        isActive: true,
        _id: deviceId,
      });

      if (success) {
        showToast();

        resetForm(true);
      } else {
        if (type === 1) setServerError(message);
        else setServerError("There is an error processing your request, Please try again later.");
      }
    } else {
      //console.log(formState);
      //console.log(errors);
    }
  };

  const resetForm = (shouldRefresh = false) => {
    reset({ ...defaultValues });
    setServerError(null);
    hideForm(shouldRefresh);
  };

  const showToast = () => {
    toast.success(
      <ToastContent type="success" title="Success!" body={`Device ${deviceId ? "updated" : "added"} successfully!`} />,
      {
        transition: Slide,
        hideProgressBar: true,
        autoClose: 2000,
      }
    );
  };

  const hideForm = (shouldRefresh = false) => {
    setHidden(true);

    setTimeout(() => {
      closeAndRefresh(shouldRefresh);
    }, 100);
  };

  // ** Render form, in a function to clear the render function
  const renderForm = () => (
    <Form className="pt-1" onSubmit={handleSubmit(onSubmit)}>
      <Row>
        <Col md="6" sm="12">
          <InputField
            name="name"
            labelProps={{ label: "Device Name", labelType: "component" }}
            placeholder="Bedroom"
            register={register}
            error={errors?.name}
          />
        </Col>
        <Col md="6" sm="12">
          <InputField
            name="macAddress"
            labelProps={{ label: "Mac Address", labelType: "component" }}
            readOnly={deviceId}
            placeholder="000000000000"
            maxLength={12}
            register={register}
            error={errors?.macAddress}
            style={{ textTransform: "uppercase" }}
          />
        </Col>
      </Row>
      <Row>
        <Col md="6" sm="12" className="d-flex align-items-center">
          <CheckBoxFieldControl
            name="nightMode"
            labelProps={{ label: <>Enable Night Mode</>, labelType: "component" }}
            control={control}
            error={errors?.nightMode}
          />
        </Col>
        <Col md="6" sm="12">
          {nightMode && (
            <Row>
              <Col md="6">
                <SelectFieldControl
                  name="nightModeStart"
                  labelProps={{ label: <>Start Time</>, labelType: "component" }}
                  control={control}
                  defaultValue={"22:00"}
                  error={errors?.nightModeTime}
                  options={getTimeOptions()}
                />
              </Col>
              <Col md="6">
                <SelectFieldControl
                  name="nightModeEnd"
                  labelProps={{ label: <>End Time</>, labelType: "component" }}
                  control={control}
                  error={errors?.nightModeTime}
                  defaultValue={"06:00"}
                  options={getTimeOptions()}
                />
              </Col>
            </Row>
          )}
        </Col>
      </Row>
      <Row>
        <Col sm="12">
          <FormGroup className="d-flex mb-0">
            <Button.Ripple className="mr-1" color="primary" type="submit" disabled={!formState.isValid}>
              Submit
            </Button.Ripple>
            <Button.Ripple outline color="secondary" type="button" onClick={resetForm}>
              Reset
            </Button.Ripple>
          </FormGroup>
        </Col>
      </Row>
    </Form>
  );

  return (
    <SlideDown className={"react-slidedown"}>
      {!hidden ? (
        <Card>
          <CardHeader className={classNames({ "border-bottom": true, "justify-content-end": hidden })}>
            <CardTitle className={classNames({ "d-flex w-100 justify-content-between": !hidden })}>
              <>
                <h4>Edit Device</h4>
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

export default DeviceForm;
