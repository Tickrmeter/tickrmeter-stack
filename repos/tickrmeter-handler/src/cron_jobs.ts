import cron from "node-cron";
import { dataMarkets } from "./handlers/quotes/helper";
import nativeClient from "./models/native-client";
import conf from "./conf";
import http from "./services/http";
import { time } from "console";
import config from "./conf";


const registerCronJobs = () => {
  console.log("Registering cron jobs...");

  // Register cron jobs here

  // Scheduling the task at 4:01 PM EST/EDT, one minute after these exchanges close
  // Both NYSE, NASDAQ, and TSX share the Eastern Time Zone
  cron.schedule("40 16 * * 1-5", () => fetchClosingQuotes(["us", "ca"]), {
    scheduled: true,
    timezone: "America/New_York",
  });

  // Schedule the task to run at 4:30 PM GMT for UK market
  cron.schedule("35 16 * * 1-5", () => fetchClosingQuotes(["uk"]), { scheduled: true, timezone: "Europe/London" });

  // Scheduling the task at 5:31 PM CET/CEST
  cron.schedule("31 17 * * 1-5", () => fetchClosingQuotes(["de", "nl", "fr", "it", "sw"]), {
    scheduled: true,
    timezone: "Europe/Berlin", // Central European Time Zone
  });

  cron.schedule("45 17 * * 1-5", () => fetchClosingQuotes(["se"]), { scheduled: true, timezone: "Europe/Stockholm" });
  cron.schedule("40 16 * * 1-5", () => fetchClosingQuotes(["no"]), { scheduled: true, timezone: "Europe/Oslo" });
  cron.schedule("15 17 * * 1-5", () => fetchClosingQuotes(["dk"]), { scheduled: true, timezone: "Europe/Copenhagen" });
  cron.schedule("45 18 * * 1-5", () => fetchClosingQuotes(["fi"]), { scheduled: true, timezone: "Europe/Helsinki" });
  cron.schedule("15 16 * * 1-5", () => fetchClosingQuotes(["ee", "lv"]), {
    scheduled: true,
    timezone: "Europe/Tallinn",
  });

  cron.schedule("12 16 * * 1-5", () => fetchClosingQuotes(["hk"]), { scheduled: true, timezone: "Asia/Hong_Kong" });
  cron.schedule("20 15 * * 1-5", () => fetchClosingQuotes(["jp"]), { scheduled: true, timezone: "Asia/Tokyo" });
  cron.schedule("45 16 * * 1-5", () => fetchClosingQuotes(["il"]), { scheduled: true, timezone: "Asia/Jerusalem" });
  cron.schedule("33 16 * * 1-5", () => fetchClosingQuotes(["au"]), { scheduled: true, timezone: "Australia/Sydney" });
};

const getCollection = (collection) => nativeClient.db().collection(collection);

