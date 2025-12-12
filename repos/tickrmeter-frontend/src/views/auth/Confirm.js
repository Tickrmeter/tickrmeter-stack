import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import useJwt from "@src/auth/jwt/useJwt";

import { Row, Col, CardTitle, CardText } from "reactstrap";

import AuthLeft from "./AuthLeft";
import "@styles/base/pages/page-auth.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const ConfirmUser = () => {
  const { token } = useParams();


  const [serverMessage, setServerMessage] = useState(0);

  useEffect(() => {
    confirmUserToken();
  }, []);

  const confirmUserToken = async () => {
    //if (!token) history.replace("/login");

    const { message } = await useJwt.confirm({
      token, //: `${token}3`,
    });

    if (message === "USER_ACTIVATED") {
      setServerMessage(1);
      //setTimeout(()=> history.replace("/login"), 4000)
    } else {
      setServerMessage(-1);
    }
  };

  const showInvalidMessage = () => (
    <>
      <CardTitle tag="h2" className="font-weight-bold mb-1">
        Account not verified!
      </CardTitle>
      <CardText className="mb-2">
        <div className="pt-4 font-medium-5 line-height-condensed">
          <div className="d-flex align-items-center">
            Sorry, The email address verification link you&rsquo;ve been submitted is invalid, has expired or has
            already been used.
          </div>
        </div>
      </CardText>
    </>
  );

  const showWaitMsg = () => (
    <>
      <CardTitle tag="h2" className="font-weight-bold mb-1">
        Account verification!
      </CardTitle>
      <CardText className="mb-2">
        <div className="pt-4 font-medium-5 line-height-condensed">
          <div className="d-flex align-items-center">
            <FontAwesomeIcon icon={["fas", "spinner"]} size="2x" pulse />
            <div className="ml-1">Please wait, while we activate your account!</div>
          </div>
        </div>
      </CardText>
    </>
  );
  const showSuccessMsg = () => (
    <>
      <CardTitle tag="h2" className="font-weight-bold mb-1">
        Account Verified!
      </CardTitle>
      <CardText className="mb-2">
        <p className="pt-4 font-medium-5 line-height-condensed">
          <div className="d-flex align-items-center">
            Thank you!, Your account has been activiated, kindly click below to signin.
          </div>
        </p>
      </CardText>
    </>
  );

  return (
    <div className="auth-wrapper auth-v2">
      <Row className="auth-inner m-0">
        <AuthLeft />
        <Col className="d-flex align-items-center auth-bg px-2 p-lg-5" lg="4" sm="12">
          <Col className="px-xl-2 mx-auto" sm="8" md="6" lg="12">
            {serverMessage === 0 && showWaitMsg()}
            {serverMessage === -1 && showInvalidMessage()}
            {serverMessage === 1 && showSuccessMsg()}
            <div className="divider my-2">
              <div className="divider-text"></div>
            </div>
            <p className="font-medium-2 mt-2">
              <Link to="/login">
                <span>Click here to Signin</span>
              </Link>
            </p>
          </Col>
        </Col>
      </Row>
    </div>
  );
};

export default ConfirmUser;
