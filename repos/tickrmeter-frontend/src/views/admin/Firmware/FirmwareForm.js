import { useState, useEffect } from "react";
import classNames from "classnames";

import { SlideDown } from "react-slidedown";
import "react-slidedown/lib/slidedown.css";

import { AlertCircle, XCircle } from "react-feather";

import { Card, Spinner, CardHeader, Form, FormGroup, Button, CardBody, CardTitle, Row, Col, Alert } from "reactstrap";

import http from "@src/utility/http";
import { ApiEndPoint, API_PATHS } from "@src/redux/api-paths";

import { toast, Slide } from "react-toastify";
import ToastContent from "@src/utility/toast-content";

import { firmwareDefaults as defaultValues } from "./helper";
import { UploadField, CheckBoxField, InputField } from "@src/@core/components/fields/input-fields-new";

const FirmwareForm = ({ postSubmit, refreshGrid }) => {
  // ** Component States
  const [hidden, setHidden] = useState(true);
  const [serverError, setServerError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formValues, setFormValues] = useState({ ...defaultValues });
  const [errors, setErrors] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);

  // ** React Hook form
  // const { register, formState, handleSubmit, control, reset } = useForm({
  //   mode: "onChange",
  //   resolver: yupResolver(FirmwareSchema),
  //   defaultValues: { ...defaultValues },
  // });

  // const { errors } = formState;

  const reset = () => setFormValues({ ...defaultValues });

  const onSubmit = async (e) => {
    try {
      e.preventDefault();

      const { isValid } = validateForm();

      if (!isValid) return;

      setIsLoading(true);

      const data = formValues;
      const chkObject = {
        version: data.version,
        fileName: data.firmwareFile.name,
      };

      const { success, message, type } = await http.post(ApiEndPoint(API_PATHS.CHK_FIRMWARE), chkObject);

      if (!success) {
        if (type === 1) setServerError(message);
        else setServerError("There is an error processing your request, Please try again later.");
        return;
      }

      const formData = new FormData();

      formData.append("version", data.version);
      formData.append("firmwareFile", data.firmwareFile);
      formData.append("isRelease", data.isRelease);

      const {
        success: uploadSuccess,
        message: uploadMsg,
        type: uploadType,
      } = await http.post(ApiEndPoint(API_PATHS.UPLOAD_FIRMWARE), formData);

      if (uploadSuccess) {
        showToast();
        postSubmit(!refreshGrid);
        resetForm();
      } else {
        if (uploadType === 1) setServerError(uploadMsg);
        else setServerError("There is an error processing your request, Please try again later.");
      }
    } catch (error) {
      console.error(error);
      setServerError("There is an error processing your request, Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    reset({ ...defaultValues });

    setServerError(null);
    hideForm();
  };

  const showToast = () => {
    toast.success(<ToastContent type="success" title="Success!" body={`Firmware uploaded successfully!`} />, {
      transition: Slide,
      hideProgressBar: true,
      autoClose: 2000,
    });
  };

  const hideForm = () => setHidden(true);

  useEffect(() => {
    const { newErrors, isValid } = validateForm();
    setErrors(newErrors);
    setIsFormValid(isValid);
  }, [formValues]);

  const validateForm = () => {
    let isValid = true;
    const newErrors = {};

    // Version validation
    if (!formValues.version || formValues.version.trim() === "") {
      newErrors.version = { message: "Version No is required!" };
      isValid = false;
    } else if (formValues.version.length > 5) {
      newErrors.version = { message: "Version must be at most 5 characters." };
      isValid = false;
    }

    // Firmware file validation
    if (!formValues.firmwareFile) {
      newErrors.firmwareFile = { message: "Kindly select the file." };
      isValid = false;
    }

    // Set all errors at once
    return { newErrors, isValid };
  };

  // ** Render form, in a function to clear the render function
  const renderForm = () => (
    <Form className="pt-1" onSubmit={onSubmit}>
      <Row>
        <Col md="12" sm="12">
          <InputField
            name="version"
            label="Version No."
            placeholder="v1.0"
            onChange={(e) => setFormValues({ ...formValues, version: e.target.value })}
            // onBlur={validateForm}
            value={formValues.version}
            error={errors?.version}
          />
        </Col>
        <Col md="12" sm="12" className="d-flex align-items-center">
          <CheckBoxField
            name="isRelease"
            labelProps={{ label: "Is Release", className: "form-label" }}
            onChange={(e) => setFormValues({ ...formValues, isRelease: e.target.checked })}
            checked={formValues.isRelease}
          />
        </Col>
        <Col md="12" sm="12">
          <UploadField
            name="firmwareFile"
            label="Firmware File"
            onChange={(e) => setFormValues({ ...formValues, firmwareFile: e.target.files[0] })}
            value={formValues.firmwareFile}
            error={errors?.firmwareFile}
          />
        </Col>

        <Col sm="12">
          <FormGroup className="d-flex mb-0">
            {isLoading ? (
              <Spinner color="primary" className="mr-50" />
            ) : (
              <Button.Ripple className="mr-1" color="primary" type="submit" disabled={!isFormValid || isLoading}>
                Submit
              </Button.Ripple>
            )}
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
              New Firmware
            </Button.Ripple>
          ) : (
            <>
              <h4> New Firmware</h4>
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
            <Row className="justify-content-center">
              <Col xl="5" lg="6" md="8" sm="12">
                {renderForm()}
              </Col>
            </Row>
          </CardBody>
        ) : null}
      </SlideDown>
    </Card>
  );
};

export default FirmwareForm;
