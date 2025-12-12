import { Col, Row } from "reactstrap";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import PopoverSetup from "@components/popover-setup";
import { DATA_MARKETS, DEFAULT_MARKETS, DEFAULT_STREAMS, SYMBOL_TYPES, SYMBOL_TYPES_LIST } from "../helper2";
import { SelectField } from "@src/utility/input-fields";
import { cryptoDataMarkets, stockMarkets, symbolDetailsDefault } from "../helper";
import { useDeviceConfig } from "../contexts/DeviceConfigContext";
import { useDeviceConfigActions } from "../hooks/useDeviceConfigActions";

const SymbolTypeSelection = ({ resetFuncs, top10Opts, mode }) => {
  const { state } = useDeviceConfig();
  const { symbolDetails } = state;
  const { setSymbolDetails } = useDeviceConfigActions();

  const { showTop10, getTop10Options } = top10Opts;
  const { setResetAutoComplete, resetAlertQuoteAndPercentage } = resetFuncs;

  const isCrypto = symbolDetails.symbolType === SYMBOL_TYPES.CRYPTO;
  const isStock = symbolDetails.symbolType === SYMBOL_TYPES.STOCK;

  const filteredSymbolTypes =
    mode === "playlist" ? SYMBOL_TYPES_LIST.filter((st) => st.value !== SYMBOL_TYPES.ELECTRICITY) : SYMBOL_TYPES_LIST;

  const symbolTypes = filteredSymbolTypes.map((item) => ({
    _id: item.value,
    name: item?.meta?.tempTitle ?? item.title,
  }));

  const onSymbolTypeChange = (symbolType) => {
    const currency = [SYMBOL_TYPES.FOREX, SYMBOL_TYPES.COMMODITY].includes(symbolType)
      ? ""
      : symbolType === SYMBOL_TYPES.ELECTRICITY
      ? ""
      : symbolDetailsDefault.currency || "USD";

    if (symbolType === SYMBOL_TYPES.TOP10 && getTop10Options) {
      getTop10Options();
    }

    const newSymbolDetails = {
      ...symbolDetailsDefault,
      ...symbolDetails,
      symbolType,
      searchSymbol: "",
      dataMarket: DEFAULT_MARKETS[symbolType],
      currency,
      dataStream: DEFAULT_STREAMS[symbolType],
      gainTrackingEnabled: false,
      purchasePrice: "",
      aggregateTime: "1d",
    };

    setSymbolDetails(newSymbolDetails);

    setResetAutoComplete((prev) => true);

    //reset state to false after 300ms
    setTimeout(() => {
      setResetAutoComplete((prev) => false);
    }, 300);

    if (resetAlertQuoteAndPercentage) resetAlertQuoteAndPercentage();
  };

  const onDataMarketChange = ({ target }) => {
    const isCrypto = symbolDetails.symbolType === SYMBOL_TYPES.CRYPTO;
    const value = target.value;
    const dataStream = isCrypto ? value : value === "us" ? "polygon" : "finage";
    const dataMarket = isCrypto ? "crypto" : value;
    const currency = isCrypto ? symbolDetails.currency : stockMarkets.find((dm) => dm._id === target.value)?.currency;
    const interval = isCrypto && value === "coingecko" ? "300" : symbolDetails.interval;
    const commodityUnit = value === DATA_MARKETS.COMMODITIES ? "Ounce" : undefined;

    setSymbolDetails({
      ...symbolDetails,
      searchSymbol: "",
      dataStream,
      dataMarket,
      currency,
      interval,
      aggregateTime: "1d",
      commodityUnit,
    });
    setResetAutoComplete(true);
    if (resetAlertQuoteAndPercentage) resetAlertQuoteAndPercentage();
  };

  return (
    <div className={`${mode === "playlist" ? "" : "px-2"} pt-2`}>
      <Row className="justify-content-center">
        <Col md="12" lg="8" className="mt-1 symbol-type">
          <SelectField
            name="stock-crypto"
            label="Display"
            options={symbolTypes}
            onChange={(e) => onSymbolTypeChange(parseInt(e.target.value))}
            value={symbolDetails.symbolType}
          />

          <PopoverSetup
            placement="right"
            target="stock-crypto"
            triggeringCookie={"Popover3"}
            body={"Add your own portfolio whether it's stocks crypto."}
            title={"Stocks or crypto?"}
            confirmButtonTitle={"Next tip"}
            icon={<FontAwesomeIcon icon={faArrowRight} />}
            nextCookieValue={"Popover4"}
          />
        </Col>
      </Row>
      {(isStock || isCrypto) && (
        <Row className="justify-content-center">
          <Col xs="12" lg="8" className="mt-1">
            <SelectField
              name="dataMarket"
              label="Select Data Market"
              labelClassName="symbol-label"
              options={isCrypto ? cryptoDataMarkets : stockMarkets}
              value={isCrypto ? symbolDetails.dataStream : symbolDetails.dataMarket}
              onChange={onDataMarketChange}
            />
          </Col>
        </Row>
      )}
    </div>
  );
};

export default SymbolTypeSelection;
