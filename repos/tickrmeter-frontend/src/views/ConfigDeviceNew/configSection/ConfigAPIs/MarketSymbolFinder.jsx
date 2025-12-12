// SearchSymbolNew.jsx
import React, { useState, useRef, useEffect } from "react";
import { Col, FormGroup, Input, Label, ListGroup, ListGroupItem, Row, Spinner } from "reactstrap";
import axios from "axios";
import useDebounce from "@ui-hooks/useDebounce";
import { API_PATHS, ApiEndPoint } from "@src/redux/api-paths";
import { DATA_MARKETS, DATA_STREAMS, SYMBOL_TYPES, SYMBOL_TYPES_LIST, USEXCHANGES } from "../../helper2";
import http from "@src/utility/http";
import { useDeviceConfig } from "../../contexts/DeviceConfigContext";
import { useDeviceConfigActions } from "../../hooks/useDeviceConfigActions";

import countries from "@src/assets/data/countries.json";
import { useSymbolSearch } from "../../hooks/useSymbolSearch";

const MarketSymbolFinder = ({ mode, overridenFunctions, overridenProperties, overridenStyle }) => {
  const { state } = useDeviceConfig();
  const { setSymbolDetails, setLoading } = useDeviceConfigActions();

  const { symbolDetails, loading } = state;
  const wrapperRef = useRef(null);
  const cancelTokenRef = useRef(null);

  const { searchForSymbolOverride, onItemSelectOverride } = overridenFunctions || {};

  const [query, setQuery] = useState(symbolDetails?.searchSymbol);
  const [options, setOptions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const { searchForSymbol } = useSymbolSearch();

  useEffect(() => {
    if (symbolDetails?.searchSymbol !== null) {
      setQuery(symbolDetails.searchSymbol);
    }
  }, [symbolDetails?.searchSymbol]);

  const fetchSymbolData = async (searchQuery) => {
    let { dataStream } = symbolDetails;

    const _type = SYMBOL_TYPES_LIST.find((s) => s.value === dataStream)?.title || 1;

    dataStream = [DATA_STREAMS.POLYGON, DATA_STREAMS.FINAGE, DATA_STREAMS.COINGECKO].includes(dataStream)
      ? DATA_STREAMS.TRADINGVIEW
      : dataStream;

    const isIndices = symbolDetails.symbolType === SYMBOL_TYPES.INDICES;
    const isCrypto = symbolDetails.symbolType === SYMBOL_TYPES.CRYPTO;
    const dataMarket = isIndices ? DATA_MARKETS.INDICES : isCrypto ? "crypto" : "global";
    dataStream = isIndices ? DATA_STREAMS.POLYGON : dataStream;

    const url = new URL(`${ApiEndPoint(API_PATHS.AUTO_COMPELETE_SEARCH)}/${dataStream}/${dataMarket}`);
    url.searchParams.append("q", searchQuery);
    url.searchParams.append("t", _type);

    const response = await http.getWithCancelToken(url, cancelTokenRef.current.token);
    return response;
  };

  const fetchSymbols = async (searchQuery) => {
    if (!searchQuery) {
      setOptions([]);
      return;
    }
    if (cancelTokenRef.current) {
      cancelTokenRef.current.cancel("New request made");
    }

    cancelTokenRef.current = axios.CancelToken.source();
    setLoading(true);

    try {
      const { success, data, error } = searchForSymbolOverride
        ? await searchForSymbolOverride(searchQuery)
        : await fetchSymbolData(searchQuery);

      if (!success) {
        console.error("Search error:", error);
        setOptions([]);
        return;
      }

      setOptions(data);
      setShowDropdown(true);
    } catch (error) {
      if (!axios.isCancel(error)) {
        console.error("Search error:", error);
        setOptions([]);
      }
    }
    setLoading(false);
  };

  const debouncedFetchSymbols = useDebounce(fetchSymbols, 300);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (cancelTokenRef.current) {
        cancelTokenRef.current.cancel("Component unmounted");
      }
    };
  }, []);

  const getSymbolConfiguration = (option) => {
    //console.log("getSymbolConfiguration", option);

    const isUSExchange = USEXCHANGES.includes(option.exchange);
    const isIndices = symbolDetails.symbolType === SYMBOL_TYPES.INDICES;
    const dataStream = isIndices
      ? DATA_STREAMS.POLYGON
      : isUSExchange
      ? DATA_STREAMS.POLYGON
      : symbolDetails.dataStream || DATA_STREAMS.TRADINGVIEW;

    const dataMarket = isIndices
      ? DATA_MARKETS.INDICES
      : isUSExchange
      ? DATA_MARKETS.US_STOCKS
      : option.exchange || symbolDetails.dataMarket;

    const currency = isIndices ? "USD" : option.currency || "USD";

    return {
      dataMarket,
      dataStream,
      currency,
    };
  };

  const onItemSelect = (option) => {
    if (onItemSelectOverride) {
      onItemSelectOverride(option, setQuery);

      setShowDropdown(false);
      return;
    }

    const { dataMarket, dataStream, currency } = getSymbolConfiguration(option);

    // const isUSExchange = USEXCHANGES.includes(option.exchange);
    // const isIndices = symbolDetails.symbolType === SYMBOL_TYPES.INDICES;
    // const dataStream = isIndices
    //   ? DATA_STREAMS.POLYGON
    //   : isUSExchange
    //   ? DATA_STREAMS.POLYGON
    //   : symbolDetails.dataStream || DATA_STREAMS.TRADINGVIEW;

    // const dataMarket = isIndices ? DATA_MARKETS.INDICES : isUSExchange ? DATA_MARKETS.US_STOCKS : option.exchange;

    // const currency = isIndices ? "USD" : option.currency;

    const _symbolDetails = {
      ...symbolDetails,
      searchSymbol: option.symbol,
      dataMarket,
      dataStream,
      currency,
      extras: {
        ...symbolDetails.extras,
        divideBy100: false,
      },
    };

    setSymbolDetails(_symbolDetails);

    setQuery(option.symbol);

    if (mode === "single") {
      searchForSymbol(option.symbol, currency, {
        dataMarket,
        dataStream,
        symbolType: symbolDetails.symbolType,
        _symbolDetails,
      });
    }

    setShowDropdown(false);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);

    // Clear options and dropdown if input is empty
    if (!value.trim()) {
      setOptions([]);
      setShowDropdown(false);
      return;
    }

    // Only search on non-backspace input
    if (e.nativeEvent.inputType !== "deleteContentBackward") {
      debouncedFetchSymbols(value);
      setShowDropdown(true);
    }
  };

  return (
    <Row className="justify-content-center">
      <Col xs="12" lg="8" className="mt-1">
        <FormGroup>
          <div className="symbol-label">
            <Label for={"symbolSearch"}>{overridenProperties?.label || "Search Symbol"}</Label>
          </div>
          <div ref={wrapperRef} className="position-relative">
            <Input
              type="text"
              value={query}
              onChange={handleInputChange}
              placeholder={overridenProperties?.placeholder || "Search Symbols"}
              style={overridenStyle?.input || { textTransform: "uppercase" }}
            />

            {loading && (
              <div className="symbol-search-new__loading">
                <Spinner size="sm" color="primary" />
              </div>
            )}

            {showDropdown && (
              <ListGroup className="symbol-search-new__dropdown">
                {options.length > 0 ? (
                  options.map((option, index) => (
                    <ResultItem key={index} option={option} index={index} onClick={() => onItemSelect(option)} />
                  ))
                ) : (
                  <ListGroupItem className="text-center text-muted">No symbols found</ListGroupItem>
                )}
              </ListGroup>
            )}
          </div>
        </FormGroup>
      </Col>
    </Row>
  );
};

export default MarketSymbolFinder;
const ResultItem = ({ option, index, onClick }) => {
  return (
    <ListGroupItem key={index} action className="symbol-search-new__item" onClick={onClick}>
      <Row className="d-flex align-items-center justify-content-between">
        <Col xs="12" sm="8" md="8">
          <span className="font-weight-bold">{option.symbol}</span>
          {option.instrument_name && <div>{option.instrument_name}</div>}
          {option.name && <div>{option.name}</div>}
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
      const cc = countries.find((c) => c.name === code)?.code2.toLowerCase();
      if (!code) return;
      const { default: response } = await import(`svg-country-flags/svg/${code}.svg`);
      setFlag(response);
    };
    loadSvg();
  }, [code]);
  //return rounded flag image
  return <img src={flag} className="rounded-flag" />;
};
