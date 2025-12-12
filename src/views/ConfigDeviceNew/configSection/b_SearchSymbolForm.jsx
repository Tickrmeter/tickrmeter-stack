import { Col, Row } from "reactstrap";
import "react-slidedown/lib/slidedown.css";

import { DATA_STREAMS, SYMBOL_TYPES } from "../helper2.js";
import { useDeviceConfig } from "../contexts/DeviceConfigContext";
import { useDeviceConfigActions } from "../hooks/useDeviceConfigActions";

import ElectricitySymbolConfig from "./ElectricityConfig/index.jsx";
import CommodityAPIConfig from "./ConfigAPIs/CommodityAPI.jsx";

import ForexConfig from "./ConfigAPIs/forex.jsx";
import PolygonConfig from "./ConfigAPIs/Polygon.jsx";

import MarketSymbolFinder from "./ConfigAPIs/MarketSymbolFinder.jsx";
import { useSymbolSearch } from "../hooks/useSymbolSearch.js";
import ManualSearch from "./ConfigAPIs/ManualSearch.jsx";
import { CheckBoxField } from "@src/utility/input-fields.js";
import CoingeckoConfig from "./ConfigAPIs/Coingecko.jsx";
import Humbl3Config from "./ConfigAPIs/Humbl3.jsx";

const SearchSymbolForm = ({ resetAutoCompleteState, mode, playlistFuncs }) => {
  const { state } = useDeviceConfig();
  const { symbolDetails } = state;
  const { setSymbolDetails, setStockQuote, setStockQuotePercentage } = useDeviceConfigActions();

  const { searchForSymbol, resetAlertQuoteAndPercentage } = useSymbolSearch();

  const { resetAutoComplete, setResetAutoComplete } = resetAutoCompleteState;

  const { symbolType, dataStream, currency } = symbolDetails;

  const setSymbolForSearch = (symbol, isCurrency) => {
    //** isCurrency is used for the target currency in forex, if its true we are setting currency instead of symbol */

    if (!symbol?.symbol) return;

    const _searchSymbol = symbolDetails.dataStream === DATA_STREAMS.COINGECKO ? symbol.id : symbol.symbol;

    const _symbolDetails = {
      ...symbolDetails,
      searchSymbol: isCurrency ? symbolDetails.searchSymbol : _searchSymbol,
      currency: isCurrency ? _searchSymbol : symbol?.currency || symbolDetails.currency,
      isMetalCommodity: isCurrency ? symbolDetails.isMetalCommodity : symbol?.category === "Metals",
    };

    setSymbolDetails(_symbolDetails);

    //** if symbol type is forex and autosearch is currency, execute search with symbol/currency */
    if (symbolType === SYMBOL_TYPES.FOREX && isCurrency) {
      if (mode === "single") searchForSymbol(symbolDetails.searchSymbol, _searchSymbol);
      setResetAutoComplete(false);
      return;
    }

    //** if symbol type is commodity and autosearch is currency, execute search with symbol/currency */
    if (symbolType === SYMBOL_TYPES.COMMODITY && isCurrency) {
      const isMetalCommodity = symbolDetails.isMetalCommodity;
      if (mode === "single") searchForSymbol(symbolDetails.searchSymbol, _searchSymbol, { isMetalCommodity });
      setResetAutoComplete(false);
      return;
    }

    if (symbol.currency || symbolDetails.currency) {
      if (mode === "single") searchForSymbol(_searchSymbol, symbol.currency || symbolDetails.currency);
      setResetAutoComplete(false);
    }
  };

  return (
    <>
      {
        //** if symbol type is electricity, show Electricity Component */
        symbolType === SYMBOL_TYPES.ELECTRICITY ? (
          <>
            <ElectricitySymbolConfig />
          </>
        ) : symbolType === SYMBOL_TYPES.COMMODITY ? (
          <>
            <CommodityAPIConfig
              setSymbolForSearch={setSymbolForSearch}
              resetAutoComplete={resetAutoComplete}
              mode={mode}
            />
          </>
        ) : symbolType === SYMBOL_TYPES.OPTIONS ? (
          <>
            <PolygonConfig setSymbolForSearch={setSymbolForSearch} mode={mode} />
          </>
        ) : symbolType === SYMBOL_TYPES.FOREX ? (
          <>
            <ForexConfig setSymbolForSearch={setSymbolForSearch} resetAutoComplete={resetAutoComplete} />
          </>
        ) : symbolType === SYMBOL_TYPES.INDICES ? (
          <>
            <MarketSymbolFinder mode={mode} />
          </>
        ) : symbolType === SYMBOL_TYPES.CRYPTO ? (
          <>
            <CoingeckoConfig
              setSymbolForSearch={setSymbolForSearch}
              resetAutoComplete={resetAutoComplete}
              mode={mode}
            />
          </>
        ) : symbolType === SYMBOL_TYPES.MUSIC_CREATORS ? (
          <>
            <Humbl3Config mode={mode} playlistFuncs={playlistFuncs} />
          </>
        ) : symbolType === SYMBOL_TYPES.FXON ? (
          <>
            <MarketSymbolFinder mode={mode} />
          </>
        ) : (
          <>
            <Row className="justify-content-center">
              <Col xs="12" lg="8" className="mt-1 d-flex justify-content-end ">
                <CheckBoxField
                  className="mb-0"
                  name="manualSearch"
                  label="Manual Search"
                  onChange={(e) => {
                    setSymbolDetails({
                      ...symbolDetails,
                      extras: { ...symbolDetails.extras, manualSearch: e.target.checked, divideBy100: false },
                    });
                    setStockQuote(null);
                    setStockQuotePercentage(null);
                  }}
                  checked={symbolDetails?.extras?.manualSearch}
                />
              </Col>
            </Row>
            {symbolDetails?.extras?.manualSearch ? <ManualSearch mode={mode} /> : <MarketSymbolFinder mode={mode} />}
          </>
        )
      }
    </>
  );
};

export default SearchSymbolForm;
