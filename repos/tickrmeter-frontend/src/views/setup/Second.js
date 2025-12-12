import {CardText, CardTitle, Col, Row} from "reactstrap";
import featured_image from "@images/pages/setup/BackV2.png";
import "@styles/base/pages/page-setup.scss";
import {Step, Stepper} from "react-form-stepper";

const Second = (props) => {
    const update = (e) => {
        props.update(e.target.name, e.target.value);
    };

    return (
      <Row className="setup-inner m-0">
        <Col className="left d-flex align-items-center setup-bg pl-lg-5 order-last order-md-first" lg="6" sm="12">
          <Col className="mx-auto pr-lg-0 pl-lg-5" sm="12" md="6" lg="12">
            <Stepper activeStep={0} hideConnectors={true}>
              <Step label="" index={0} children={"STEP 1"} />
              <Step label="" index={1} />
              <Step label="" index={2} />
              <Step label="" index={3} />
              <Step label="" index={4} />
            </Stepper>
            <CardTitle tag="h1" className="setup-heading font-weight-bolder mb-1">
              Plug in your TickrMeter and turn it on
            </CardTitle>
            <CardText className="mb-2">
              When the white bar on the front glows and you see “WiFi Hotspot”, you can continue.
            </CardText>
            <button className={"continue-btn"} type="button" onClick={props.nextStep}>
              CONTINUE
            </button>
          </Col>
        </Col>
        <Col className="right setup-bg d-flex pr-lg-5" lg="6" sm="12">
          <div className="text-center w-100 d-flex align-items-center justify-content-center pr-lg-8">
            {/*<Col sm="12">*/}
            <img className="img-fluid-2" src={featured_image} alt="Tickrmeter" />
            {/*</Col>*/}
          </div>
        </Col>
      </Row>
    );
};

export default Second;
