import { Button, FormGroup, Spinner } from "reactstrap";
import classNames from "classnames";

import http from "@src/utility/http";
import { API_PATHS, ApiEndPoint } from "@src/redux/api-paths";

import { useDeviceConfig } from "@device-config/contexts/DeviceConfigContext";
import { getFormattedNumber, stockMarkets } from "@device-config/helper";
import { useDeviceConfigActions } from "@device-config/hooks/useDeviceConfigActions";
import { symbolCurrencyOverRides, DATA_STREAMS, DATA_MARKETS, SYMBOL_TYPES } from "@device-config/helper2";
import { playlistItemDefaults } from "../helper";
import { useSymbolSearch } from "@device-config/hooks/useSymbolSearch";

const AddItemToPlaylist = ({ resetAutoCompleteState, playlistState, plErrorState }) => {
  const { playlist, setPlaylist } = playlistState;

  if (playlist.length > 14) return <></>;

  const { setResetAutoComplete } = resetAutoCompleteState;
  const { setPlaylistError } = plErrorState;

  const { state } = useDeviceConfig();
  const { symbolDetails: playlistItem, loading } = state;
  const { setSymbolDetails: setPlaylistItem, setLoading } = useDeviceConfigActions();

  const { fetchSymbolData } = useSymbolSearch();

  const addSymbolToPlaylist = async () => {
    // option.symbol, currency, {
    //   dataMarket,
    //   dataStream,
    //   symbolType: symbolDetails.symbolType,
    const {
      dataStream,
      dataMarket,
      searchSymbol,
      currency,
      symbolType,
      gainTrackingEnabled,
      purchasePrice,
      noOfStocks,
      showFullAssetValue,
      isShortSell,
      multiplier,
      multiplierEnabled,
      aggregateTime,
      commodityUnit,
      isMetalCommodity,
    } = playlistItem;

    const { success, data, message } = await fetchSymbolData(searchSymbol, currency, {
      dataMarket,
      dataStream,
      symbolType,
    });

    if (success) {
      const p = parseFloat(data.p);
      const priceWithMultiplier = p * multiplier;
      const pwm = multiplierEnabled ? `${data.currency}${getFormattedNumber(p * multiplier)}` : data.price;
     
      const symbolName = data?.name || data?.symbol;

      const playlistSymbol = {
        ...data,
        symbol: searchSymbol,
        name: symbolName,
        price: pwm,
        stream: dataStream,
        market: dataMarket,
        symbolType,
        gainTrackingEnabled,
        purchasePrice,
        noOfStocks,
        isShortSell,
        showFullAssetValue,
        currency,
        multiplierEnabled,
        multiplier,
        extraConfig: {
          aggregateTime: aggregateTime || "1d",
          commodityUnit: commodityUnit || "",
          isMetalCommodity: isMetalCommodity || false,
          divideBy100: dataMarket === DATA_MARKETS.UK_STOCKS ? playlistItem?.extras?.divideBy100 ?? true : undefined,
        },
      };

      setPlaylist([...playlist, playlistSymbol]);
      setPlaylistItem({ ...playlistItemDefaults, dataStream, dataMarket, symbolType });
      setPlaylistError(null);
      setResetAutoComplete(true);
    } else {
      setPlaylistError(message);
    }
    setLoading(false);
  };

  return (
    <FormGroup className="d-flex mb-0 justify-content-center">
      <Button.Ripple
        color="primary"
        type="submit"
        className={classNames("search-button", { loader: loading })}
        style={{ padding: "0.75rem 1.5rem" }}
        disabled={!playlistItem.searchSymbol}
        onClick={addSymbolToPlaylist}
      >
        {!loading ? (
          <>
            <span>Add</span>
          </>
        ) : (
          <Spinner type="grow" color="white" />
        )}
      </Button.Ripple>
    </FormGroup>
  );
};

export default AddItemToPlaylist;
