import { DateTime } from "luxon";
import { ICoinsList } from "./interfaces";
import coinslist from "../../jsonFiles/coinslist.json";
import config from "../../../conf";
import { DATA_MARKETS } from "../../../constants";

//**========================================================= */

export const isMarketAllowedForTradingView = (market: string) => {
  const allowedMarketsForTradingView: string[] = [DATA_MARKETS.DK_STOCKS, DATA_MARKETS.SE_STOCKS];
  const isTradingViewEnabled = config?.app?.tradingViewEnabled ?? false;
  return isTradingViewEnabled && allowedMarketsForTradingView.includes(market);
};

export const marketExchangeMap = {
  "finage:dk": "OMXCOP",
  "finage:se": "OMXSTO",
};

//! Do not return as Number ... return as string
export const formatDecimal = (num: number): string =>
  num <= 0.9999 ? num.toFixed(4) : num <= 999 ? num.toFixed(2) : num <= 9999 ? num.toFixed(1) : num.toFixed(0);

export const rounderNumber = (num: number, noOfDecimals: number | undefined = undefined) =>
  noOfDecimals ? num.toFixed(noOfDecimals) : formatDecimal(num);

export const getFormattedNumber = (num: number, decimalChar: string = ".") =>
  rounderNumber(num).replace(".", decimalChar);

//! For Forex
export const formatDecimal2 = (num: number, noOfDecimals: number): string =>
  num <= 0.9999
    ? num.toFixed(4)
    : num <= 9
    ? num.toFixed(noOfDecimals ?? 2)
    : num <= 999
    ? num.toFixed(2)
    : num <= 9999
    ? num.toFixed(1)
    : num.toFixed(0);

export const rounderNumber2 = (num: number, noOfDecimals: number | undefined = undefined) =>
  formatDecimal2(num, noOfDecimals);

export const getFormattedNumber2 = (num: number, noOfDecimals: number, decimalChar: string = ".") =>
  rounderNumber2(num, noOfDecimals).replace(".", decimalChar);

export const formatDate = (sec: number, tz: string, timeFormat = "12h") => {
  console.log("formatDate called with sec:", sec, "and tz:", tz);

  // Handle seconds, milliseconds, microseconds, and nanoseconds
  let seconds = sec;

  // Nanoseconds (typically 19 digits): 1 nanosecond = 1e-9 seconds
  if (sec >= 1e18) {
    seconds = Math.floor(sec / 1e9);
  }
  // Microseconds (typically 16 digits): 1 microsecond = 1e-6 seconds
  else if (sec >= 1e15) {
    seconds = Math.floor(sec / 1e6);
  }
  // Milliseconds (typically 13 digits): 1 millisecond = 1e-3 seconds
  else if (sec >= 1e12) {
    seconds = Math.floor(sec / 1000);
  }
  // Otherwise, assume sec is already in seconds

  const _d = DateTime.fromSeconds(seconds, { zone: tz });
  const format = timeFormat === "12h" ? "hh:mma dd MMM yyyy" : "HH:mm dd MMM yyyy";
  //check if _d is valid then format it otherwise return current date time
  return _d.isValid ? _d.toFormat(format) : DateTime.local().setZone(tz).toFormat(format);
};

export const dataMarkets = [
  { _id: "us", name: "United States", currency: { symbol: "$", code: "USD" } },
  { _id: "uk", name: "United Kingdom", currency: { symbol: "£", code: "GBP" } },
  { _id: "ca", name: "Canada", currency: { symbol: "$", code: "CAD" } },
  { _id: "hk", name: "Hong Kong", currency: { symbol: "$", code: "HKD" } },
  { _id: "se", name: "Sweden", currency: { symbol: "SEK", code: "SEK" } },
  { _id: "no", name: "Norway", currency: { symbol: "NOK", code: "NOK" } },
  { _id: "dk", name: "Denmark", currency: { symbol: "DKK", code: "DKK" } },
  { _id: "fi", name: "Finland", currency: { symbol: "€", code: "EUR" } },
  { _id: "lv", name: "Latvia", currency: { symbol: "€", code: "EUR" } },
  { _id: "ee", name: "Estonia", currency: { symbol: "€", code: "EUR" } },
  { _id: "de", name: "Germany", currency: { symbol: "€", code: "EUR" } },
  { _id: "nl", name: "Netherlands", currency: { symbol: "€", code: "EUR" } },
  { _id: "fr", name: "France", currency: { symbol: "€", code: "EUR" } },
  { _id: "it", name: "Italy", currency: { symbol: "€", code: "EUR" } },
  { _id: "sw", name: "Switzerland", currency: { symbol: "CHF", code: "CHF" } },
  { _id: "au", name: "Australia", currency: { symbol: "$", code: "AUD" } },
  { _id: "jp", name: "Japan", stream: ["finage"], currency: { symbol: "¥", code: "JPY" } },
  { _id: "cz", name: "Czech Republic", stream: ["finage"], currency: { symbol: "CZK", code: "CZK" } },
  { _id: "il", name: "Israel", stream: ["finage"], currency: { symbol: "₪", code: "ILS" } },
];

