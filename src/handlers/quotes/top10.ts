// import Top10Model from "../../models/top10";
// import { publishData } from "../../mqtt";

// import { formatDate, getFormattedNumber, currencyList, ignoredCurrencySymbols } from "./helper";
// import { IPushQuote, IGetQuoteFromAPI, IGetQuote } from "./interfaces";
// import { DateTime } from "luxon";
// import { SYMBOL_TYPE } from "../../constants";
// import NativeTop10 from "../../models/top10";

// const getTop10QuoteFromDB: IGetQuoteFromAPI = async (params) => {
//   try {
//     const { symbol, timeZone } = params;

//     let nativeTop10 = new NativeTop10();

//     const { success, data } = await nativeTop10.getBySymbol(symbol);
//     if (!success) return { success: false, error: "Symbol not found!", data: null };

//     const { symbol: sym, name, price: pr, percent, date: dbDate, currency } = data;

//     const _currency = currencyList.find((c) => c.code === currency);
//     const _curr = ignoredCurrencySymbols.includes(_currency.symbol) ? "" : _currency.symbol;
//     const timestamp = DateTime.fromFormat(dbDate, "DD-MMM-YYYY").toMillis();
//     const date = formatDate(timestamp / 1000, timeZone);

//     const quote = parseFloat(pr.replaceAll("$", "").replaceAll(",", "").toString());

//     const price = _curr + getFormattedNumber(quote, _currency.decimal); // round(results.p.toString(), 2);

//     const response = {
//       symbol,
//       price,
//       p: quote,
//       percent,
//       date,
//       name: name || symbol || undefined,
//       currency: _currency.code,
//     };

//     nativeTop10 = null;
//     return { success: true, data: response };
//   } catch (error) {
//     console.error("Top10: Error in getTop10QuoteFromDB: ", error);
//     return { success: false, data: null };
//   }
// };

// export const PushLocalTop10Quote: IPushQuote = async (params) => {
//   const { success, data: quote } = await GetLocalTop10Quote(params);

//   const { macAddress, pushObject } = params.deviceData;

//   if (success) {
//     const dataForDevice = {
//       ...quote,
//       ...pushObject,
//       symbol: quote.symbol, //! Temporary fix for symbol length
//       currency: quote.currency,
//       gainTrackingEnabled: undefined,
//       purchasePrice: undefined,
//       stream: undefined,
//       market: undefined,
//     };

//     //console.log("d", dataForDevice);

//     publishData(macAddress, JSON.stringify(dataForDevice));
//     return true;
//   } else {
//     return false;
//   }
// };

// export const GetLocalTop10Quote: IGetQuote = async (params) => {
//   const { symbolType, market, symbol, timeZone, gainTracking, currency, multiplier } = params;

//   return symbolType === SYMBOL_TYPE.TOP10
//     ? await getTop10QuoteFromDB({ market, symbol, gainTracking, timeZone, currency, multiplier })
//     : { success: false, data: null, error: "Invalid symbol type" };
// };
