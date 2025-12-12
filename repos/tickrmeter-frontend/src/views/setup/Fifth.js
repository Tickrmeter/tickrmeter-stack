import {CardText, CardTitle, Col, Row} from "reactstrap";
import featured_image from "@images/pages/setup/Firth.png";
import "@styles/base/pages/page-setup.scss";
import {Step, Stepper} from "react-form-stepper";
import {useEffect, useState} from "react";

const Fifth = (props) => {
    const update = (e) => {
        props.update(e.target.name, e.target.value);
    };

    return (
      <Row className="setup-inner m-0">
        <Col className="left d-flex align-items-center setup-bg pl-lg-5 order-last order-md-first" lg="6" sm="12">
          <Col className="mx-auto pr-lg-0 pl-lg-5" sm="12" md="6" lg="12">
            <Stepper activeStep={3} hideConnectors={true}>
              <Step onClick={() => props.goToStep(2)} index={0} />
              <Step onClick={() => props.goToStep(3)} label="" index={1} />
              <Step onClick={() => props.goToStep(4)} label="" index={2} />
              <Step label="" index={3} children={"STEP 4"} />
              <Step label="" index={4} />
            </Stepper>
            <CardTitle tag="h1" className="setup-heading font-weight-bolder mb-1">
              Do you see 5 digits on your TickrMeter?
            </CardTitle>
            <CardText className="mb-2">
              Then you’ve completed the setup of your TickrMeter and ready to continue. If not, make sure you’ve
              connected your phone to the TickrMeter WiFi in step 2.
            </CardText>
            <button className={"continue-btn"} type="button" onClick={props.nextStep}>
              CONTINUE
            </button>
          </Col>
        </Col>
        <Col className="right setup-bg d-flex pr-lg-5" lg="6" sm="12">
          <div className="text-center w-100 d-flex align-items-center justify-content-center pr-lg-8">
            {/*<Col sm="12">*/}
            <img className="img-fluid-5" src={featured_image} alt="Tickrmeter" />
            {/*</Col>*/}
          </div>
        </Col>
      </Row>
    );
};

export default Fifth;