export const currencyList = [
  { symbol: "$", code: "USD", decimal: "." },
  { symbol: "£", code: "GBP", decimal: "." },
  { symbol: "", code: "GBX", decimal: "." },
  { symbol: "$", code: "CAD", decimal: "." },
  { symbol: "$", code: "HKD", decimal: "." },
  { symbol: "SEK", code: "SEK", decimal: "," },
  { symbol: "NOK", code: "NOK", decimal: "," },
  { symbol: "DKK", code: "DKK", decimal: "," },
  { symbol: "€", code: "EUR", decimal: "." },
  { symbol: "CHF", code: "CHF", decimal: "." },
  { symbol: "$", code: "AUD", decimal: "." },
  { symbol: "¥", code: "JPY", decimal: "." },
  { symbol: "₪", code: "ILS", decimal: "." },
  { symbol: "CZK", code: "CZK", decimal: "," },
  { symbol: "", code: "-", decimal: "." },
];

export const coinsBySymbol = coinslist.reduce((acc, coin) => {
  acc[coin.symbol] = coin;
  return acc;
}, {} as Record<string, ICoinsList>);

export const coinsById = coinslist.reduce((acc, coin) => {
  acc[coin.id] = coin;
  return acc;
}, {} as Record<string, ICoinsList>);

export const emptyCurrencyObj = { symbol: " ", code: " ", decimal: "." };

export const ignoredCurrencySymbols = ["SEK", "NOK", "DKK", "CHF", "CZK"];

export const roundNumber = (num, decimalChar) => {
  const absNum = Math.abs(num);
  let formattedNum;

  if (absNum < 10) {
    formattedNum = absNum.toFixed(2);
  } else if (absNum < 100) {
    formattedNum = absNum.toFixed(1);
  } else {
    formattedNum = Math.floor(absNum).toString();
  }

  const result = parseFloat(num < 0 ? `-${formattedNum}` : formattedNum).toString();

  return result.replace(".", decimalChar);
};

export const formatNumberToMagnitude = (num, decimalChar) => {
  if (num >= 1.0e9) return `${roundNumber(num / 1.0e9, decimalChar)}B`;
  else if (num >= 1.0e6) return `${roundNumber(num / 1.0e6, decimalChar)}M`;
  else if (num >= 1.0e3) return `${roundNumber(num / 1.0e3, decimalChar)}K`;
  else return `${roundNumber(num, decimalChar)}`;
};
const format = "yyyy-MM-dd";
export const getFromToDatesAsPerAggregateTime = (aggregateTime, nowTime, tz) => {
  const currentTime = DateTime.fromFormat(nowTime, format, { zone: tz });
  let from = currentTime.minus({ days: 1 });
  let to = currentTime;

  if (aggregateTime === "1d") {
    from = currentTime.minus({ days: 1 });
    to = currentTime;
  }

  if (aggregateTime === "7d") {
    from = currentTime.minus({ days: 7 });
    to = currentTime.minus({ days: 6 });
  }

  if (aggregateTime === "14d") {
    from = currentTime.minus({ days: 14 });
    to = currentTime.minus({ days: 13 });
  }

  if (aggregateTime === "1m") {
    from = currentTime.minus({ days: 30 });
    to = currentTime.minus({ days: 29 });
  }

  if (from.weekday === 6) {
    from = from.minus({ days: 1 });
  }
  if (from.weekday === 7) {
    from = from.minus({ days: 2 });
  }

  return { from: from.toFormat(format), to: to.toFormat(format) };
};

export const electricityRegions = [
  { _id: "DK1", name: "DK1", country: "DK" },
  { _id: "DK2", name: "DK2", country: "DK" },

  { _id: "SE1", name: "SE1 - Luleå", country: "SE" },
  { _id: "SE2", name: "SE2 - Sundsvall", country: "SE" },
  { _id: "SE3", name: "SE3 - Stockholm", country: "SE" },
  { _id: "SE4", name: "SE4 - Malmö", country: "SE" },

  { _id: "NO1", name: "NO1 - Oslo", country: "NO" },
  { _id: "NO2", name: "NO2 - Kristiansand", country: "NO" },
  { _id: "NO3", name: "NO3 - Trondheim", country: "NO" },
  { _id: "NO4", name: "NO4 - Tromsø", country: "NO" },
  { _id: "NO5", name: "NO5 - Bergen", country: "NO" },
];

export const isValidURL = (url) => {
  const urlRegex = new RegExp(
    "^(https?://)" + // protocol (mandatory)
      "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // domain name
      "((\\d{1,3}\\.){3}\\d{1,3}))" + // OR ip (v4) address
      "(\\:\\d+)?(\\/[-a-z\\d%_.~+:]*)*" + // port and path (including colons)
      "(\\?[;&a-z\\d%_.~+=-]*)?" + // query string
      "(\\#[-a-z\\d_]*)?$",
    "i"
  );
  return urlRegex.test(url);
};





export const commaSepCurrencies = [
  // European
  "EUR",
  "DKK",
  "SEK",
  "NOK",
  "PLN",
  "CZK",
  "HUF",
  "RON",
  "ISK",
  "HRK",
  // South American
  "BRL",
  "ARS",
  "CLP",
  "COP",
  "UYU",
  "PYG",
  "VES",
  "BOB",
  // Asian
  "IDR",
  "VND",
  "KHR",
  "LAK",
  // North American
  "MXN",
  // African
  "ZAR",
  "AOA",
  "MZN",
  "STD",
  "GNF",
];
