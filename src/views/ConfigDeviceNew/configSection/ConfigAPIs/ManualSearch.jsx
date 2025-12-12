import { useEffect, useRef, useState } from "react";
// SearchSymbolNew.jsx
import { Col, ListGroupItem, Row } from "reactstrap";

import { useDeviceConfig } from "../../contexts/DeviceConfigContext";
import { useDeviceConfigActions } from "../../hooks/useDeviceConfigActions";

import { InputField, SelectField } from "@src/utility/input-fields";
import SearchButton from "../common/SearchButton";
import exchanges from "../exchanges";
import countries from "@src/assets/data/countries.json";
import { DATA_MARKETS, DATA_STREAMS, SYMBOL_TYPES } from "../../helper2";
import { SupportedCurrencySymbols } from "@device-config/helper";

const ManualSearch = ({ mode }) => {
  const { state } = useDeviceConfig();
  const { symbolDetails } = state;
  const { setSymbolDetails } = useDeviceConfigActions();

  const onExchangeSelect = (target) => {
    const dataMarket = target.cc === "USA" ? DATA_MARKETS.US_STOCKS : target._id;
    const dataStream = target.cc === "USA" ? DATA_STREAMS.POLYGON : DATA_STREAMS.TRADINGVIEW;
    const currency = target.currency || "-";

    setSymbolDetails({ ...symbolDetails, dataMarket, dataStream, currency });
  };

  //const getCurrencyVal = () => (manualCurrencyList.includes(symbolDetails.currency) ? symbolDetails.currency : "-");

  return (
    <Row className="justify-content-center">
      {[SYMBOL_TYPES.STOCK, SYMBOL_TYPES.INDICES].includes(symbolDetails.symbolType) && (
        <Col xs="12" lg="8" className="mt-1">
          <AutocompleteExchange
            name="exchange"
            label="Exchange"
            value={symbolDetails.dataMarket}
            onChange={onExchangeSelect}
            options={exchanges}
          />
        </Col>
      )}
      <Col xs="12" lg="8" className="mt-1">
        <InputField
          name="searchSymbol"
          label="Search Symbol"
          value={symbolDetails.searchSymbol}
          onChange={({ target }) => setSymbolDetails({ ...symbolDetails, searchSymbol: target.value.toUpperCase() })}
          style={{ textTransform: "uppercase" }}
        />
      </Col>

      <Col xs="12" lg="8" className="mt-1">
        <SelectField
          name="currency"
          label="Currency"
          value={symbolDetails.currency}
          onChange={({ target }) => setSymbolDetails({ ...symbolDetails, currency: target.value })}
          placeholder={"Select Currency if you want to override default"}
          options={[...SupportedCurrencySymbols, { _id: "other", name: "Other" }]}
        />
      </Col>

      <Col xs="12" lg="8" className="mt-1">
        {mode === "single" && <SearchButton />}
      </Col>
    </Row>
  );
};

export default ManualSearch;

const AutocompleteExchange = ({ options, value, onChange, label, name }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [filteredOptions, setFilteredOptions] = useState(options);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const selectedOption = options.find((opt) => opt._id === value);
    if (selectedOption) {
      setInputValue(`${selectedOption.name} (${selectedOption._id})`);
    } else {
      setInputValue(value);
    }
  }, [value, options]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
        if (inputValue === "") setFilteredOptions(options);
        // Reset to selected value if user clicks outside
        const selectedOption = options.find((opt) => opt._id === value);
        if (selectedOption) {
          setInputValue(`${selectedOption.name} (${selectedOption._id})`);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value, options]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    setIsOpen(true);

    const filtered = options.filter(
      (option) =>
        option.name.toLowerCase().includes(value.toLowerCase()) ||
        option._id.toLowerCase().includes(value.toLowerCase()) ||
        option.country.toLowerCase().includes(value.toLowerCase())
    );

    setFilteredOptions([...filtered, { name: value.toUpperCase(), _id: value.toUpperCase(), manual: true }]);
  };

  const handleSelect = (option) => {
    const displayValue = `${option.name} (${option._id})`;
    setInputValue(displayValue);
    setIsOpen(false);
    onChange(option);
  };

  return (
    <div ref={wrapperRef} className="position-relative">
      <label>{label}</label>
      <input
        type="text"
        className="form-control"
        value={inputValue}
        onChange={handleInputChange}
        onClick={() => setIsOpen(true)}
        style={{ textTransform: "uppercase" }}
      />
      {isOpen && (
        <div
          className="position-absolute w-100 mt-1 border rounded bg-white shadow-sm"
          style={{ maxHeight: "200px", overflowY: "auto", zIndex: 1000 }}
        >
          {filteredOptions.map((option, index) => (
            <ResultItem key={index} option={option} index={index} onClick={() => handleSelect(option)} />
          ))}
        </div>
      )}
    </div>
  );
};

const ResultItem = ({ option, index, onClick }) => {
  return (
    <ListGroupItem key={index} action className="symbol-search-new__item" onClick={onClick}>
      <Row className="d-flex align-items-center justify-content-between">
        <Col xs="12" sm="5" md="6">
          {option.name && <div>{option.name}</div>}
          {option._id && <div className="text-muted">{option._id}</div>}
        </Col>
        <Col xs="12" sm="4" className="d-flex justify-content-sm-end">
          {option.exchange && <div className="text-muted mr-1">{option.exchange}</div>}
          {option.cc && (
            <div className="text-muted" title={option.country}>
              {<LocaleFlag code={option.cc} />}
            </div>
          )}
        </Col>
      </Row>
    </ListGroupItem>
  );
};

const LocaleFlag = ({ code }) => {
  const [flag, setFlag] = useState();
  useEffect(() => {
    const loadSvg = async () => {
      const cc = countries.find((c) => c.code === code)?.code2.toLowerCase();
      if (!cc) return;
      const { default: response } = await import(`svg-country-flags/svg/${cc}.svg`);
      setFlag(response);
    };
    loadSvg();
  }, [code]);
  //return rounded flag image
  return <img src={flag} className="rounded-flag" />;
};
