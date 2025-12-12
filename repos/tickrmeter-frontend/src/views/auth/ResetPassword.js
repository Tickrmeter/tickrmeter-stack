import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Row, Col, CardTitle, Button, Form } from "reactstrap";
import { Link, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";

import moment from "moment";

import useJwt from "@src/auth/jwt/useJwt";
import { yupResolver } from "@hookform/resolvers/yup";
import { ResetPasswordSchema } from "./helper";
import AuthLeft from "./AuthLeft";
import { InputField } from "@src/@core/components/fields/input-fields-new";

import "@styles/base/pages/page-auth.scss";

const Register = () => {
  const { token } = useParams();

  const { register, handleSubmit, formState } = useForm({
    resolver: yupResolver(ResetPasswordSchema),
    mode: "onChange",
    reValidateMode: "onSubmit",
    defaultValues: { password: "", confirmPassword: "" },
  });
  const { isValid, isSubmitting, errors } = formState;
  //const [regDetails, setRegDetails] = useState({ ...registerDefaultValues });

  const [serverError, setServerError] = useState(null);

  const [resetToken, setResetToken] = useState(null);

  useEffect(() => {
    validateToken();
  }, []);

  const validateToken = async () => {
    try {
      if (!token) {
        setServerError("INVALID_TOKEN");
      } else {
        setServerError(null);
        setResetToken(token);
      }
    } catch (error) {
      setServerError("INVALID_TOKEN");
    }
  };

  const onSubmit = async (values) => {
    //console.log({ values });

    try {
      //const res = useJwt.register({ ...regDetails });

      const { success, data, message } = await useJwt.resetPassword({
        token: resetToken,
        password: values.password,
      });

      if (success) {
        setServerError("RESET_SUCCESS");
      } else {
        setServerError("RESET_ERROR");
      }
      //console.log({ success, data, message });

      // if (success && message === "USER_REGISTERED") {
      //   setUserRegistered(true);
      //   setServerError(null);
      //   return;
      // }

      // if (!success && message === "EMAIL_EXISTS") {
      //   setServerError(
      //     <>
      //       The email is already being used. Forgot Password? <Link to="/forgot-password">Click Here</Link> to reset.
      //     </>
      //   );
      //   return;
      //}

      //return showErrorToast(message);
    } catch (error) {
      //showErrorToast();
      console.error(error);
    }
  };

  const renderResetPasswordForm = () => (
    <>
      <CardTitle tag="h2" className="font-weight-bold mb-1">
        Reset your Password!
      </CardTitle>

      {/* {serverError && serverError !== "INVALID_TOKEN" && (
        <Alert color="danger" isOpen={serverError !== null} fade={true}>
          <div className="alert-body">
            <AlertCircle size={15} />
            <span className="ml-1">{serverError}</span>
          </div>
        </Alert>
      )} */}

      <Form className="auth-register-form mt-2" onSubmit={handleSubmit(onSubmit)}>
        <InputField
          type="password"
          label="Password"
          name="password"
          placeholder="********"
          labelClassName="form-label"
          // onChange={onInputChange}
          register={register}
          error={errors?.password}
        />

        <InputField
          type="password"
          label="Confirm Password"
          name="confirmPassword"
          placeholder="********"
          labelClassName="form-label"
          // onChange={onInputChange}
          register={register}
          error={errors?.confirmPassword}
        />

        <Button.Ripple type="submit" block color="primary" disabled={!formState.isValid || isSubmitting}>
          {isSubmitting ? <FontAwesomeIcon icon={["fas", "spinner"]} size="2x" pulse /> : "Reset Password"}
        </Button.Ripple>
      </Form>
      <p className="text-center mt-2">
        <span className="mr-25">Already have an account?</span>
        <Link to="/login">
          <span>Sign in instead</span>
        </Link>
      </p>
    </>
  );

  const renderExpiredToken = () => (
    <>
      <h2 className="font-weight-bold mb-1">Reset your Password!</h2>
      <p className="pt-4 font-medium-5 line-height-condensed">
        This password reset link is no longer valid. Each password reset link can only be used once. You can request a
        new link <Link to="/forgot-password">Clicking here</Link>.
      </p>

      <div className="divider my-2">
        <div className="divider-text"></div>
      </div>
      <p className="font-medium-2 mt-2">
        <Link to="/login">
          <span>Click here to Signin</span>
        </Link>
      </p>
    </>
  );

  const renderResetSuccess = () => (
    <>
      <h2 className="font-weight-bold mb-1">Reset your Password!</h2>
      <p className="pt-4 font-medium-5 line-height-condensed">
        Password reset successfully, Please <Link to="/login">Login</Link> again!
      </p>
      <div className="divider my-2">
        <div className="divider-text"></div>
      </div>
      <p className="font-medium-2 mt-2">
        <Link to="/login">
          <span>Click here to Signin</span>
        </Link>
      </p>
    </>
  );

  const renderResetError = () => (
    <>
      <h2 className="font-weight-bold mb-1">Reset your Password!</h2>
      <p className="pt-4 font-medium-5 line-height-condensed">
        There is some error reseting your password. Please try again later or request a new link by{" "}
        <Link to="/forgot-password">Clicking here</Link>.
      </p>
      <div className="divider my-2">
        <div className="divider-text"></div>
      </div>
      <p className="font-medium-2 mt-2">
        <Link to="/login">
          <span>Click here to Signin</span>
        </Link>
      </p>
    </>
  );

  return (
    <div className="auth-wrapper auth-v2">
      <Row className="auth-inner m-0">
        <AuthLeft />
        <Col className="d-flex align-items-center auth-bg px-2 p-lg-5" lg="4" sm="12">
          <Col className="px-xl-2 mx-auto" sm="8" md="6" lg="12">
            {serverError === "INVALID_TOKEN"
              ? renderExpiredToken()
              : serverError === "RESET_ERROR"
              ? renderResetError()
              : serverError === "RESET_SUCCESS"
              ? renderResetSuccess()
              : renderResetPasswordForm()}
          </Col>
        </Col>
      </Row>
    </div>
  );
};

export default Register;
