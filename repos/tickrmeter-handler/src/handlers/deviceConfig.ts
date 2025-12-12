import { buildURL, cryptoAPIURL } from "../constants";
import currSymbols from "../currency.json";


import http from "../services/http";
import { DateTime } from "luxon";
import NativeDevices from "../models/device-native";

// ** STOCK APIs */
//#region Stock API

// const getStockPreviousClosing = async (symbol: string): Promise<number> => {
//   const url = buildURL(`v2/aggs/ticker/${symbol.toUpperCase()}/prev?unadjusted=true`);

//   const response: any = await http.getAPI(url, true);

//   if (response.status === "OK" && response?.resultsCount > 0) {
//     const previousPrice = response.results.find((f) => f.T === symbol);
//     if (previousPrice) {
//       return parseFloat(previousPrice.c.toString()) || 0;
//     }
//   }
// };

const calculatePercentage = (
  previousClosingOrPurchasePrice: number,
  currentQuote: number,
  gainTrackingEnabled: boolean
) => {
  const percent =
    previousClosingOrPurchasePrice === 0
      ? null
      : ((currentQuote - previousClosingOrPurchasePrice) / previousClosingOrPurchasePrice) * 100;

  if (gainTrackingEnabled) {
    return percent === null ? "" : percent > 0 ? `Profit +${percent.toFixed(2)}%` : `Loss ${percent.toFixed(2)}%`;
  } else {
    return percent === null ? "" : `1 day ${percent > 0 ? "+" : ""}${percent.toFixed(2)}%`;
  }
};

// export const getStockQuoteFromAPI = async (
//   symbol: string,
//   gainTracking: { enabled: boolean; purchasePrice: number | null },
//   timeZone: string,
//   currency: string = "USD",
//   stockName: string = null
// ) => {
//   const url = buildURL(`v2/last/trade/${symbol.toUpperCase()}?`);

//   const cSymbol = currSymbols[currency];

//   let response: any = await http.getAPI(url, true);

//   if (response.status !== "OK") {
//     return { success: false, error: response.error.error, status: response.status };
//   }

//   const { results } = response;

//   // const percent = ((response.c - response.pc) / response.pc) * 100;
//   // `1 day ${percent > 0 ? "+" : ""} ${percent.toFixed(2)}%`,

//   if (results) {
//     let percent = "";
//     if (gainTracking.enabled && gainTracking.purchasePrice !== null && !isNaN(gainTracking.purchasePrice)) {
//       percent = calculatePercentage(gainTracking.purchasePrice, results.p, gainTracking.enabled);
//     } else {
//       const previousClosing = await getStockPreviousClosing(symbol);
//       percent = calculatePercentage(previousClosing, results.p, gainTracking.enabled);
//     }
//     //const percent = previousClosing === 0 ? "" : ((results.p - previousClosing) / previousClosing) * 100;

//     const date = formatDate(results.y / 1000000000, timeZone);
//     const price = cSymbol.symbol + getFormattedNumber(parseFloat(results.p.toString())); // round(results.p.toString(), 2);
//     const quote = parseFloat(results.p.toString());

//     response = {
//       symbol,
//       price,
//       p: quote,
//       percent,
//       date,
//       name: stockName || undefined,
//     };

//     return { success: true, data: response };
//   }
// };

//#endregion

// ** CRYPTO APIs **
//#region "CRYPTO APIs"

// export const getCryptoQuoteFromAPI = async (
//   cryptoCurrency: string,
//   timeZone: string,
//   fiatCurrency: string = "USD",
//   gainTracking: { enabled: boolean; purchasePrice: number | null }
// ) => {
//   try {
//     const url = cryptoAPIURL(cryptoCurrency, fiatCurrency);

//     const queryAPIResponse: any = await http.getAPI(url);

//     const { last, status, error } = queryAPIResponse;

//     if (error) return { success: false, error };

//     if (status === "notfound") return { success: false, error: status };
//     if (status !== "success") return { success: false, error: status };

//     const { price, timestamp } = last;

//     if (price) {
//       //const percent = previousClosing === 0 ? "" : ((price - previousClosing) / previousClosing) * 100;

//       let percent = "";
//       if (gainTracking.enabled && gainTracking.purchasePrice !== null && !isNaN(gainTracking.purchasePrice)) {
//         percent = calculatePercentage(gainTracking.purchasePrice, price, gainTracking.enabled);
//       } else {
//         const previousClosing = await getCrptoPreviousClosing(cryptoCurrency, fiatCurrency);
//         percent = calculatePercentage(previousClosing, price, gainTracking.enabled);
//       }

//       const cSymbol = currSymbols[fiatCurrency];

//       const date = formatDate(timestamp / 1000, timeZone);
//       const quote = getFormattedNumber(price);

//       const response = {
//         symbol: cryptoCurrency,
//         price: cSymbol.symbol + quote,
//         p: quote,
//         percent,
//         date,
//         name: cryptoCurrency,
//       };

//       return { success: true, data: response };
//     }
//   } catch (error) {
//     throw error;
//   }
// };

// const getCrptoPreviousClosing = async (cryptoCurrency: string, fiatCurrency: string): Promise<number> => {
//   const url = buildURL(`v2/aggs/ticker/X:${cryptoCurrency.toUpperCase()}${fiatCurrency}/prev?adjusted=false`);

//   const response: any = await http.getAPI(url, true);
//   //console.log(response);
//   if (response.status === "OK" && response?.resultsCount > 0) {
//     const previousPrice = response.results.find((f) => f.T === `X:${cryptoCurrency.toUpperCase()}${fiatCurrency}`);
//     //console.log(previousPrice);

//     if (previousPrice) {
//       return parseFloat(previousPrice.c.toString()) || 0;
//     }
//   }
// };

//#endregion

const getFormattedNumber = (num: number) => num.toFixed(num > 9999 ? 0 : num > 999 ? 1 : 2);
const formatDate = (sec: number, tz: string) => DateTime.fromSeconds(sec, { zone: tz }).toFormat("hh:mma dd MMM yyyy");

export const onDeviceStatusRecieved = async (message: any) => {
  const { device: mac, battery, firmware_version } = message;

  let nativeDevice = new NativeDevices();
  nativeDevice.updateDeviceStatus(mac, { battery, firmware_version });
  nativeDevice = null;
  //DeviceModel.updateDeviceStatus(mac, { battery, firmware_version });
};
