import { Fragment } from "react";
import { CustomInput, FormGroup } from "reactstrap";
import NO from "@src/assets/images/NO.png";
import DK1 from "@src/assets/images/DK1.svg";
import DK2 from "@src/assets/images/DK2.svg";
import SE from "@src/assets/images/SE.png";

const Region = ({ region, onRegionSelect, selectedRegion }) => (
  <div className="d-flex w-100 justify-content-center align-items-end">
    {region === "DK" && (
      <>
        <div className="d-flex align-items-center flex-column">
          <img
            src={DK1}
            alt="DK-West"
            width={172}
            height={263}
            onClick={() => onRegionSelect("DK1")}
            className={`cursor-pointer ${selectedRegion === "DK1" && "selected-region"}`}
          />
          <CustomInput
            type="radio"
            id="rdDK1"
            name="regionSelect"
            className="mt-1"
            label="West"
            onChange={() => onRegionSelect("DK1")}
            checked={selectedRegion === "DK1"}
          />
        </div>
        <div className="d-flex align-items-center flex-column">
          <img
            src={DK2}
            alt="DK-East"
            width={98}
            height={222}
            onClick={() => onRegionSelect("DK2")}
            className={`cursor-pointer ${selectedRegion === "DK2" && "selected-region"}`}
          />
          <CustomInput
            type="radio"
            id="rdDK2"
            name="regionSelect"
            className="mt-1"
            label="East"
            onChange={() => onRegionSelect("DK2")}
            checked={selectedRegion === "DK2"}
          />
        </div>
      </>
    )}

    {region === "NO" && <img src={NO} alt="Norway" width={249} height={280} />}

    {region === "SE" && <img src={SE} alt="Sweden" width={141} height={279} />}
  </div>
);

const CountryRegions = ({ country, onRegionSelect, selectedRegion }) => {
  const renderRegion = () => {
    switch (country.toUpperCase()) {
      case "NO":
        return <Region region="NO" />;
      case "SE":
        return <Region region="SE" />;
      case "DK":
        return <Region region="DK" onRegionSelect={onRegionSelect} selectedRegion={selectedRegion} />;
      default:
        return null;
    }
  };

  return <>{country && renderRegion()}</>;
};

export default CountryRegions;
