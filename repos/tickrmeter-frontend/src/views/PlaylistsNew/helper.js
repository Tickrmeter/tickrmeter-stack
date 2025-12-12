import { SYMBOL_TYPES } from "@device-config/helper2";
import { UncontrolledTooltip } from "reactstrap";

//convert seconds to minutes and hours using moment
const formatSecsToMinHrs = (secs) =>
  [...cycleIntervalOptions, ...updateIntervalOptions].find((option) => option._id === secs)?.name || "N/A";

const getCycleMode = (mode) => cycleModeOptions.find((option) => option._id === mode)?.name || "Playlist Order";

export const mobileColums = [
  {
    id: "name",
    name: "Playlists",
    sortable: true,
    cell: (row) => {
      return (
        <div className="w-100 d-flex align-items-center ml-1">
          <div className="d-flex flex-column justify-content-center ">
            <div id={`playlistDetails-${row._id}`} className="cursor-pointer mb-quaterrem">
              {row.name}
            </div>
            <div className="font-weight-bold">{getSymbolCellData(row, true)}</div>
          </div>
          <UncontrolledTooltip placement="right" target={`playlistDetails-${row._id}`}>
            <div style={{ textAlign: "left", width: "200px" }}>
              <p>
                <strong>Cycle:</strong> {formatSecsToMinHrs(row.cycleInterval)}
                <br />
                <strong>Update:</strong> {formatSecsToMinHrs(row.updateInterval)}
                <br />
                <strong>Cycle Mode:</strong> {getCycleMode(row.cycleMode)}
              </p>
            </div>
          </UncontrolledTooltip>
        </div>
      );
    },
  },
];

export const columns = [
  {
    id: "name",
    name: "Name",
    selector: (row) => row.name,
    sortable: true,
    minWidth: "350px",
    cell: (row) => {
      return (
        <div
          className="d-flex justify-content-between"
          style={{ display: "flex", justifyContent: "space-between", width: "100%" }}
        >
          <div>{row.name}</div>
        </div>
      );
    },
  },
  {
    id: "cycleInterval",
    name: "Cycle",
    selector: (row) => row.cycleInterval,
    sortable: true,
    minWidth: "150px",
    cell: (row) => <> {formatSecsToMinHrs(row.cycleInterval)}</>,
  },
  {
    id: "updateInterval",
    name: "Update",
    selector: (row) => row.updateInterval,
    sortable: true,
    minWidth: "150px",
    cell: (row) => <> {formatSecsToMinHrs(row.updateInterval)}</>,
  },
  {
    id: "symbol",
    name: "Symbol",
    selector: (row) => row.symbols,
    sortable: true,
    maxWidth: "200px",
    cell: (row) => getSymbolCellData(row),
  },

  // ** Action cols are added in the component file as we need to customize the edit and delete actions
];

const getSymbolText = (symbolObj) => {
  if (symbolObj.symbolType === SYMBOL_TYPES.MUSIC_CREATORS) {
    
    return (
      <>
        {symbolObj?.extraConfig?.displayLabel}: <strong>{symbolObj.symbol}</strong>
      </>
    );
  }
  if (symbolObj.symbolType === SYMBOL_TYPES.STOCK) return <strong>{symbolObj.symbol}</strong>;

  return (
    <>
      <strong>{symbolObj.symbol}</strong>: {symbolObj.symbol}-{symbolObj.currency}
    </>
  );
};

const getSymbolCellData = (row, isMobile = false) => {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
      <div id={`playlist-${row._id}`} style={{ cursor: "pointer", color: "#0eb663" }}>
        {isMobile ? "View Symbols" : "Symbols"}
      </div>

      <UncontrolledTooltip placement="right" target={`playlist-${row._id}`}>
        <div style={{ textAlign: "left" }}>
          <p>
            <strong>Symbols:</strong>
          </p>

          {row.symbols.map((symbol) => (
            <div key={`${symbol.symbol}-${symbol.currency}`}>
              {getSymbolText(symbol)}
              {/* {symbol.symbolType === 1 ? (
                <>
                  <strong>{symbol.symbol}</strong>: {symbol.name}
                </>
              ) : (
                <>
                  <strong>{symbol.symbol}</strong>: {symbol.symbol}-{symbol.currency}
                </>
              )} */}
            </div>
          ))}
        </div>
      </UncontrolledTooltip>
    </div>
  );
};

export const ledBrightnessOptions = [
  { _id: "0", name: "OFF" },
  { _id: "50", name: "LOW" },
  { _id: "100", name: "HIGH", selected: true },
];
export const intervalOptions = [
  { _id: "1", name: "1 Second" },
  { _id: "2", name: "2 Seconds" },
  { _id: "3", name: "3 Seconds" },
  { _id: "4", name: "4 Seconds" },
  { _id: "5", name: "5 Seconds" },
  { _id: "10", name: "10 Seconds" },
  { _id: "30", name: "30 Seconds" },
  { _id: "60", name: "1 Min ", selected: true },
  { _id: "180", name: "3 Mins" },
  { _id: "300", name: "5 Mins" },
  { _id: "3660", name: "1 Hour" },
  { _id: "43200", name: "12 Hours" },
  { _id: "86400", name: "24 Hours" },
];

