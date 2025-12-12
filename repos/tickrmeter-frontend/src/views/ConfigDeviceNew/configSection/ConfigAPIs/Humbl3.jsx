import React, { useEffect, useState } from "react";
import { Col, Row } from "reactstrap";
import { SelectField } from "@src/utility/input-fields";

import http from "@src/utility/http";
import humbl3Logo from "@images/humbl3-logo.png";

import MarketSymbolFinder from "./MarketSymbolFinder";
import { useDeviceConfig } from "@device-config/contexts/DeviceConfigContext";
import { useDeviceConfigActions } from "@device-config/hooks/useDeviceConfigActions";
import { DateTime } from "luxon";
import { featureMapping, humbl3BaseUrl } from "@device-config/helper2";
import { useSymbolSearch } from "@device-config/hooks/useSymbolSearch";
import { ReactSelect } from "@src/utility/input-fields-select";

const Humbl3Config = ({ mode, playlistFuncs }) => {
  const [humbl3Data, setHumbl3Data] = useState({
    dataMarket: [],
    features: {},
  });
  const [features, setFeatures] = useState([]);
  const { state } = useDeviceConfig();
  const { symbolDetails } = state;
  const { setSymbolDetails, setServerError, setLoading, setStockQuote } = useDeviceConfigActions();

  const { searchForMusicCreator } = useSymbolSearch();

  useEffect(() => {
    getSetupDataFromHumbl3();
  }, []);

  const getSetupDataFromHumbl3 = async () => {
    try {
      const res = await http.get(`${humbl3BaseUrl}/v1/services`);
      setHumbl3Data(res);

      const dataMarket = [];
      const features = {};
      res.forEach((item) => {
        dataMarket.push({
          value: item.id,
          label: item.name,
          img: item.image,
        });
        features[item.id] = item.features.map((feature) => ({
          _id: feature.id,
          name: feature.name,
        }));
      });

      setHumbl3Data({
        dataMarket,
        features,
      });

      if (symbolDetails.dataMarket) setFeatures(features[symbolDetails.dataMarket]);
    } catch (error) {
      setServerError("Failed to fetch services, Please try again.");
    }
  };

  const onDataMarketChange = (e) => {
    const value = e.target.value;
    setSymbolDetails({
      ...symbolDetails,
      dataMarket: value,
      searchSymbol: "",
      extras: { ...symbolDetails.extras, feature: "", humbl3Id: "", musicCreatorURL: "" },
    });

    setStockQuote(null);
    setFeatures(humbl3Data.features[value]);
  };

  const handleSearch = async (query) => {
    try {
      const url = new URL(`${humbl3BaseUrl}/v1/audience/search/`);
      const feature = symbolDetails.extras?.feature;

      url.pathname += feature.includes("artist") ? "artists" : "tracks";
      url.searchParams.append("q", query);

      const res = await http.get(url);

      if (!res.success) return { success: false, data: [], error: "There is some error getting results" };

      return { success: true, data: res.items, error: null };
    } catch (error) {
      setServerError("There is an error fetching results, Please try again later");
      return { success: false, data: [], error: "There is some error getting results" };
    }
  };

  const onItemSelect = async (item, setQuery) => {
    try {
      setQuery(item.name);
      setLoading(true);

      const { id } = item;
      await searchForMusicCreator(id, null, null, mode, playlistFuncs);
    } catch (error) {
      setServerError("There is an error fetching results, Please try again later");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Row className="justify-content-center">
        <Col xs="12" lg="8" className="mt-1">
          <div className="d-flex flex-column justify-content-center align-items-center">
            <p>
              Data <b> Powered by </b>
            </p>
            <img src={humbl3Logo} alt="img" className="w-25 h-25" />
          </div>
        </Col>
      </Row>

      <Row className="justify-content-center">
        <Col xs="12" lg="8" className="mt-1">
          {/* <SelectField
            name="dataMarket"
            label="Select Service"
            onChange={onDataMarketChange}
            value={symbolDetails.dataMarket || ""}
            placeholder="Select your service ..."
            options={humbl3Data.dataMarket}
          /> */}
          <ReactSelect
            name="dataMarket"
            label="Select Service"
            onChange={onDataMarketChange}
            value={symbolDetails.dataMarket || ""}
            placeholder="Select your service ..."
            options={humbl3Data.dataMarket}
          />
        </Col>
      </Row>
      {symbolDetails.dataMarket && (
        <Row className="justify-content-center">
          <Col xs="12" lg="8" className="mt-1">
            <SelectField
              name="features"
              label="Select your Data point"
              onChange={({ target }) => {
                setSymbolDetails({
                  ...symbolDetails,
                  searchSymbol: "",
                  extras: { ...symbolDetails.extras, feature: target.value },
                });
                setStockQuote(null);
              }}
              value={symbolDetails.extras?.feature || ""}
              placeholder="Select your data point ..."
              options={features}
            />
          </Col>
        </Row>
      )}
      {symbolDetails.extras?.feature && (
        <MarketSymbolFinder
          mode={"single"}
          overridenFunctions={{ searchForSymbolOverride: handleSearch, onItemSelectOverride: onItemSelect }}
          overridenProperties={{ label: "Search Artists / Tracks", placeholder: "Search Artists / Tracks" }}
          overridenStyle={{ input: { textTransform: "none" } }}
        />
      )}
    </>
  );
};

export default Humbl3Config;
