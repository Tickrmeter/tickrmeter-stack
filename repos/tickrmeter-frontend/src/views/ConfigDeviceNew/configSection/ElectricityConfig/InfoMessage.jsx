import logo2 from "@src/assets/images/eloverblik-logo.png";
import { useState } from "react";
import { Button, FormText } from "reactstrap";

const InfoMessage = ({ onSkip, onGetFullPrice, onChkConnection }) => {
  const [show, setShow] = useState(false);

  const onClick = () => {
    onGetFullPrice();
    setShow(true);
  };

  return (
    <div className="electricity-info-message">
      <div className="main">
        <div className="logo">
          <img src={logo2} alt="eloverblik-logo" />
        </div>
        <div className="heading1">Your full electricity price</div>
        <p>
          Electricity prices differ from household til household, so it is important to look at your{" "}
          <strong>full</strong> electricity price.
        </p>
        <p>To get access to your full electricity price</p>
        <ol>
          <li>
            Tap <strong> Get full price</strong> below
          </li>
          <li>
            Select <strong>Private</strong> in the popup
          </li>
          <li>
            Log in with <strong>MitID</strong>
          </li>
          <li>Grant access*</li>
        </ol>
        <div className="mt-2 d-flex flex-wrap">
          <Button color="primary" onClick={onClick}>
            Get full price
          </Button>
          <Button color="Link" onClick={onSkip}>
            Skip - only show spot prices
          </Button>
        </div>
      </div>
      {show && (
        <Button color="Link" onClick={onChkConnection}>
          Check Connection
        </Button>
      )}
      <FormText color="muted" className="muted-msg">
        *We will <strong>not</strong> access or store your consumption data or any other personal information. This is
        only used to get your households&rsquo; tariffs.
      </FormText>
    </div>
  );
};
export default InfoMessage;
