import config from "./conf";
import path from "path";
export const dateFormatString = "hh:mmA DD MMM YYYY";
export const API_BASE_URL = "https://api.polygon.io";
const API_KEY = config.app.polygon_apikey;

export const DEFAULT_TIMEZONE = "Europe/London";

export const FRONTEND_URL = config.app.frontEndURL;
export const BACKEND_URL = config.app.backEndURL;
export const CONFIRM_USER_URL = `${FRONTEND_URL}/confirm`;
export const RESET_PASS_URL = `${FRONTEND_URL}/reset-password`;
export const NOTFOUND_URL = `${FRONTEND_URL}/error`;

//export const backendURL = "http://3.141.141.38:2590";
export const otaFileBaseURL = `${BACKEND_URL}/api/ota`;

export const buildURL = (apiURL: string) => {
  return `${API_BASE_URL}/${apiURL}&apiKey=${API_KEY}`;
};

export const stockAPIURL = (search: string) =>
  `${API_BASE_URL}/v3/reference/tickers?ticker=${search.toUpperCase()}&active=true&sort=ticker&order=asc&limit=10&apiKey=${API_KEY}`;

export const cryptoAPIURL = (cryptoCurr: string, fiatCurr: string) =>
  `${API_BASE_URL}/v1/last/crypto/${cryptoCurr}/${fiatCurr}?&apiKey=${API_KEY}`;

export const tokenExpiryDuration = "1d";

const env = config.app.environment || "dev";
console.log("app env is", config.app.environment);

let pageDirectory = "/home/ubuntu/tickrmeter-backend/device-pages";
let fontDirectory = "/home/ubuntu/tickrmeter-backend/fonts";
let templateDirectory = "/home/ubuntu/tickrmeter-backend/svg-templates";

if (env === "dev") {
  const srcDir = path.join(__dirname, "..", "src");
  pageDirectory = path.join(srcDir, "..", "device-pages");
  fontDirectory = path.join(srcDir, "fonts");
  templateDirectory = path.join(srcDir, "svg-templates");
}

export const renderPaths = {
  pageDirectory,
  fontDirectory,
  templateDirectory,
};

console.log("renderPaths", renderPaths);

export enum MSG_TYPES {
  BOOT = "BOOT",
  DEVICE_REG = "DEVICE_REG", // when device is not in the system or not assigned to the user
  DEVICE_REG_FAILURE = "DEVICE_REG_FAILURE", // when there is an error while registering the device
  DEVICE_ASSIGNED = "DEVICE_ASSIGNED", // when device is registered/assigned to the user
  REG_SUCCESSFUL = "REG_SUCCESSFUL", // when user enter the registration code on the web
  INVALID_FORMAT = "INVALID_FORMAT", // when invalid format from device (no device and type in message)
  NO_DEVICE = "NO_DEVICE", // when there is no device found in the database
  NO_CONFIG = "NO_CONFIG", // No Config found against device
  STOCK_ERROR = "STOCK_ERROR", // Error from Stock (polygon) API
  DEVICE_UNASSGINED = "DEVICE_UNASSGINED", // When device is removed from the user account
  UPDATE = "UPDATE", // when stock update is requried
  NEW = "NEW", // when new stock is changed/added
  ALERT_ENABLE = "ENABLE",
  ALERT_DISABLE = "DISABLE",
}

export enum DATA_STREAM {
  POLYGON = "polygon",
  TRADINGVIEW = "tradingview",
  FINAGE = "finage",
  COINGECKO = "coingecko",
  COMMODITES = "commodities-api",
  LOCALTOP10 = "local-top10",
  ELECTRICITY = "electricity",
  CUSTOMAPI = "custom-api",
  HUMBL3 = "humbl3",
}

//not using .. will remove
/***
 * @deprecated
 */
export enum MARKET {
  US = "us",
  UK = "uk",
  CA = "ca",
  HK = "hk",
  SE = "se",
  NO = "no",
  DK = "dk",
  FI = "fi",
  LV = "lv",
  EE = "ee",
  DE = "de",
  NL = "nl",
  FR = "fr",
  SW = "sw",
  JP = "jp",
  CZ = "cz",
  IL = "il",
  BE = "be",
  AU = "au",
}

export enum SYMBOL_TYPE {
  "", // 0
  STOCK,
  CRYPTO,
  FOREX,
  INDICES,
  ETF,
  COMMODITY,
  TOP10,
  ELECTRICITY,
  OPTIONS,
  CUSTOMAPI,
  MUSIC_CREATORS,
}

export const SYMBOL_TYPE_OBJ: ISYMBOL_TYPE_OBJ[] = [
  { id: SYMBOL_TYPE.STOCK, name: "Stock", value: "stock", mode: "text" },
  { id: SYMBOL_TYPE.CRYPTO, name: "Crypto", value: "crypto", mode: "text" },
  { id: SYMBOL_TYPE.FOREX, name: "Forex", value: "forex", mode: "text" },
  { id: SYMBOL_TYPE.INDICES, name: "Indices", value: "indices", mode: "text" },
  { id: SYMBOL_TYPE.ETF, name: "ETF", value: "etf", mode: "text" },
  { id: SYMBOL_TYPE.COMMODITY, name: "Commodity", value: "commodity", mode: "text" },
  { id: SYMBOL_TYPE.TOP10, name: "Top 10", value: "local-top10", mode: "text" },
  { id: SYMBOL_TYPE.ELECTRICITY, name: "Electricity", value: "electricity", mode: "page" },
  { id: SYMBOL_TYPE.OPTIONS, name: "Options", value: "options", mode: "text" },
  { id: SYMBOL_TYPE.MUSIC_CREATORS, name: "Music & Creators", value: "music-creators", mode: "page" },
];

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
  COMMODITIES: "commodities-api",
  LOCALTOP10: "local-top10",
  DK_ELECTRICITY: "dk_electricity",
  SE_ELECTRICITY: "se_electricity",
  HUMBL3_YOUTUBE: "youtube",
  HUMBL3_SPOTIFY: "spotify",
});

interface ISYMBOL_TYPE_OBJ {
  id: SYMBOL_TYPE;
  name: string;
  value: string;
  mode: "text" | "page";
}

export const DATA_MARKETS_TZ = {
  us: "America/New_York",
  uk: "Europe/London",
  ca: "America/Toronto",
  hk: "Asia/Hong_Kong",
  se: "Europe/Stockholm",
  no: "Europe/Oslo",
  dk: "Europe/Copenhagen",
  fi: "Europe/Helsinki",
  lv: "Europe/Riga",
  ee: "Europe/Tallinn",
  de: "Europe/Berlin",
  nl: "Europe/Amsterdam",
  fr: "Europe/Paris",
  sw: "Europe/Zurich",
  jp: "Asia/Tokyo",
  cz: "Europe/Prague",
  il: "Asia/Jerusalem",
  be: "Europe/Brussels",
  au: "Australia/Sydney",
};

export const exchangeMarketMap = {
  OMXCOP: "finage:dk",
};

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

export const singleLineFeatureMapping = [
  "daily_artist_streams_estimated",
  "daily_artist_streams",
  "total_artist_followers",
  "total_artist_views",
  "daily_artist_likes",
  "artist_monthly_listeners",
];

export const featureMappingText = {
  track_streams: "Streams",
  track_streams_estimated: "Estimated Streams",
  artist_streams: "Artist Streams",
  artist_streams_estimated: "Estimated Streams",
};
