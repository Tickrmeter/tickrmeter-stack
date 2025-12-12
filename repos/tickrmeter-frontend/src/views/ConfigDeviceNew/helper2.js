//import { exchangeSymbolsList, stockMarkets } from "./helper";
import DKFlag from "@src/assets/images/flags/dk.svg";
import NOFlag from "@src/assets/images/flags/no.svg";
import SEFlag from "@src/assets/images/flags/se.svg";
import { getUserData } from "@src/utility/Utils";
import { intervalOptions } from "./helper";

export const SYMBOL_TYPES = Object.freeze({
  STOCK: 1,
  CRYPTO: 2,
  FOREX: 3,
  INDICES: 4,
  ETF: 5,
  COMMODITY: 6,
  //TOP10: 7,
  ELECTRICITY: 8,
  OPTIONS: 9,
  CUSTOMAPI: 10,
  MUSIC_CREATORS: 11,
  FXON: 12,
});

export const DATA_STREAMS = Object.freeze({
  POLYGON: "polygon",
  TRADINGVIEW: "tradingview",
  FINAGE: "finage",
  COINGECKO: "coingecko",
  COMMODITYAPI: "commodities-api",
  //LOCALTOP10: "local-top10",
  ELECTRICITY: "electricity",
  CUSTOMAPI: "custom-api",
  HUMBL3: "humbl3",
  FXON: "fxon",
});

export const DATA_MARKETS = Object.freeze({
  US_STOCKS: "us",
  UK_STOCKS: "uk",
  CA_STOCKS: "ca",
  HK_STOCKS: "hk",
  SE_STOCKS: "se",
  NO_STOCKS: "no",
  DK_STOCKS: "dk",
  FI_STOCKS: "fi",
  LV_STOCKS: "lv",
  EE_STOCKS: "ee",
  DE_STOCKS: "de",
  NL_STOCKS: "nl",
  FR_STOCKS: "fr",
  SW_STOCKS: "sw",
  JP_STOCKS: "jp",
  CZ_STOCKS: "cz",
  IL_STOCKS: "il",
  BE_STOCKS: "be",
  AU_STOCKS: "au",
  US_OPTIONS: "us-options",
  CRYPTO: "crypto",
  FOREX: "forex",
  INDICES: "indices",
  ETFS: "etf",
  COMMODITIES: "commodities",
  LOCALTOP10: "local-top10",
  DK_ELECTRICITY: "dk_electricity",
  SE_ELECTRICITY: "se_electricity",
  CUSTOMAPI: "custom-api",
  SECURITIES: "securities",
  EMPTY_STRING: "",
  HUMBL3_YOUTUBE: "youtube",
  HUMBL3_SPOTIFY: "spotify",
  FXON: "fxon",
});

export const STREAM_CONFIG = Object.freeze({
  [DATA_STREAMS.POLYGON]: {
    stocks: [DATA_MARKETS.US_STOCKS],
    crypto: [DATA_MARKETS.CRYPTO],
    options: [DATA_MARKETS.US_OPTIONS],
  },
  [DATA_STREAMS.FINAGE]: {
    stocks: [
      DATA_MARKETS.UK_STOCKS,
      DATA_MARKETS.CA_STOCKS,
      DATA_MARKETS.SE_STOCKS,
      DATA_MARKETS.NO_STOCKS,
      DATA_MARKETS.DK_STOCKS,
      DATA_MARKETS.FI_STOCKS,
      DATA_MARKETS.LV_STOCKS,
      DATA_MARKETS.EE_STOCKS,
      DATA_MARKETS.DE_STOCKS,
      DATA_MARKETS.NL_STOCKS,
      DATA_MARKETS.FR_STOCKS,
      DATA_MARKETS.SW_STOCKS,
      DATA_MARKETS.JP_STOCKS,
      DATA_MARKETS.CZ_STOCKS,
      DATA_MARKETS.IL_STOCKS,
      DATA_MARKETS.BE_STOCKS,
      DATA_MARKETS.AU_STOCKS,
    ],
    forex: [DATA_MARKETS.FOREX],
    indices: [DATA_MARKETS.INDICES],
    etf: [DATA_MARKETS.ETFS],
  },
  [DATA_STREAMS.COINGECKO]: {
    crypto: [DATA_MARKETS.CRYPTO],
  },
  [DATA_STREAMS.COMMODITYAPI]: {
    commodities: [DATA_MARKETS.COMMODITIES],
  },
  [DATA_STREAMS.LOCALTOP10]: {
    top10: [DATA_MARKETS.LOCALTOP10],
  },
  [DATA_STREAMS.ELECTRICITY]: {
    electricity: [DATA_MARKETS.DK_ELECTRICITY, DATA_MARKETS.SE_ELECTRICITY],
  },
  [DATA_STREAMS.HUMBL3]: {
    humbl3: [DATA_MARKETS.HUMBL3_YOUTUBE, DATA_MARKETS.HUMBL3_SPOTIFY],
  },
});

