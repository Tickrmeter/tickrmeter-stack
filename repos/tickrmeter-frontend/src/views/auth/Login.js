import { useState } from "react";
import classnames from "classnames";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

import { Row, Col, CardTitle, CardText, Form, FormGroup, Label, Input, CustomInput, Button } from "reactstrap";
import { toast, Slide } from "react-toastify";

import { handleLogin } from "@src/redux/actions/auth";

import InputPasswordToggle from "@components/input-password-toggle";

import { isObjEmpty } from "@utils";
import useJwt from "@src/auth/jwt/useJwt";

import ToastContent from "@src/utility/toast-content";
import { LoginSchema } from "./helper";

import "@styles/base/pages/page-auth.scss";
import AuthLeft from "./AuthLeft";
import { InputField } from "@components/fields/input-fields-new";

const defaultAuthDetails = { email: "", password: "" };

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { register, handleSubmit, formState } = useForm({
    resolver: yupResolver(LoginSchema),
    mode: "onChange",

    defaultValues: defaultAuthDetails,
  });

  const { errors } = formState;

  const showErrorToast = () => {
    toast.error(
      <ToastContent
        type="danger"
        title="Invalid Credentials"
        body="You have entered an invalid email or password. Kindly check and try again"
      />,
      { transition: Slide, hideProgressBar: true, autoClose: 4000 }
    );
  };

  const onSubmit = async (authDetails) => {
    if (!isObjEmpty(errors)) return;

    try {
      const res = await useJwt.login({ email: authDetails.email, password: authDetails.password });

      const {
        data: { success, data, message },
      } = res;

      if (!success && message === "USER_NOT_ACTIVE") {
        toast.error(
          <ToastContent
            type="danger"
            title="Account Not Confirmed"
            body="Your account has not been confirmed. Kindly check your email for the confirmation link"
          />,
          { transition: Slide, hideProgressBar: true, autoClose: 4000 }
        );
        return;
      }

      if (!success && message === "Unable to authenticate user") return showErrorToast();
      if (!success) {
        return toast.error(
          <ToastContent type="danger" title="Error" body="There is some error logging you in, please try again" />,
          { transition: Slide, hideProgressBar: true, autoClose: 4000 }
        );
      }

      const userData = { ...data.userData, accessToken: data.token, menuItems: data.menuItems };
      dispatch(handleLogin(userData));
      navigate("/my-devices");
    } catch (error) {
      console.error(error);
      showErrorToast();
    }
  };

  return (
    <div className="auth-wrapper auth-v2">
      <Row className="auth-inner m-0">
        <AuthLeft />
        <Col className="d-flex align-items-center auth-bg px-2 p-lg-5" lg="4" sm="12">
          <Col className="px-xl-2 mx-auto" sm="8" md="6" lg="12">
            <CardTitle tag="h2" className="font-weight-bold mb-1">
              Welcome to Tickrmeter!
            </CardTitle>
            <CardText className="mb-2">Please sign-in to your account and start the adventure</CardText>
            <Form className="auth-login-form mt-2" onSubmit={handleSubmit(onSubmit)}>
              <InputField
                autoFocus
                tabIndex="1"
                id="email"
                name="email"
                label={"Email"}
                labelProps={{ label: "Email", className: "form-label" }}
                placeholder="john@example.com"
                className={classnames({ "is-invalid": errors.email })}
                register={register}
                error={errors.email}
              />

              <InputField
                tabIndex="2"
                id="password"
                name="password"
                type="password"
                labelType="component"
                labelProps={{
                  labelClassName: "form-label",
                  labelType: "component",
                  label: (
                    <>
                      <div className="d-flex justify-content-between">
                        <Label className="form-label" for="password">
                          Password
                        </Label>
                        <Link to="/forgot-password" tabIndex="5">
                          <small>Forgot Password?</small>
                        </Link>
                      </div>
                    </>
                  ),
                }}
                placeholder="********"
                passwordToggle={true}
                className={classnames({ "is-invalid": errors.password, "input-group-merge": true })}
                register={register}
                error={errors.password}
              />
              <FormGroup>
                <CustomInput
                  tabIndex="3"
                  type="checkbox"
                  className="custom-control-Primary"
                  id="remember-me"
                  label="Remember Me"
                />
              </FormGroup>
              <Button color="primary" block size="lg" type="submit" tabIndex="4">
                Sign in
              </Button>
            </Form>
            <p className="text-center mt-2">
              <span className="mr-25">New on our platform?</span>
              <Link to="/register">
                <span>Create an account</span>
              </Link>
            </p>
          </Col>
        </Col>
      </Row>
    </div>
  );
};

export default Login;