export const fetchClosingQuotes = async (exchanges: string[]) => {
  console.log("Fetching closing quotes for exchanges: ", exchanges, new Date());

  // Logic to fetch and save closing quotes for these exchanges
  exchanges.forEach(async (exchange) => {
    //get all symbols for the exchange from quoteCollector collection
    const symbols = await getCollection("quotecollectors").find({ market: exchange }).toArray();

    //get prices for last qutoes for each symbol
    symbols.forEach(async (symbol) => {
      let quote;
      if (symbol.stream === "polygon") {
        //quote = await getQuoteFromPolygon(symbol.symbol);
        return;
      } else if (symbol.stream === "finage") {
        quote = await getQuoteFromFinage(symbol.symbol, symbol.market);
      }
      //save to closingQuotes collection

      const findQuery = { symbol: symbol.symbol, market: symbol.market, currency: symbol.currency };

      const yesterdayQuote = (await getCollection("closingquotes").findOne(findQuery))?.quote || -1;

      const dataToInserted = {
        stream: symbol.stream,
        market: symbol.market,
        symbol: symbol.symbol,
        currency: symbol.currency,
        quote: quote.quote,
        yesterdayQuote: yesterdayQuote,
        timestamp: Math.round(quote.timestamp),
        date: new Date(),
      };

      getCollection("closingquotes").updateOne(findQuery, { $set: { ...dataToInserted } }, { upsert: true });
    });

    const dataMarket = dataMarkets.find((m) => m._id === exchange);
    const etfQuery = { market: "etf", "meta.country": dataMarket.name };
    console.log("etfQuery", etfQuery);
    const etfs = await getCollection("quotecollectors").find(etfQuery).toArray();

    etfs.forEach(async (symbol) => {
      const quote = await getQuoteForETFs(symbol.symbol);

      const dataToInserted = {
        stream: symbol.stream,
        market: symbol.market,
        symbol: symbol.symbol,
        currency: symbol.currency,
        quote: quote.quote,
        timestamp: Math.round(quote.timestamp),
        country: symbol.meta.country,
        currency2: symbol.meta.currency,
        date: new Date(),
      };
      getCollection("closingquotes").updateOne(
        { symbol: symbol.symbol, market: symbol.market, currency: symbol.currency },
        { $set: { ...dataToInserted } },
        { upsert: true }
      );
    });

    const indexQueries = { market: "indices", "meta.country": dataMarket.name };
    console.log("indexQueries", indexQueries);
    const indexes = await getCollection("quotecollectors").find(indexQueries).toArray();

    indexes.forEach(async (symbol) => {
      const quote = await getQuoteForIndex(symbol.symbol);

      const dataToInserted = {
        stream: symbol.stream,
        market: symbol.market,
        symbol: symbol.symbol,
        currency: symbol.currency,
        quote: quote.quote,
        timestamp: Math.round(quote.timestamp),
        country: symbol.meta.country,
        currency2: symbol.meta.currency,
        date: new Date(),
      };

      getCollection("closingquotes").updateOne(
        { symbol: symbol.symbol, market: symbol.market, currency: symbol.currency },
        { $set: { ...dataToInserted } },
        { upsert: true }
      );
    });
  });
};

// const getQuoteFromPolygon = async (symbol: string) => {
//   const API_KEY = config.app.polygon_apikey;
//   const url = `https://api.polygon.io/v2/last/trade/${symbol.toUpperCase()}?apiKey=${API_KEY}`;

//   let response: any = await http.get(url);

//   if (response.status !== "OK") {
//     return {
//       success: false,
//       error: response?.error?.error || "API Error",
//       status: response?.status || 400,
//       data: null,
//     };
//   }

//   const { results } = response;

//   const timestamp = results.t / 1000000000;
//   const quote = parseFloat(results.p.toString());

//   return { quote, timestamp };
// };

const getQuoteFromFinage = async (symbol: string, market: string) => {
  try {
    const API_KEY = config.app.finage_apikey;

    const url = `https://api.finage.co.uk/last/stock/${market}/${symbol}?apikey=${API_KEY}`;

    let response: any = await http.get(url);

    if (response.error) {
      const { error } = response.error;
      return null;
    }

    const { price: pr, timestamp } = response;
    const quote = parseFloat(pr.toString());

    return { quote, timestamp: timestamp / 1000 };
  } catch (error) {
    console.error("Finage: Error in getStockQuoteFromAPI: ", error);
    return { success: false, data: null };
  }
};

const getQuoteForETFs = async (symbol: string) => {
  try {
    const API_KEY = config.app.finage_apikey;
    const url = `https://api.finage.co.uk/last/etf/${symbol}?apikey=${API_KEY}`;

    if (!url) return { success: false, error: "Invalid market", data: null };

    let response: any = await http.get(url);

    if (response.error) {
      const { error } = response.error;
      return null;
    }

    const { price: pr, timestamp } = response;

    const quote = parseFloat(pr.toString());

    return { quote, timestamp: timestamp / 1000 };
  } catch (error) {
    console.error("Finage: Error in getIndexQuoteAPI: ", error);
    return { success: false, data: null };
  }
};

const getQuoteForIndex = async (symbol: string) => {
  try {
    const API_KEY = config.app.finage_apikey;
    const url = `https://api.finage.co.uk/last/index/${symbol}?apikey=${API_KEY}`;

    if (!url) return { success: false, error: "Invalid market", data: null };

    let response: any = await http.get(url);

    if (response.error) {
      const { error } = response.error;
      return null;
    }

    const { price: pr, timestamp } = response;

    const quote = parseFloat(pr.toString());

    return { quote, timestamp: timestamp / 1000 };
  } catch (error) {
    console.error("Finage: Error in getIndexQuoteAPI: ", error);
    return { success: false, data: null };
  }
};


registerCronJobs();
