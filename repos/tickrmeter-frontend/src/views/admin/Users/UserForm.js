import { useState, useEffect } from "react";
import classNames from "classnames";

import { SlideDown } from "react-slidedown";
import "react-slidedown/lib/slidedown.css";

import { AlertCircle, XCircle } from "react-feather";

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

import { Card, CardHeader, Form, FormGroup, Button, CardBody, CardTitle, Row, Col, Alert } from "reactstrap";

import { CheckBoxFieldControl, InputField } from "@components/fields/input-fields-new";

import http from "@src/utility/http";
import { ApiEndPoint, API_PATHS } from "@src/redux/api-paths";

import { toast, Slide } from "react-toastify";
import ToastContent from "@src/utility/toast-content";

import { UserSchema, UserEditSchema, userDefaults } from "./helper";

const AddUser = ({ postSubmit, refreshGrid, editUserId, setEditUserId }) => {
  // ** Component States
  const [hidden, setHidden] = useState(true);
  //const [userDetails, setUserDetails] = useState({ ...userDefaults });
  const [serverError, setServerError] = useState(null);

  // ** React Hook form
  const { register, control, formState, handleSubmit, reset } = useForm({
    mode: "onChange",

    resolver: yupResolver(editUserId ? UserEditSchema : UserSchema),
    defaultValues: { ...userDefaults },
  });

  const { errors } = formState;

  useEffect(() => {
    if (editUserId) {
      setHidden(false);
      getUserForEdit();
    }
  }, [editUserId]);

  //** Edit User */

  const getUserForEdit = async () => {
    try {
      const { success, data: user, message, type } = await http.get(`${ApiEndPoint(API_PATHS.GET_USER)}/${editUserId}`);

      if (success) {
        //setUserDetails({ ...user });
        reset({ ...user });
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
  //     ? setUserDetails({ ...userDetails, [e.target.name]: e.target.checked })
  //     : setUserDetails({ ...userDetails, [e.target.name]: e.target.value });

  const onSubmit = async (data) => {
    ////  if (formState.isValid) {
    const { success, message, type } = editUserId
      ? await http.put(`${ApiEndPoint(API_PATHS.UPDATE_USER)}/${editUserId}`, { ...data, _id: editUserId })
      : await http.post(ApiEndPoint(API_PATHS.CREATE_USER), data);

    if (success) {
      reset({ ...userDefaults });
      setServerError(null);
      showToast();
      postSubmit(!refreshGrid);
      hideForm();
    } else {
      if (type === 1) setServerError(message);
      else setServerError("There is an error processing your request, Please try again later.");
    }
    // } else {
    //console.log(formState);
    //console.log(errors);
    //  }
  };

  const onReset = () => {
    reset({ ...userDefaults });
    setServerError(null);
    hideForm();
  };

  const showToast = () => {
    toast.success(
      <ToastContent type="success" title="Success!" body={`User ${editUserId ? "updated" : "added"} successfully!`} />,
      {
        transition: Slide,
        hideProgressBar: true,
        autoClose: 2000,
      }
    );
  };

  const hideForm = () => {
    setEditUserId(null);
    setHidden(true);
  };

  // ** Render form, in a function to clear the render function
  const renderForm = () => (
    <Form className="pt-1" onSubmit={handleSubmit(onSubmit)}>
      <Row>
        <Col md="6" sm="12">
          <InputField name="name" label="Full Name" placeholder="John" register={register} error={errors?.name} />
        </Col>
        <Col md="6" sm="12">
          <InputField
            name="email"
            label="Email"
            readOnly={editUserId}
            placeholder="john@example.com"
            register={register}
            error={errors?.email}
          />
        </Col>
        <Col md="6" sm="12">
          <InputField
            type="password"
            label="Password"
            name="password"
            placeholder="********"
            register={register}
            error={errors?.password}
          />
        </Col>
        <Col md="6" sm="12">
          <InputField
            type="password"
            label="Confirm Password"
            name="confirmPassword"
            placeholder="********"
            register={register}
            error={errors?.confirmPassword}
          />
        </Col>
        <Col md="6" sm="12">
          <CheckBoxFieldControl name="isActive" control={control} label="Is Active" />
        </Col>
        <Col md="6" sm="12">
          <CheckBoxFieldControl name="isAdmin" control={control} label="Is Admin" />
        </Col>
        <Col sm="12">
          <FormGroup className="d-flex mb-0">
            <Button.Ripple className="mr-1" color="primary" type="submit" disabled={!formState.isValid}>
              Submit
            </Button.Ripple>
            <Button.Ripple outline color="secondary" type="button" onClick={onReset}>
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
              New User
            </Button.Ripple>
          ) : (
            <>
              <h4>{editUserId ? "Edit User" : "New User"}</h4>
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

export default AddUser;