export const SYMBOL_TYPES_LIST = Object.freeze([
  {
    value: SYMBOL_TYPES.STOCK,
    title: "Global Markets",
    id: "stock-symbol",
    dataStreams: ["polygon", "tradingview"],
    mode: "text",
    isShowInPlaylist: true,
  },
  {
    value: SYMBOL_TYPES.CRYPTO,
    title: "Crypto",
    id: "stock-crypto",
    dataStreams: ["tradingview"],
    mode: "text",
    isShowInPlaylist: true,
  },
  {
    value: SYMBOL_TYPES.FOREX,
    title: "Forex",
    id: "stock-forex",
    dataStream: ["polygon"],
    mode: "text",
    isShowInPlaylist: true,
  },
  {
    value: SYMBOL_TYPES.INDICES,
    title: "US Indices",
    id: "stock-index",
    dataStreams: ["polygon"],
    mode: "text",
    isShowInPlaylist: true,
  },

  {
    value: SYMBOL_TYPES.COMMODITY,
    title: "Commodity",
    id: "stock-commodity",
    dataStreams: ["commodities"],
    mode: "text",
    isShowInPlaylist: true,
  },
  {
    value: SYMBOL_TYPES.OPTIONS,
    title: "Options",
    id: "stock-options",
    dataStreams: ["polygon"],
    meta: { tempTitle: "Options - Beta" },
    mode: "text",
    isShowInPlaylist: true,
  },
  {
    value: SYMBOL_TYPES.ELECTRICITY,
    title: "Electricity Prices",
    id: "electricity",
    dataStreams: ["electricity"],
    mode: "page",
    isShowInPlaylist: false,
  },
  {
    value: SYMBOL_TYPES.MUSIC_CREATORS,
    title: "Music & Creators - Beta",
    id: "music-creators",
    dataStreams: ["humbl3"],
    mode: "page",
    isShowInPlaylist: true,
  },
  {
    value: SYMBOL_TYPES.FXON,
    title: "FXON",
    id: "fxon",
    dataStreams: ["fxon"],
    mode: "text",
    isShowInPlaylist: true,
  },
]);

export const DisplayOptions = Object.freeze([
  { id: "global-markets", name: "Global Markets" },
  { id: "crypto", name: "Crypto" },
  { id: "indices", name: "US Indices" },
  { id: "commodities", name: "Commodities" },
  { id: "options", name: "Options-Beta" },
  { id: "electricity", name: "Electricity Prices" },
  { id: "music-creators", name: "Music & Creators - Beta" },
  { id: "fxon", name: "FXON" },
]);

export const getSearchLabel = (symbolType) => {
  const title = SYMBOL_TYPES_LIST.find((item) => item.value === symbolType)?.title || "";
  return `Search ${title} ${symbolType !== SYMBOL_TYPES.OPTIONS ? "symbol" : ""}`;
};

