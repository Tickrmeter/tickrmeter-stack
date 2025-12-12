import { useEffect, useRef, useState } from "react";
import { FormGroup, Row, Col, Spinner, Label, InputGroup, Input, FormText, CustomInput } from "reactstrap";

import { API_PATHS, ApiEndPoint } from "@src/redux/api-paths";

import http from "@src/utility/http";
import { getUserData } from "@src/utility/Utils";
import electricityLogo from "@src/assets/images/min-strom-logo.svg";
import { AutocompleteField, SelectField } from "@src/utility/input-fields";

import { stockMarkets } from "../../helper";
import { electricityCountries, electricityRegions, minStormAPIURL } from "../../helper2";

import CountryRegions from "./CountryRegions";
import InfoMessage from "./InfoMessage";
import { useDeviceConfig } from "../../contexts/DeviceConfigContext";
import { useSymbolSearch } from "../../hooks/useSymbolSearch";
import { useDeviceConfigActions } from "../../hooks/useDeviceConfigActions";

const ElectricitySymbolConfig = () => {
  const { state } = useDeviceConfig();
  const { symbolDetails } = state;
  const { setSymbolDetails } = useDeviceConfigActions();

  const { searchForSymbol, resetAlertQuoteAndPercentage } = useSymbolSearch();

  const onChange = ({ target }) => {
    const currency = stockMarkets.find((dm) => dm._id === target.value)?.currency;
    setSymbolDetails({
      ...symbolDetails,
      searchSymbol: "",
      dataMarket: target.value,
      currency,
      exactPrice: false,
      extras: { ...symbolDetails.extras, addressValue: null, fullAddress: null },
    });
    resetAlertQuoteAndPercentage();
  };

  const regions = electricityRegions[symbolDetails.dataMarket] || [];

  const onRegionSelect = async (region) => {
    setSymbolDetails({ ...symbolDetails, searchSymbol: region, exactPrice: false });
    searchForSymbol(region);
  };

  const onPriceTypeSelect = (type) => {
    if (type === "full") {
      setSymbolDetails({
        ...symbolDetails,
        exactPrice: true,
        extras: { addressValue: null, addressRegion: symbolDetails.searchSymbol },
      });
    } else {
      setSymbolDetails({
        ...symbolDetails,
        exactPrice: false,
        extras: { addressValue: null, addressRegion: null },
        searchForSymbol: symbolDetails.searchForSymbol || symbolDetails.extras?.addressRegion,
      });
    }

    resetAlertQuoteAndPercentage();
    if (type === "spot") searchForSymbol(symbolDetails.extras?.addressRegion || symbolDetails.searchSymbol, null);
  };

  const onSearchClick = (address) => {
    if (address?.id) {
      setSymbolDetails({
        ...symbolDetails,
        searchSymbol: address.id,
        exactPrice: true,
        extras: { ...symbolDetails.extras, addressValue: address.suggestion, fullAddress: address },
      });
      searchForSymbol(address.id);
    }
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
          {symbolDetails.dataMarket === "dk" && (
            <Row className="justify-content-center">
              <Col xs="12" lg="8" className="mt-1">
                <Row className="justify-content-center">
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
                </Row>
              </Col>
            </Row>
          )}

          {symbolDetails.exactPrice ? (
            <>
              <Row className="justify-content-center">
                <Col xs="12" lg="8" className="mt-1">
                  <FormGroup>
                    <Label for="region">Search you address</Label>
                    <InputGroup>
                      <AutocompleteField
                        name="addressSearch"
                        onSearch={(searchTerm, setSearchResults) => handleSearch(searchTerm, setSearchResults)}
                        onSearchClick={onSearchClick}
                        displayKey={"suggestion"}
                        filterKey={"suggestion"}
                      />
                    </InputGroup>
                  </FormGroup>
                </Col>
              </Row>
            </>
          ) : (
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
                    selectedRegion={
                      symbolDetails.exactPrice ? symbolDetails.extras?.addressRegion : symbolDetails.searchSymbol
                    }
                    addressRegion={symbolDetails.extras?.addressRegion}
                  />
                </Col>
              </Row>
            </>
          )}
        </>
      )}

      {/* {symbolDetails.dataMarket && (
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
                selectedRegion={
                  symbolDetails.exactPrice ? symbolDetails.extras?.addressRegion : symbolDetails.searchSymbol
                }
                addressRegion={symbolDetails.extras?.addressRegion}
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
              <Row className="justify-content-center">
                <Col xs="12" lg="8" className="mt-1">
                  <Row className="justify-content-center">
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
                  </Row>
                </Col>
              </Row>

              {symbolDetails.exactPrice && (
                <Row className="justify-content-center">
                  <Col xs="12" lg="8" className="mt-1">
                    <FormGroup>
                      <Label for="region">Search you address</Label>
                      <InputGroup>
                        {" "}
                        <AutocompleteField
                          name="addressSearch"
                          onSearch={(searchTerm, setSearchResults) => handleSearch(searchTerm, setSearchResults)}
                          onSearchClick={onSearchClick}
                          displayKey={"suggestion"}
                          filterKey={"suggestion"}
                        />
                      </InputGroup>
                    </FormGroup>
                  </Col>
                </Row>
              )}
            </>
          )}
        </>
      )} */}
    </>
  );
};

export default ElectricitySymbolConfig;

const handleSearch = async (searchTerm, setSearchResults) => {
  try {
    if (searchTerm.length < 2) return setSearchResults([]);

    const url = `${ApiEndPoint(API_PATHS.ELEC_ADDRESS_SEARCH)}?q=${searchTerm}`;

    const response = await http.get(url);

    const data = response?.data || [];
    setSearchResults(data);
  } catch (error) {
    console.error(error);
  }
};
