// components/SearchButton.jsx
import { FormGroup, Button, Spinner } from "reactstrap";
import { Search } from "react-feather";
import classNames from "classnames";
import { useDeviceConfig } from "../../contexts/DeviceConfigContext";
import { useSymbolSearch } from "../../hooks/useSymbolSearch";
import { DATA_STREAMS, SYMBOL_TYPES } from "../../helper2";

const SearchButton = ({ position }) => {
  const { state } = useDeviceConfig();
  const { symbolDetails, loading } = state;
  const { searchForSymbol } = useSymbolSearch();

  // const hideSearchButtonMap = {
  //   [DATA_STREAMS.POLYGON]: SYMBOL_TYPES.CRYPTO,
  //   [DATA_STREAMS.COINGECKO]: SYMBOL_TYPES.CRYPTO,
  //   [DATA_STREAMS.FINAGE]: SYMBOL_TYPES.FOREX,
  //   [DATA_STREAMS.COMMODITYAPI]: SYMBOL_TYPES.COMMODITY,
  // };

  // const shouldHideButton = hideSearchButtonMap[symbolDetails.dataStream] === symbolDetails.symbolType;

  const isDisabled = () => {
    if (loading) return true;
    if (!symbolDetails.searchSymbol) return true;
    if (symbolDetails.symbolType === SYMBOL_TYPES.FOREX && !symbolDetails.currency) return true;
    if (symbolDetails.symbolType === SYMBOL_TYPES.COMMODITY && !symbolDetails.currency) return true;
    return false;
  };

  const condtionalStyles = position === "right" ? { borderTopLeftRadius: "0px", borderBottomLeftRadius: "0px" } : {};

  //  if (shouldHideButton || !searchForSymbol) return null;

  return (
    <FormGroup className="d-flex mb-0">
      <Button.Ripple
        color="primary"
        type="submit"
        className={classNames("search-button", { loader: loading })}
        disabled={isDisabled()}
        onClick={() => searchForSymbol(null, null)}
        style={{ ...condtionalStyles }}
      >
        {!loading ? (
          <>
            <Search className="d-block d-sm-none" size={24} />
            <span className="d-none d-sm-block">Search</span>
          </>
        ) : (
          <Spinner type="grow" color="white" style={{ width: "2rem", height: "2rem" }} />
        )}
      </Button.Ripple>
    </FormGroup>
  );
};

export default SearchButton;