export const DEFAULT_MARKETS = Object.freeze({
  [SYMBOL_TYPES.STOCK]: DATA_MARKETS.EMPTY_STRING,
  [SYMBOL_TYPES.CRYPTO]: DATA_MARKETS.CRYPTO,
  [SYMBOL_TYPES.FOREX]: DATA_MARKETS.FOREX,
  [SYMBOL_TYPES.INDICES]: DATA_MARKETS.INDICES,
  [SYMBOL_TYPES.ETF]: DATA_MARKETS.ETFS,
  [SYMBOL_TYPES.COMMODITY]: DATA_MARKETS.COMMODITIES,
  [SYMBOL_TYPES.ELECTRICITY]: "",
  [SYMBOL_TYPES.OPTIONS]: DATA_MARKETS.US_OPTIONS,
  [SYMBOL_TYPES.FXON]: DATA_MARKETS.FXON,
});

export const DEFAULT_STREAMS = Object.freeze({
  [SYMBOL_TYPES.STOCK]: DATA_STREAMS.POLYGON,
  [SYMBOL_TYPES.CRYPTO]: DATA_STREAMS.COINGECKO,
  [SYMBOL_TYPES.FOREX]: DATA_STREAMS.POLYGON,
  [SYMBOL_TYPES.INDICES]: DATA_STREAMS.POLYGON,
  [SYMBOL_TYPES.ETF]: DATA_STREAMS.TRADINGVIEW,
  [SYMBOL_TYPES.COMMODITY]: DATA_STREAMS.COMMODITYAPI,
  //[SYMBOL_TYPES.TOP10]: DATA_STREAMS.LOCALTOP10,
  [SYMBOL_TYPES.ELECTRICITY]: DATA_STREAMS.ELECTRICITY,
  [SYMBOL_TYPES.OPTIONS]: DATA_STREAMS.POLYGON,
  [SYMBOL_TYPES.MUSIC_CREATORS]: DATA_STREAMS.HUMBL3,
  [SYMBOL_TYPES.FXON]: DATA_STREAMS.FXON,
});



export const renderExchangeSymbolsList = (dataMarket, className) => {
  const exchangeSymbolsList = {
    dk: "https://cdn.shopify.com/s/files/1/0549/5432/8246/files/Denmark_Stock_Exchange_Symbols_1.pdf?v=1677101867",
    se: "https://cdn.shopify.com/s/files/1/0549/5432/8246/files/Sweden_Stock_Exchange_Symbols.pdf?v=1677407835",
    commodities: "https://cdn.shopify.com/s/files/1/0549/5432/8246/files/Commodities_list.pdf?v=1692103251",
  };
  const listURL = exchangeSymbolsList[dataMarket];

  if (!listURL) return <></>;

  return (
    <div className={className}>
      <a href={exchangeSymbolsList[dataMarket]} target="_blank" rel="noopener noreferrer">
        Click here to view available symbols
      </a>
    </div>
  );
};

export const electricityCountries = [
  { _id: "dk", name: "Denmark", flag: DKFlag },
  { _id: "se", name: "Sweden", flag: SEFlag },
  { _id: "no", name: "Norway", flag: NOFlag },
];

export const ElectricityCountriesOptions = ({ data, ...props }) => (
  <div {...props}>
    {data.name}
    {data.flag && <img className="ml-1" src={data.flag} alt={data.name} width="20" height="20" />}
  </div>
);

export const electricityRegions = {
  dk: [
    { _id: "DK1", name: "DK1", country: "DK" },
    { _id: "DK2", name: "DK2", country: "DK" },
  ],
  se: [
    { _id: "SE1", name: "SE1 - Luleå", country: "SE" },
    { _id: "SE2", name: "SE2 - Sundsvall", country: "SE" },
    { _id: "SE3", name: "SE3 - Stockholm", country: "SE" },
    { _id: "SE4", name: "SE4 - Malmö", country: "SE" },
  ],
  no: [
    { _id: "NO1", name: "NO1 - Oslo", country: "NO" },
    { _id: "NO2", name: "NO2 - Kristiansand", country: "NO" },
    { _id: "NO3", name: "NO3 - Trondheim", country: "NO" },
    { _id: "NO4", name: "NO4 - Tromsø", country: "NO" },
    { _id: "NO5", name: "NO5 - Bergen", country: "NO" },
  ],
};

