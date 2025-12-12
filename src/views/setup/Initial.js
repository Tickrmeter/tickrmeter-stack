import {CardTitle, Col, Row} from "reactstrap";
import featured_image from "@images/pages/setup/front-new.png";
import "@styles/base/pages/page-setup.scss";

const Initial = (props) => {
    const update = (e) => {
        props.update(e.target.name, e.target.value);
    };

    return (
      <Row className="setup-inner m-0">
        <Col className="left d-flex align-items-center setup-bg pl-lg-5 order-last order-md-first" lg="6" sm="12">
          <Col className="mx-auto pr-lg-0 pl-lg-5" sm="12" md="6" lg="12">
            <button className={"setup-btn"} type="button" onClick={props.nextStep}>
              SETUP GUIDE
            </button>
            <CardTitle tag="h1" className="setup-heading font-weight-bolder mb-1">
              Congratulations on your first TickrMeter!
            </CardTitle>
            <button className={"continue-btn"} type="button" onClick={props.nextStep}>
              GET STARTED
            </button>
          </Col>
        </Col>
        <Col className="right setup-bg d-flex pr-lg-5" lg="6" sm="12">
          <div className="text-center w-100 d-flex align-items-center justify-content-center pr-lg-8">
            {/*<Col sm="12">*/}
            <img className="img-fluid" src={featured_image} alt="Tickrmeter" />
            <div className="glow"></div>
            {/*</Col>*/}
          </div>
        </Col>
      </Row>
    );
};

export default Initial;
