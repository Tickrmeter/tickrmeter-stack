import { useEffect, useRef, useState } from "react";
import { FormGroup, Row, Col, Spinner, Label, InputGroup, Input, FormText, CustomInput } from "reactstrap";

import { API_PATHS, ApiEndPoint } from "@src/redux/api-paths";

import http from "@src/utility/http";
import { getUserData } from "@src/utility/Utils";
import electricityLogo from "@src/assets/images/min-strom-logo.svg";
import { SelectField } from "@src/utility/input-fields";

import { stockMarkets } from "../../helper";
import { electricityCountries, electricityRegions, minStormAPIURL } from "../../helper2";

import CountryRegions from "./CountryRegions";
import InfoMessage from "./InfoMessage";

const ElectricitySymbolConfig = ({
  symbolDetails,
  setSymbolDetails,
  onConfigChange,
  searchForSymbol,
  resetAlertQuoteAndPercentage,
  loadingState,
}) => {
  const [userAddresses, setUserAddresses] = useState([]);
  const { loading, setLoading } = loadingState;
  const [isAddressConnected, setIsAddressConnected] = useState(false);
  const [showInfoMsg, setShowInfoMsg] = useState(false);

  const popupRef = useRef(null);

  const onChange = ({ target }) => {
    const currency = stockMarkets.find((dm) => dm._id === target.value)?.currency;
    setSymbolDetails({ ...symbolDetails, searchSymbol: "", dataMarket: target.value, currency });
    resetAlertQuoteAndPercentage();
  };

  useEffect(() => {
    if (isAddressConnected) {
      getUserAddresses(symbolDetails.searchSymbol, true);
    }
  }, [isAddressConnected]);

  useEffect(() => {
    if (symbolDetails.exactPrice) {
      getUserAddresses(symbolDetails.searchSymbol);
    }
  }, [symbolDetails.exactPrice]);

  const getUserAddresses = async (region) => {
    try {
      setLoading(true);

      const { success, data } = await http.get(`${ApiEndPoint(API_PATHS.ELECTRICITY_USER_ADDRESSES)}`);

      if (!success || !data || data.length === 0) {
        onConfigChange({ name: "searchSymbol", value: region });
        setShowInfoMsg(true);
        return;
      }

      //console.log("Success true, Addresses found", message, type, data);

      const _d = data.map(({ id, address }) => ({ id, name: address }));

      setUserAddresses(_d || []);
      setSymbolDetails({ ...symbolDetails, searchSymbol: region, exactPrice: _d.length > 0 });

      // if (_d.length === 0) {
      //   setShowInfoMsg(true);
      // }

      setIsAddressConnected(false);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const regions = electricityRegions[symbolDetails.dataMarket] || [];

  function openPopup() {
    //host with port if any
    const protocol = window.location.protocol;
    const port = window.location.port ? `:${window.location.port}` : "";
    const host = `${protocol}//${window.location.hostname}${port}`;

    const returnURL = `${host}/return.html`;

    const thirdPartyURL = `${minStormAPIURL}/thirdParty/users/${
      getUserData()._id
    }/connectAddress?returnUrl=${returnURL}`;
    //const thirdPartyURL = `${host}/third-party?returnURL=${returnURL}`;

    popupRef.current = window.open(thirdPartyURL, "_blank", "width=1000,height=1000");
  }

  useEffect(() => {
    function handlePostMessage(event) {
      //console.log("event", event.origin);
      const whiteListedOrigins = [
        "http://tickr-ui.s3-website.us-east-2.amazonaws.com/",
        "https://minstroem.app",
        "https://tickrmeter.io",
      ];

      if (!whiteListedOrigins.includes(event.origin)) {
        return;
      }

      // Update state based on the message data.
      // Assume the message data contains a new value for someState.
      setIsAddressConnected(true);

      // Close the popup.
      if (popupRef.current) {
        popupRef.current.close();
      }
    }

    window.addEventListener("message", handlePostMessage);

    return () => {
      window.removeEventListener("message", handlePostMessage);
    };
  }, []);

  const onRegionSelect = async (region) => {
    if (symbolDetails.dataMarket === "dk") await getUserAddresses(region);
    else {
      setSymbolDetails({ ...symbolDetails, searchSymbol: region, exactPrice: false });

      searchForSymbol(region);
    }
  };

  const onSkip = () => {
    setSymbolDetails({ ...symbolDetails, exactPrice: false });
    searchForSymbol(null, null);
    setShowInfoMsg(false);
  };

  const onGetFullPrice = () => openPopup();
  const onChkConnection = () => getUserAddresses(symbolDetails.searchSymbol);

  const onAddressSelect = ({ target }) => {
    setSymbolDetails({
      ...symbolDetails,
      address: target.value,
      extras: {
        addressValue: userAddresses.find(({ id }) => id === target.value)?.name || undefined,
      },
    });
    searchForSymbol(null, null);
  };

  const onPriceTypeSelect = (type) => {
    onConfigChange({ name: "exactPrice", value: type === "full" });
    setSymbolDetails({
      ...symbolDetails,
      exactPrice: type === "full",
      address: null,
      extras: { ...symbolDetails.extras, addressValue: null },
    });
    resetAlertQuoteAndPercentage();
    if (type === "spot") searchForSymbol(null, null);
  };

  return (
    <>
      <Row className="justify-content-center">
        <Col xs="12" lg="8" className="text-center">
          <FormGroup>
            <FormText color="muted" className="mb-1">
              Electricity prices are <strong>Powered by </strong>
            </FormText>
            <img src={electricityLogo} alt="minstorm logo" width={180} />
          </FormGroup>
        </Col>
      </Row>
      <Row className="justify-content-center">
        <Col xs="12" lg="8" className="mt-1">
          <FormGroup>
            <SelectField
              name="dataMarket"
              label="Select your Country"
              labelClassName="symbol-label"
              placeholder={"Select your Country..."}
              options={electricityCountries}
              value={symbolDetails.dataMarket}
              onChange={onChange}
              formText={
                <FormText color="muted" className="mb-1 font-italic">
                  Support for more countries coming soon
                </FormText>
              }
            />
          </FormGroup>
        </Col>
      </Row>
      {symbolDetails.dataMarket && (
        <>
          <Row className="justify-content-center">
            <Col xs="12" lg="8" className="mt-1">
              {symbolDetails.dataMarket === "dk" ? (
                <></>
              ) : (
                <FormGroup>
                  <Label for="region">Select your Region</Label>
                  <InputGroup>
                    <Input
                      type="select"
                      name="region"
                      placeholder="Select your Region"
                      options={electricityRegions[symbolDetails.dataMarket] || []}
                      //onChange={({ target }) =>  onConfigChange({ name: "searchSymbol", value: target.value })}
                      onChange={({ target }) => onRegionSelect(target.value)}
                      value={symbolDetails.searchSymbol}
                    >
                      <option value="" disabled className="placeholder-option">
                        Select your Region...
                      </option>
                      {regions.map(({ _id, name }) => (
                        <option key={_id} value={_id}>
                          {name}
                        </option>
                      ))}
                    </Input>
                  </InputGroup>
                </FormGroup>
              )}
            </Col>
          </Row>
          <Row className="justify-content-center">
            <Col xs="12" lg="8" className="mt-1">
              <CountryRegions
                country={symbolDetails.dataMarket}
                onRegionSelect={onRegionSelect}
                selectedRegion={symbolDetails.searchSymbol}
              />
            </Col>
          </Row>
          {loading && (
            <Row className="justify-content-center">
              <Col xs="12" lg="8" className="mt-1">
                <Spinner type="grow" color="primary" />
              </Col>
            </Row>
          )}
          {symbolDetails.searchSymbol && symbolDetails.dataMarket === "dk" && (
            <>
              {userAddresses.length === 0 && (
                <Row className="justify-content-center">
                  <Col xs="12" lg="8" className="mt-1">
                    {showInfoMsg && (
                      <InfoMessage onSkip={onSkip} onGetFullPrice={onGetFullPrice} onChkConnection={onChkConnection} />
                    )}
                  </Col>
                </Row>
              )}
              {userAddresses.length > 0 && (
                <>
                  <Row className="justify-content-center">
                    <Col xs="12" lg="8" className="mt-1">
                      <Row className="justify-content-center">
                        {/* <Col xs="3" className="d-none d-md-block" style={{ backgroundColor: "yellow" }}></Col>*/}
                        <Col xs="12" className="d-flex justify-content-center">
                          <CustomInput
                            type="radio"
                            id={`rdPriceTypeFull}`}
                            name="priceType"
                            className="mt-1 mr-2"
                            label={"Full Price"}
                            onChange={() => onPriceTypeSelect("full")}
                            checked={symbolDetails.exactPrice}
                          />
                          {/* </Col>
                        <Col xs="3" sm="4" md="3"> */}
                          <CustomInput
                            type="radio"
                            id={`rdPriceTypeSpot}`}
                            name="priceType"
                            className="mt-1"
                            label={"Spot Price"}
                            checked={!symbolDetails.exactPrice}
                            onChange={() => onPriceTypeSelect("spot")}
                          />
                        </Col>
                        {/*  <Col xs="3" className="d-none d-md-block" style={{ backgroundColor: "yellow" }}></Col> */}
                      </Row>
                    </Col>
                  </Row>
                  {symbolDetails.exactPrice && (
                    <Row className="justify-content-center">
                      <Col xs="12" lg="8" className="mt-1">
                        <FormGroup>
                          <Label for="region">Select your Address</Label>
                          <InputGroup>
                            <Input
                              type="select"
                              name="address"
                              placeholder="Select your Addresses"
                              onChange={onAddressSelect}
                              value={symbolDetails.address || ""}
                            >
                              <option value="" disabled className="placeholder-option">
                                Select your Address...
                              </option>
                              {userAddresses.map(({ id, name }) => (
                                <option key={id} value={id}>
                                  {name}
                                </option>
                              ))}
                            </Input>
                          </InputGroup>
                        </FormGroup>
                      </Col>
                    </Row>
                  )}
                </>
              )}
            </>
          )}
        </>
      )}
    </>
  );
};

export default ElectricitySymbolConfig;