export const minStormAPIURL = "https://api.minstroem.app";

export const servicesConfig = Object.freeze({
  [DATA_STREAMS.TRADINGVIEW]: Object.freeze({
    ttl: 20, // TTL in seconds
    lastDayTtl: 1800, // Last day TTL in seconds (0.5 hour)
    defaultIntervalSecs: 300, // Default interval in seconds (5 minutes)
    normalModeSecs: 20, // Experimental mode interval in seconds (1 minute)
    normalModeSecs: 20, // Experimental mode interval in seconds (1 minute)
    experimentalModeSecs: 5, // Minimum allowed in seconds
  }),
  [DATA_STREAMS.POLYGON]: Object.freeze({
    ttl: 20, // TTL in seconds
    lastDayTtl: 1800, // Last day TTL in seconds (0.5 hour)
    defaultIntervalSecs: 300, // Default interval in seconds (5 minutes)
    normalModeSecs: 20, // Experimental mode interval in seconds (1 minute)
    normalModeSecs: 20, // Experimental mode interval in seconds (1 minute)
    experimentalModeSecs: 5, // Minimum allowed in seconds
  }),
  [DATA_STREAMS.FINAGE]: Object.freeze({
    ttl: 60, // TTL in seconds (1 minute)
    lastDayTtl: 1800, // Last day TTL in seconds (0.5 hour)
    defaultIntervalSecs: 300, // Default interval in seconds (5 minutes)
    normalModeSecs: 60, // Experimental mode interval in seconds (1 minute)
    experimentalModeSecs: 60, // Minimum allowed in seconds (1 minute)
  }),
  [DATA_STREAMS.COINGECKO]: Object.freeze({
    ttl: 600, // TTL in seconds (10 minutes)
    lastDayTtl: 1800, // Last day TTL in seconds (0.5 hour)
    defaultIntervalSecs: 300, // Default interval in seconds (5 minutes)
    normalModeSecs: 20, // Experimental mode interval in seconds (5 minutes)
    experimentalModeSecs: 5, // Minimum allowed in seconds (5 minutes)
    normalModeSecs: 20, // Experimental mode interval in seconds (5 minutes)
    experimentalModeSecs: 5, // Minimum allowed in seconds (5 minutes)
  }),
  [DATA_STREAMS.COMMODITYAPI]: Object.freeze({
    ttl: 3600, // TTL in seconds (1 hour)
    lastDayTtl: 10800, // Last day TTL in seconds (3 hours)
    defaultIntervalSecs: 900, // Default interval in seconds (15 minutes)
    normalModeSecs: 20, // Experimental mode interval in seconds (1 minute)
    experimentalModeSecs: 5, // Minimum allowed in seconds (1 minute)
    normalModeSecs: 20, // Experimental mode interval in seconds (1 minute)
    experimentalModeSecs: 5, // Minimum allowed in seconds (1 minute)
  }),
  [DATA_STREAMS.ELECTRICITY]: Object.freeze({
    ttl: 3600, // TTL in seconds (1 hour)
    // Since only TTL is provided for Electricity, the other properties are not included.
  }),
  [DATA_STREAMS.CUSTOMAPI]: Object.freeze({
    ttl: 600, // TTL in seconds (10 minutes)
    defaultIntervalSecs: 300, // Default interval in seconds (5 minutes)
    normalModeSecs: 300, // Experimental mode interval in seconds (5 minutes)
    experimentalModeSecs: 300, // Minimum allowed in seconds (5 minutes)
  }),
  [DATA_STREAMS.HUMBL3]: Object.freeze({
    ttl: 30, // TTL in seconds (10 minutes)
    defaultIntervalSecs: 60, // Default interval in seconds (5 minutes)
    normalModeSecs: 20, // Experimental mode interval in seconds (5 minutes)
    experimentalModeSecs: 5, // Minimum allowed in seconds (5 minutes)
  }),
  [DATA_STREAMS.FXON]: Object.freeze({
    ttl: 60, // TTL in seconds (1 minute)
    lastDayTtl: 1800, // Last day TTL in seconds (0.5 hour)
    defaultIntervalSecs: 300, // Default interval in seconds (5 minutes)
    normalModeSecs: 20, // Experimental mode interval in seconds (1 minute)
    experimentalModeSecs: 5, // Minimum allowed in seconds (1 minute)
  }),
});