export const currencyOptions = [
  { _id: "USD", name: "USD" },
  { _id: "EUR", name: "EUR" },
  { _id: "GBP", name: "GBP" },
];

export const triggerTypeOptions = [
  { _id: "Greater than", name: "Greater than" },
  { _id: "Less than", name: "Less than" },
];

export const soundTypeOptions = [
  { _id: "Bell", name: "Bell" },
  { _id: "Beep", name: "Beep" },
];

export const defaultAlertConfig = {
  enabled: false,
  triggerType: "Greater than",
  triggerValue: "",
  flashLightbar: false,
  playSound: false,
  soundType: "bell",
  soundDur: "Once",
  changeLightBarColor: false,
  lightBarColor: "Blue",
};

export const lightBarColorOpts = [
  { _id: "Blue", name: "Blue" },
  { _id: "Green", name: "Green" },
  { _id: "Red", name: "Red" },
  { _id: "Yellow", name: "Yellow" },
  { _id: "Purple", name: "Purple" },
];

export const isValidFolatingNumber = (value) => /^[0-9]*(?:\.[0-9]*)?$/.test(value);

export const symbolDetailsDefault = {
  symbolType: 1,
  searchSymbol: "",
  currency: "USD",
  intervalTime: 60,
  gainTrackingEnabled: false,
  purchasePrice: "",
  ledBrightness: "100",
};

export const playlistDetailsDefaults = {
  name: "",
  cycleInterval: "120",
  cycleMode: "default",
  isCalculateOnDaily: false,
  updateInterval: "300",
  ledBrightness: "0",
  isActive: "",
  symbols: [],
};

export const playlistItemDefaults = {
  dataStream: "tradingview", //"polygon",
  dataMarket: "",
  symbolType: 1,
  searchSymbol: "",
  currency: "USD",
  interval: "300",
  gainTrackingEnabled: false,
  purchasePrice: "",
  noOfStocks: "",
  isShortSell: false,
  showFullAssetValue: false,
  ledBrightness: "0",
  multiplierEnabled: false,
  multiplier: 1,
  newAPI: false,
  commodityUnit: "perOunce",
  isMetalCommodity: false,
  aggregateTime: "1d",
};

export const cycleIntervalOptions = [
  { _id: "30", name: "30 Secs" },
  { _id: "60", name: "1 Min" },
  { _id: "120", name: "2 Mins", selected: true },
  { _id: "180", name: "3 Mins" },
  { _id: "300", name: "5 Mins" },
  { _id: "600", name: "10 Mins" },
  { _id: "900", name: "15 Mins" },
  { _id: "1200", name: "20 Mins" },
  { _id: "1500", name: "25 Mins" },
  { _id: "1800", name: "30 Mins" },
  { _id: "3600", name: "1 Hour" },
  { _id: "7200", name: "2 Hours" },
  { _id: "10800", name: "3 Hours" },
  { _id: "21600", name: "6 Hours" },
  { _id: "43200", name: "12 Hours" },
  { _id: "86400", name: "24 Hours" },
];

export const updateIntervalOptions = [
  { _id: "5", name: "5 Seconds" },
  { _id: "10", name: "10 Seconds" },
  { _id: "30", name: "30 Seconds" },
  { _id: "60", name: "1 Min" },
  { _id: "120", name: "2 Mins", selected: true },
  { _id: "180", name: "3 Mins" },
  { _id: "300", name: "5 Mins" },
  { _id: "600", name: "10 Mins" },
  { _id: "900", name: "15 Mins" },
  { _id: "1200", name: "20 Mins" },
  { _id: "1500", name: "25 Mins" },
  { _id: "1800", name: "30 Mins" },
];

export const cycleModeOptions = [
  { _id: "default", name: "Playlist Order" },
  { _id: "best", name: "Top Performers" },
  { _id: "worst", name: "Worst Performers" },
];

export const getDKAndSESymbolList = (dataMarket) => (
  <div className="">
    {dataMarket === "dk" && (
      <>
        (
        <a
          href="https://cdn.shopify.com/s/files/1/0549/5432/8246/files/Denmark_Stock_Exchange_Symbols_1.pdf?v=1677101867"
          target="_blank"
          rel="noopener noreferrer"
        >
          click here to view available symbols
        </a>
        )
      </>
    )}
    {dataMarket === "se" && (
      <>
        (
        <a
          href="https://cdn.shopify.com/s/files/1/0549/5432/8246/files/Sweden_Stock_Exchange_Symbols.pdf?v=1677407835"
          target="_blank"
          rel="noopener noreferrer"
        >
          click here to view available symbols
        </a>
        )
      </>
    )}
  </div>
);
