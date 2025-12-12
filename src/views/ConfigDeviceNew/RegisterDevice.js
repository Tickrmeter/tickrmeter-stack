import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { SlideDown } from "react-slidedown";

import { AlertCircle, XCircle } from "react-feather";

import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

import { Card, CardHeader, Form, FormGroup, Button, CardBody, CardTitle, Row, Col, Alert, Input } from "reactstrap";

import { CheckBoxField, InputField } from "@src/utility/input-fields-new";

import http from "@src/utility/http";
import { ApiEndPoint, API_PATHS } from "@src/redux/api-paths";

import { toast, Slide } from "react-toastify";
import ToastContent from "@src/utility/toast-content";

import { deviceRegDefaults as defaultValues } from "./helper";
import FormFeedback from "reactstrap/lib/FormFeedback";

const RegisterDevice = ({ closeAndRefresh, deviceId }) => {
  // ** Component States
  const navigate = useNavigate();
  const [serverError, setServerError] = useState(null);
  const inputRefs = useRef([]);

  // ** React Hook form
  const { reset, control, setValue, getValues, handleSubmit, watch } = useForm({
    mode: "onChange",
    defaultValues: { ...defaultValues },
  });

  const values = watch(["r1", "r2", "r3", "r4", "r5"]); // Watch all 5 fields

  const handleInputChange = (e, index) => {
    const { value } = e.target;

    // If a digit is entered, update the value in RHF and move focus to next input
    if (value.length <= 1) {
      setValue(`r${index + 1}`, value);

      if (value !== "" && inputRefs.current[index + 1]) {
        inputRefs.current[index + 1].focus();
      }
    }
  };

  const handleKeyDown = (e, index) => {
    const { key } = e;
    const isBackspace = key === "Backspace";

    // If Backspace is pressed and the input is empty, shift focus to previous input
    if (isBackspace && getValues(`r${index + 1}`) === "") {
      // Shift focus to previous input
      if (index > 0) {
        inputRefs.current[index - 1].focus();
        inputRefs.current[index - 1].select(); // Select the content for easy editing
        setValue(`r${index + 1}`, ""); // Clear the current field
      }
    }
    if (key !== "Backspace" && !/^\d$/.test(key)) {
      e.preventDefault(); // Block non-numeric characters
    }
  };

  const onSubmit = async (data) => {
    if (allKeyAvailable) {
      const registrationCode = Object.keys(data).reduce((acc, c) => acc + data[c], "");

      const { success, message, type } = await http.put(`${ApiEndPoint(API_PATHS.REGISTER_DEVICE)}`, {
        registrationCode,
      });

      if (success) {
        showToast();
        resetForm(true);
        navigate("/my-devices");
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
    //setRegValue({ ...defaultValues });
    reset({ ...defaultValues });
    setServerError(null);
  };

  const showToast = () => {
    toast.success(<ToastContent type="success" title="Success!" body={`Device Registered successfully.`} />, {
      transition: Slide,
      hideProgressBar: true,
      autoClose: 3000,
    });
  };

  const allKeyAvailable = () => values.every((value) => value !== "");

  // ** Render form, in a function to clear the render function
  const renderForm = () => (
    <Form className="pt-1" onSubmit={handleSubmit(onSubmit)}>
      <Row className="justify-content-center">
        <Col sm="12" xl="6" lg="8" className="reg-container">
          {Array.from({ length: 5 }, (_, index) => (
            <FormGroup>
              <Controller
                name={`r${index + 1}`}
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    type="text"
                    maxLength="1"
                    className="reg-code"
                    onChange={(e) => handleInputChange(e, index)}
                    value={getValues(`r${index + 1}`)} // Make sure the value is controlled by RHF
                    onKeyDown={(e) => handleKeyDown(e, index)} // Handle backspace (focus shift)
                    innerRef={(el) => (inputRefs.current[index] = el)}
                    autoFocus={index === 0}
                  />
                )}
              />
            </FormGroup>
          ))}
        </Col>
      </Row>
      <Row className="justify-content-center">
        <Col sm="12" xl="6" lg="8" className="reg-container mb-5">
          <h3>Please enter 5 digit code displayed on your tickrmeter.</h3>
        </Col>
      </Row>
      <Row className="justify-content-center">
        <Col sm="12" xl="6" lg="8" className="reg-container">
          <FormGroup className="d-flex mb-0">
            <Button.Ripple className="mr-1" color="primary" type="submit" disabled={!allKeyAvailable()}>
              Register
            </Button.Ripple>

            <Button.Ripple outline color="secondary" type="button" onClick={resetForm}>
              Clear
            </Button.Ripple>
          </FormGroup>
        </Col>
      </Row>
    </Form>
  );

  return (
    <SlideDown className={"react-slidedown"}>
      <Card>
        <CardHeader className="border-bottom">
          <CardTitle>
            <h4>Register a New Tickrmeter</h4>
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
    </SlideDown>
  );
};

export default RegisterDevice;
