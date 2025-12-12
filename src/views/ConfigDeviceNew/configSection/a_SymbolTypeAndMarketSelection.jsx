/* eslint-disable nonblock-statement-body-position */
import { useEffect } from "react";
import { Col, Row } from "reactstrap";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import PopoverSetup from "@components/popover-setup";
import { DATA_STREAMS, DEFAULT_MARKETS, DEFAULT_STREAMS, SYMBOL_TYPES, SYMBOL_TYPES_LIST } from "../helper2";
import { SelectField } from "@src/utility/input-fields";
import { symbolDetailsDefault } from "../helper";
import { useDeviceConfig } from "../contexts/DeviceConfigContext";
import { useDeviceConfigActions } from "../hooks/useDeviceConfigActions";
import { useSymbolSearch } from "../hooks/useSymbolSearch";
import { getUserData } from "@src/auth/utils";

const SymbolTypeSelection = ({ resetFuncs, mode, isMusicCreatorPlaylist = null }) => {
  const { state } = useDeviceConfig();
  const { symbolDetails } = state;
  const { setSymbolDetails } = useDeviceConfigActions();

  const { resetAlertQuoteAndPercentage } = useSymbolSearch();

  const { setResetAutoComplete } = resetFuncs;

  const filteredSymbolTypes = () => {
    //get user company here
    const userDetails = getUserData();

    if (userDetails && userDetails.company && userDetails.company.toLowerCase() === "fxon") {
      return SYMBOL_TYPES_LIST.filter((st) => st.value === SYMBOL_TYPES.FXON);
    }

    if (mode === "single") return SYMBOL_TYPES_LIST;

    if (mode === "playlist" && isMusicCreatorPlaylist === null)
      return SYMBOL_TYPES_LIST.filter((st) => st.isShowInPlaylist);

    if (mode === "playlist" && isMusicCreatorPlaylist === true)
      return [SYMBOL_TYPES_LIST.find((st) => st.value === SYMBOL_TYPES.MUSIC_CREATORS)];
    if (mode === "playlist" && isMusicCreatorPlaylist === false)
      return SYMBOL_TYPES_LIST.filter((st) => st.isShowInPlaylist && st.value !== SYMBOL_TYPES.MUSIC_CREATORS);
  };

  useEffect(() => {
    if (mode === "playlist" && isMusicCreatorPlaylist) {
      setSymbolDetails({
        ...symbolDetails,
        symbolType: SYMBOL_TYPES.MUSIC_CREATORS,
        dataStream: DATA_STREAMS.MUSIC_CREATORS,
      });
    }
  }, [isMusicCreatorPlaylist]);

  const symbolTypes = filteredSymbolTypes().map((item) => ({
    _id: item?.value || "noone",
    name: item?.meta?.tempTitle ?? item?.title ?? "no-titke",
  }));

  const onSymbolTypeChange = (symbolType) => {
    const currency =
      symbolType === SYMBOL_TYPES.FOREX
        ? ""
        : symbolType === SYMBOL_TYPES.ELECTRICITY
        ? ""
        : symbolDetailsDefault.currency || "USD";

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
      extras: {
        aggregateTime: "1d",
        isMetalCommodity: false,
        manualSearch: false,
        showAmountChange: false,
        unit: "",
      },
    };

    setSymbolDetails(newSymbolDetails);

    setResetAutoComplete((prev) => true);

    //reset state to false after 300ms
    setTimeout(() => {
      setResetAutoComplete((prev) => false);
    }, 300);

    if (resetAlertQuoteAndPercentage) resetAlertQuoteAndPercentage();
  };

  //  console.log({ symbolDetails });

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
    </div>
  );
};

export default SymbolTypeSelection;
