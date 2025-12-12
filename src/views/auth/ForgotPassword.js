import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";
import { ChevronLeft } from "react-feather";
import { Row, Col, CardTitle, CardText, Form, FormGroup, Label, Input, Button } from "reactstrap";

import "@styles/base/pages/page-auth.scss";
import useJwt from "@src/auth/jwt/useJwt";
import AuthLeft from "./AuthLeft";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { ForgotPasswordSchema, captchaKey } from "./helper";

import { toast, Slide } from "react-toastify";
import ToastContent from "@src/utility/toast-content";
import { InputField } from "@src/@core/components/fields/input-fields-new";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [captchaIsDone, setCaptchaDone] = useState(false);
  const { register, handleSubmit, formState, reset } = useForm({
    resolver: yupResolver(ForgotPasswordSchema),
    mode: "onBlur",
    reValidateMode: "onSubmit",
    defaultValues: { email: "" },
  });

  const { errors } = formState;

  const onSubmit = async (values) => {
    try {
      await useJwt.forgotPassword({
        ...values,
      });

      reset();

      toast.success(
        <ToastContent type="success" title="Email sent!" body="We have sent you an email to reset your password. " />,
        {
          transition: Slide,
          hideProgressBar: true,
          autoClose: 4000,
        }
      );
      navigate("/login");
    } catch (error) {
      toast.error(
        <ToastContent type="danger" title="Error!" body="There is some error while processing your request." />,
        {
          transition: Slide,
          hideProgressBar: true,
          autoClose: 4000,
        }
      );
    }
  };

  const renderForgotPassword = () => (
    <>
      <CardTitle tag="h2" className="font-weight-bold mb-1">
        Forgot Password?
      </CardTitle>
      <CardText className="mb-2">
        Enter your email and we&rsquo;ll send you instructions to reset your password
      </CardText>
      <Form className="auth-forgot-password-form mt-2" onSubmit={handleSubmit(onSubmit)}>
        <FormGroup>
          <InputField
            autoFocus
            name="email"
            label="Email"
            placeholder="john@example.com"
            labelClassName="form-label"
            register={register}
            error={errors?.email}
          />
        </FormGroup>
        <ReCAPTCHA
          sitekey={captchaKey}
          onChange={() => setCaptchaDone(true)}
          onError={() => setCaptchaDone(false)}
          onExpired={() => setCaptchaDone(false)}
        />
        <Button.Ripple color="primary" className="mt-2" block type="submit" disabled={!captchaIsDone}>
          Send reset link
        </Button.Ripple>
      </Form>
      <p className="text-center mt-2">
        <Link to="/login">
          <ChevronLeft className="mr-25" size={14} />
          <span className="align-middle">Back to login</span>
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
            {renderForgotPassword()}
          </Col>
        </Col>
      </Row>
    </div>
  );
};

export default ForgotPassword;
