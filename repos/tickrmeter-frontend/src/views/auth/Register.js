import { Fragment, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import useJwt from "@src/auth/jwt/useJwt";

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { toast, Slide } from "react-toastify";
import ToastContent from "@src/utility/toast-content";

import { Row, Alert, Col, CardTitle, CardText, Button, Form } from "reactstrap";

import tickrmeterGif from "@images/pages/login/tickrMeter.gif";
import tickrmeterLogo from "@images/logo/logot_200x.png";
import "@styles/base/pages/page-auth.scss";
import { captchaKey, countries_list, registerDefaultValues, RegisterSchema, labelClassName } from "./helper";
import { CheckBoxFieldControl, InputField } from "@components/fields/input-fields-new";
import { SelectField } from "@components/fields/SelectField";
import { AlertCircle } from "react-feather";
import ReCAPTCHA from "react-google-recaptcha";
import jtArchLogo from "@images/jt-arch-logo.png";
import fxonLogo from "@images/fxon-logo.svg";

const Register = () => {
  const location = useLocation();

  const { register, control, handleSubmit, formState } = useForm({
    resolver: yupResolver(RegisterSchema),
    mode: "onChange",
    defaultValues: { ...registerDefaultValues, country: location.pathname === "/jt-arch" ? "czech_republic" : "" },
  });
  const { isSubmitting, errors } = formState;
  // const [regDetails, setRegDetails] = useState({ ...registerDefaultValues });

  const [captchaIsDone, setCaptchaDone] = useState(false);

  const [serverError, setServerError] = useState(null);
  const [userRegistered, setUserRegistered] = useState(false);

  const Terms = () => {
    return (
      <Fragment>
        I agree to
        <a className="ml-25" href="https://tickrmeter.com/policies/terms-of-service" target="_blank" rel="noreferrer">
          privacy policy & terms
        </a>
      </Fragment>
    );
  };
  const showErrorToast = (message, title = "Error") => {
    toast.error(<ToastContent type="danger" title={title} body={message} />, {
      transition: Slide,
      hideProgressBar: true,
      autoClose: 4000,
    });
    //if (formState.isValid) {```
  };

  //console.log(formState.isValid);
  //console.log(errors);
  const onSubmit = async (values) => {
    try {
      const meta = {};

      if (location.pathname === "/jt-arch") {
        meta.custom = true;
        meta.company = "J&T Arch";
        meta.country = "czech_republic";
      } else if (location.pathname === "/register-fxon") {
        meta.custom = true;
        meta.company = "FXON";
      } else {
        meta.country = values.country;
      }

      const registerData = {
        name: values.name,
        email: values.email,
        password: values.password,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        meta,
      };

      const { success, message } = await useJwt.register(registerData);

      if (success && message === "USER_REGISTERED") {
        setUserRegistered(true);
        setServerError(null);
        return;
      }

      if (!success && message === "EMAIL_EXISTS") {
        setServerError(
          <>
            This email address is already registered. If you&apos;ve forgotten your password,{" "}
            <Link to="/forgot-password">click here</Link> to reset it.
          </>
        );
        return;
      }

      return showErrorToast(message);
    } catch (error) {
      showErrorToast("An error occurred. Please try again later.");
    }
    //}
  };

  const renderRegisterForm = () => (
    <>
      {location.pathname === "/jt-arch" && (
        <div className="w-100 py-4">
          <img src={jtArchLogo} alt="J&T Arch" className="w-100" />
        </div>
      )}
      {location.pathname === "/register-fxon" && (
        <div className="w-100 py-4">
          <img src={fxonLogo} alt="FXON" className="w-100" />
        </div>
      )}
      <CardTitle tag="h2" className="font-weight-bold mb-1">
        Adventure starts here 🚀
      </CardTitle>
      <CardText className="mb-2">Make your app management easy and fun!</CardText>

      {serverError && (
        <Alert color="danger" isOpen={serverError !== null} fade={true}>
          <div className="alert-body">
            <AlertCircle size={15} />
            <span className="ml-1">{serverError}</span>
          </div>
        </Alert>
      )}

      <Form className="auth-register-form mt-2" onSubmit={handleSubmit(onSubmit)}>
        <InputField
          autoFocus
          name="name"
          placeholder="John"
          labelProps={{ label: "Full Name", labelClassName }}
          register={register}
          error={errors?.name}
        />

        <InputField
          name="email"
          placeholder="john@example.com"
          labelProps={{ label: "Email", labelClassName }}
          isInvalid={serverError}
          register={register}
          error={errors?.email}
        />

        <SelectField
          name="country"
          labelProps={{ label: "Country" }}
          placeholder={`Select your country...`}
          register={register}
          options={countries_list}
          selectProps={{ options: countries_list, placeholder: "Select your country..." }}
          error={errors?.country}
          disabled={location.pathname === "/jt-arch"}
        />

        <InputField
          type="password"
          name="password"
          placeholder="********"
          labelProps={{ label: "Password", labelClassName }}
          register={register}
          error={errors?.password}
        />

        <InputField
          type="password"
          name="confirmPassword"
          placeholder="********"
          labelProps={{ label: "Confirm Password", labelClassName }}
          register={register}
          error={errors?.confirmPassword}
        />

        <CheckBoxFieldControl
          name="terms"
          labelProps={{ label: <Terms />, labelType: "component" }}
          control={control}
          error={errors?.terms}
        />

        <ReCAPTCHA
          sitekey={captchaKey}
          onChange={() => setCaptchaDone(true)}
          onError={() => setCaptchaDone(false)}
          onExpired={() => setCaptchaDone(false)}
        />

        <Button.Ripple className="mt-2" type="submit" block color="primary" disabled={isSubmitting || !captchaIsDone}>
          {isSubmitting ? <FontAwesomeIcon icon={["fas", "spinner"]} size="2x" pulse /> : "Sign up"}
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

  const renderCheckEmailMsg = () => (
    <>
      <h3 className="display-3">Welcome!</h3>
      <p className="pt-4 font-medium-5 line-height-condensed">
        Thank you for your registration on <span className="green-text">TickrMeter</span> portal.{" "}
      </p>
      <p className="font-medium-5 line-height-condensed">
        Kindly check your email to confirm you email address and start using your{" "}
        <span className="green-text">TickrMeter</span>.
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
        <Link className="brand-logo p-sm-5" to="/">
          <img src={tickrmeterLogo} alt="Tickrmeter Logo" />
        </Link>

        <Col className="d-none d-lg-flex align-items-center p-5" lg="8" sm="12">
          <div className="w-100 d-lg-flex flex-column align-items-center justify-content-center px-5">
            <Col sm="10">
              <img className="img-fluid" src={tickrmeterGif} alt="Tickrmeter" />
              <h1 className="login-heading">Stock tickers for your table</h1>
              <h3 className="font-weight-light">They call it the second best thing to a bloomberg terminal</h3>
            </Col>
          </div>
        </Col>
        <Col className="d-flex align-items-center auth-bg mt-5 pt-1 mt-sm-0 px-2 p-lg-5 " lg="4" sm="12">
          <Col className="px-xl-2 mx-auto" sm="8" md="6" lg="12">
            {userRegistered ? renderCheckEmailMsg() : renderRegisterForm()}
          </Col>
        </Col>
      </Row>
    </div>
  );
};

export default Register;
