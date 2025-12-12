import { Row, Col, FormText, CustomInput } from "reactstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import PopoverSetup from "@components/popover-setup";
import { useDeviceConfig } from "../contexts/DeviceConfigContext";
import { useDeviceConfigActions } from "../hooks/useDeviceConfigActions";

const ConfigType = () => {
  const { state } = useDeviceConfig();
  const { configType } = state;
  const { setConfigType } = useDeviceConfigActions();

  return (
    <div className="px-2 pt-2">
      <Row className="justify-content-center">
        <Col md="10" lg="8" className="mt-1">
          <Row className="justify-content-center">
            <Col md="12" lg="8" className="d-flex justify-content-center">
              <CustomInput
                type="radio"
                id={`single-rbtn`}
                name="configType"
                className="mt-1 mr-3"
                label="Single"
                onChange={() => setConfigType("single")}
                checked={configType === "single"}
              />

              <CustomInput
                type="radio"
                id={`playlist-rbtn`}
                name="configType"
                className="mt-1 mr-3"
                label="Playlist"
                onChange={() => setConfigType("playlist")}
                checked={configType === "playlist"}
              />

              {/* <CustomInput
                type="radio"
                id={`custom-api-rbtn`}
                name="configType"
                className="mt-1"
                label="Custom API"
                onChange={() => setConfigType("custom-api")}
                checked={configType === "custom-api"}
              /> */}
            </Col>
          </Row>
          <Row className="justify-content-center mt-1">
            <Col md="12" lg="10" className="d-flex justify-content-center">
              <FormText color="muted">Display a single asset or cycle between several?</FormText>
            </Col>
          </Row>
          <PopoverSetup
            placement="right"
            target="playlist-rbtn"
            triggeringCookie={"Popover2"}
            body={"You can view a Single stock or display multiple stocks on your TickrMeter."}
            title={"Single or multiple?"}
            confirmButtonTitle={"Next tip"}
            icon={<FontAwesomeIcon icon={faArrowRight} />}
            nextCookieValue={"Popover3"}
          ></PopoverSetup>
        </Col>
      </Row>
    </div>
  );
};

export default ConfigType;
