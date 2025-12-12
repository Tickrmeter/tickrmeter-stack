import { CardText, CardTitle, Col, Row } from "reactstrap";
import featured_image from "@images/pages/setup/Account.webp";
import "@styles/base/pages/page-setup.scss";
import { Step, Stepper } from "react-form-stepper";
import { useCookies } from "react-cookie";

const Sixth = (props) => {
  const [cookies, setCookie] = useCookies(["setupGuide"]);
  const complete = (e) => {
    setCookie("setupGuide", "On", { path: "/" });
    window.location.href = "/register";
  };
  return (
    <Row className="setup-inner m-0">
      <Col className="left d-flex align-items-center setup-bg pl-lg-5 order-last order-md-first" lg="6" sm="12">
        <Col className="mx-auto pr-lg-0 pl-lg-5" sm="12" md="6" lg="12">
          <Stepper activeStep={4} hideConnectors={true}>
            <Step onClick={() => props.goToStep(2)} label="" index={0} />
            <Step onClick={() => props.goToStep(3)} label="" index={1} />
            <Step onClick={() => props.goToStep(4)} label="" index={2} />
            <Step onClick={() => props.goToStep(5)} label="" index={3} />
            <Step label="" index={4} children={"STEP 5"} />
          </Stepper>
          <CardTitle tag="h1" className="setup-heading font-weight-bolder mb-1">
            Create an account to add stocks
          </CardTitle>
          <CardText className="mb-2">
            Make sure to verify your account in the mail you receive after signing up.
          </CardText>
          <button className={"continue-btn"} type="button" onClick={complete}>
            CONTINUE
          </button>
        </Col>
      </Col>
      <Col className="right setup-bg d-flex pr-lg-5" lg="6" sm="12">
        <div className="text-center w-100 d-flex align-items-center justify-content-center pr-lg-8">
          {/*<Col sm="12">*/}
          <img className="img-fluid-6" src={featured_image} alt="Tickrmeter" />
          {/*</Col>*/}
        </div>
      </Col>
    </Row>
  );
};

export default Sixth;
