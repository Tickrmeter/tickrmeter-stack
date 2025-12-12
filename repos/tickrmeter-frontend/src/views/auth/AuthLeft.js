import { Link } from "react-router-dom";
import tickrmeterGif from "@images/pages/login/tickrMeter.gif";
import tickrmeterLogo from "@images/logo/logot_200x.png";
import { Col } from "reactstrap";

const AuthLeft = () => {
  return (
    <>
      <Link className="brand-logo" to="/">
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
      </Col>{" "}
    </>
  );
};

export default AuthLeft;