export const symbolCurrencyOverRides = [{ market: DATA_MARKETS.CZ_STOCKS, symbol: "JTINB", currency: "EUR" }];

export const getIntervalOptions = (dataStream) => {
  const userData = getUserData(); // Assume getUserData() is defined elsewhere
  const serviceConfig = servicesConfig[dataStream];
  let secsThreshold;

  // Determine the threshold based on user settings and service configuration
  if (userData?.enableFastRefresh && serviceConfig?.experimentalModeSecs) {
    secsThreshold = serviceConfig.experimentalModeSecs;
  } else if (serviceConfig?.defaultIntervalSecs) {
    secsThreshold = serviceConfig.normalModeSecs;
  }

  // Directly compare option IDs to the secsThreshold, assuming option IDs are in seconds
  const filteredOptions = intervalOptions.filter((option) => parseInt(option._id) >= secsThreshold);

  return filteredOptions;
};

export const USEXCHANGES = ["NASDAQ", "NYSE", "OTC"];

export const humbl3BaseUrl = "https://api.gethumbl3.com/api";
export const featureMapping = {
  daily_track_streams_estimated: "daily-estimated-streams",
  daily_track_streams: "daily-streams",
  total_track_streams_estimated: "total-estimated-streams",
  total_track_streams: "total-streams",
  daily_artist_streams_estimated: "daily-estimated-streams",
  daily_artist_streams: "daily-streams",
  total_artist_followers: "total-followers",
  total_artist_views: "total-views",
  daily_artist_likes: "daily-likes",
  daily_track_count_estimated: "daily-estimated-count",
  daily_track_count: "daily-count",
  total_track_count_estimated: "total-estimated-count",
  total_track_count: "total-count",
  artist_monthly_listeners: "monthly-listeners",
};




//!Used in finage, not using anymore as finage is removed from the app
//symbol search is availble for us (polygon stream), uk, and ca (finage stream) stocks market , 
// crypto (only coingecko stream) ,indices (finage), etf (finage), commodities (commodities stream)
// export const ALLOWED_SEARCH = Object.freeze([
//   {
//     stream: DATA_STREAMS.POLYGON,
//     markets: [DATA_MARKETS.US_STOCKS],
//   },
//   {
//     stream: DATA_STREAMS.FINAGE,
//     markets: [
//       DATA_MARKETS.UK_STOCKS,
//       DATA_MARKETS.CA_STOCKS,
//       DATA_MARKETS.SE_STOCKS,
//       DATA_MARKETS.DK_STOCKS,
//       DATA_MARKETS.FOREX,
//       DATA_MARKETS.INDICES,
//       DATA_MARKETS.ETFS,
//     ],
//   },
//   {
//     stream: DATA_STREAMS.COINGECKO,
//     markets: [DATA_MARKETS.CRYPTO],
//   },
//   {
//     stream: DATA_STREAMS.COMMODITYAPI,
//     markets: [DATA_MARKETS.COMMODITIES],
//   },

//   // Add more allowed data streams and markets here
// ]);

//!Used in finage, not using anymore as finage is removed from the app
// export const isSymbolSearchAvailable = (dataStream, dataMarket) =>
//   ALLOWED_SEARCH.some((allowed) => allowed.stream === dataStream && allowed.markets.includes(dataMarket));