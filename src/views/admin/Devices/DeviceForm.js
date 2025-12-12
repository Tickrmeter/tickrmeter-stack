import { useState, useEffect } from "react";
import classNames from "classnames";

import { SlideDown } from "react-slidedown";
import "react-slidedown/lib/slidedown.css";

import { AlertCircle, XCircle } from "react-feather";

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

import { Card, CardHeader, Form, FormGroup, Button, CardBody, CardTitle, Row, Col, Alert } from "reactstrap";

import { CheckBoxFieldControl, InputField } from "@src/@core/components/fields/input-fields-new";

import http from "@src/utility/http";
import { ApiEndPoint, API_PATHS } from "@src/redux/api-paths";

import { toast, Slide } from "react-toastify";
import ToastContent from "@src/utility/toast-content";

import { DeviceSchema, deviceDefaults as defaultValues } from "./helper";

const DeviceForm = ({ postSubmit, refreshGrid, editDeviceId, setEditDeviceId }) => {
  // ** Component States
  const [hidden, setHidden] = useState(true);
  //const [deviceDetails, setDeviceDetails] = useState({ ...defaultValues });
  const [serverError, setServerError] = useState(null);

  // ** React Hook form
  const { register, formState, control, handleSubmit, reset } = useForm({
    mode: "onChange",

    resolver: yupResolver(DeviceSchema),
    defaultValues: { ...defaultValues },
  });

  const { errors } = formState;

  useEffect(() => {
    if (editDeviceId) {
      setHidden(false);
      getDeviceForEdit();
    }
  }, [editDeviceId]);

  //** Edit Device */
  const getDeviceForEdit = async () => {
    try {
      const {
        success,
        data: device,
        message,
        type,
      } = await http.get(`${ApiEndPoint(API_PATHS.GET_DEVICE)}/${editDeviceId}`);

      if (success) {
        reset({ ...device });
      } else {
        if (type === 1) setServerError(message);
        else setServerError("There is an error processing your request, Please try again later.");
      }
    } catch (error) {
      setServerError("There is an error processing your request, Please try again later.");
    }
  };

  const onSubmit = async (data) => {
    if (formState.isValid) {
      const { success, message, type } = editDeviceId
        ? await http.put(`${ApiEndPoint(API_PATHS.UPDATE_DEVICE)}/${editDeviceId}`, { ...data, _id: editDeviceId })
        : await http.post(ApiEndPoint(API_PATHS.CREATE_DEVICE), data);

      if (success) {
        showToast();
        postSubmit(!refreshGrid);
        resetForm();
      } else {
        if (type === 1) setServerError(message);
        else setServerError("There is an error processing your request, Please try again later.");
      }
    } else {
      //console.log(formState);
      //console.log(errors);
    }
  };

  const resetForm = () => {
    reset({ ...defaultValues });
    setServerError(null);
    hideForm();
  };

  const showToast = () => {
    toast.success(
      <ToastContent
        type="success"
        title="Success!"
        body={`Device ${editDeviceId ? "updated" : "added"} successfully!`}
      />,
      {
        transition: Slide,
        hideProgressBar: true,
        autoClose: 2000,
      }
    );
  };

  const hideForm = () => {
    setEditDeviceId(null);
    setHidden(true);
  };

  // ** Render form, in a function to clear the render function
  const renderForm = () => (
    <Form className="pt-1" onSubmit={handleSubmit(onSubmit)}>
      <Row>
        <Col md="6" sm="12">
          <InputField name="name" label="Name" placeholder="Bedroom" register={register} error={errors?.name} />
        </Col>
        <Col md="6" sm="12">
          <InputField
            name="macAddress"
            label="MAC Address"
            readOnly={editDeviceId}
            placeholder="000000000000"
            maxLength={12}
            register={register}
            error={errors?.macAddress}
            style={{ textTransform: "uppercase" }}
          />
        </Col>

        <Col md="6" sm="12">
          <CheckBoxFieldControl name="isActive" label="Is Active" control={control} />
        </Col>
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
    <Card>
      <CardHeader className={classNames({ "border-bottom": true, "justify-content-end": hidden })}>
        <CardTitle className={classNames({ "d-flex w-100 justify-content-between": !hidden })}>
          {hidden ? (
            <Button.Ripple color="primary" onClick={() => setHidden(false)}>
              New Device
            </Button.Ripple>
          ) : (
            <>
              <h4>{editDeviceId ? "Edit Device" : "New Device"}</h4>
              <XCircle size={24} onClick={hideForm} style={{ cursor: "pointer" }} />
            </>
          )}
        </CardTitle>
      </CardHeader>

      <SlideDown className={"react-slidedown"}>
        {!hidden ? (
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
        ) : null}
      </SlideDown>
    </Card>
  );
};

export default DeviceForm;
