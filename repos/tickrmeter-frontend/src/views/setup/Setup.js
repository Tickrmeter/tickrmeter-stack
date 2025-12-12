import "@styles/base/pages/page-setup.scss";
import Initial from "@src/views/setup/Initial";
import StepWizard from "react-step-wizard";
import {useState} from "react";
import Second from "@src/views/setup/Second";
import Third from "@src/views/setup/Third";
import Fourth from "@src/views/setup/Fourth";
import Fifth from "@src/views/setup/Fifth";
import Sixth from "@src/views/setup/Sixth";
import {Col, Row} from "reactstrap";
import {Link} from "react-router-dom";
import tickrmeterLogo from "@images/logo/logo_uppercase.svg";

const Setup = () => {
    const [state, updateState] = useState({});

    // Do something on step change
    const onStepChange = (stats) => {
      //console.log(stats);
    };

    const setInstance = (SW) =>
      updateState({
        ...state,
        SW,
      });

    const { SW, demo } = state;
    const [stepWizard, setStepWizard] = useState(null);
    const [activeStep, setActiveStep] = useState(0);

    const assignStepWizard = (instance) => {
      setStepWizard(instance);
    };
    const handleStepChange = (e) => {
      //console.log("step change");
      //console.log(e);
      setActiveStep(e.activeStep - 1);
    };

    return (
        <div className="setup-wrapper setup-v2">
            <Row className={'setup-logo'}>
                <Col>
                    <Link className="brand-logo" to="/">
                        <img src={tickrmeterLogo} alt="Tickrmeter Logo"/>
                    </Link>
                </Col>
            </Row>
            <StepWizard
                onStepChange={handleStepChange}
                isHashEnabled
                transitions={state.transitions} // comment out for default transitions
                instance={setInstance}>
                <Initial hashKey={"FirstStep"}/>
                <Second hashKey={"PowerOn"}/>
                <Third hashKey={"Wifi"}/>
                <Fourth hashKey={"Connected"}/>
                <Fifth hashKey={"Digits"}/>
                <Sixth hashKey={"Account"}/>
            </StepWizard>
        </div>
    );
};

export default Setup;

