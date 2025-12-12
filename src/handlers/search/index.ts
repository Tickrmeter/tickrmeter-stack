import { Request, response, Response } from "express";
import { sendErrorResponse, sendResponse } from "../utils";
import { searchCoinsList } from "./coingecko";
import { FINAGE_TYPE, searchFinageSymbols } from "./finage";
import { searchForexList, searchPolygonSymbols, searchUSIndicesList } from "./polygon";
import { COMMODITY_TYPE, searchCommodities } from "./commodities";
import { DATA_MARKETS, DATA_STREAM, SYMBOL_TYPE } from "../../constants";
import Top10Model from "../../models/top10";
import http from "../../services/http";

import exchangeList from "./exchanges_new.json";
import countries from "./countries.json";
import customSymbols from "./custom_symbols.json";

export const searchSymbolsForAutoComplete2 = (req: Request, res: Response) => {
  //console.log(req.url);
  ///coins/search?q=bitcoin .. need to remove all before ?
  const url = require("url");

  const str = req.url;
  const parsedUrl = url.parse(str, true);
  const result = parsedUrl.pathname;
  //console.log(result); // "/coins/search"

  switch (result) {
    case "/coins/search":
      //console.log("coins");
      req.params.stream = DATA_STREAM.COINGECKO;
      req.params.market = DATA_MARKETS.CRYPTO;
      break;
    case "/indices/search":
      ///console.log("indices");
      req.params.stream = DATA_STREAM.FINAGE;
      req.params.market = DATA_MARKETS.INDICES;
      break;
    case "/etfs/search":
      //console.log("etfs");
      req.params.stream = DATA_STREAM.FINAGE;
      req.params.market = DATA_MARKETS.ETFS;
      break;
    default:
      req.params.stream = "";
      req.params.market = "";
      break;
  }

  searchSymbolsForAutoComplete(req, res);
};

export const searchSymbolsForAutoComplete = async (req: Request, res: Response) => {
  try {
    //const type = req.params.type as unknown as SYMBOL_TYPE;

    const stream = req.params.stream;
    const market = req.params.market;
    const searchTerm = req.query.q;
    const type = req.query.t;

    if (!stream || !market) return sendErrorResponse(res, "Invalid request");

    if (searchTerm === "") return sendErrorResponse(res, "Invalid query");

    //console.log(req.params);
    //console.log(req.query);

    const maxResults = 30;
    let results = [];

    switch (stream) {
      case DATA_STREAM.POLYGON:
        //console.log("polygon");
        results =
          market === DATA_MARKETS.FOREX
            ? searchForexList(searchTerm as string)
            : market === DATA_MARKETS.INDICES
            ? searchUSIndicesList(searchTerm as string)
            : searchPolygonSymbols(searchTerm as string);
        break;
      case DATA_STREAM.TRADINGVIEW:
        //console.log("tradingview");

        results =
          market === DATA_MARKETS.CRYPTO
            ? await searchCoinsList(searchTerm as string, maxResults)
            : await searchTradingViewSymbols(searchTerm as string, market);

        break;
      case DATA_STREAM.FINAGE:
        //console.log("finage");

        //const ftype = (market === "uk" || market === "ca" ? `${market}_stocks` : market) as FINAGE_TYPE;

        let ftype: FINAGE_TYPE;

        switch (market) {
          case "uk":
          case "ca":
          case "se":
          case "dk":
            ftype = `${market}_stocks` as FINAGE_TYPE;
            break;
          case "Indices":
          case "ETFs":
          case "Forex":
            ftype = market as FINAGE_TYPE;
            break;
          default:
            ftype = market as FINAGE_TYPE;
            break;
        }

        // results = searchFinageSymbols(searchTerm as string, ftype);

        results = searchFinageSymbols(searchTerm as string, ftype);
        break;
      case DATA_STREAM.COINGECKO:
        //console.log("coingecko");
        results = await searchCoinsList(searchTerm as string, maxResults);
        break;
      case DATA_STREAM.COMMODITES:
        //console.log("commodites");

        results = searchCommodities(
          searchTerm as string,
          maxResults,
          type === "currency" ? COMMODITY_TYPE.CURRENCIES : COMMODITY_TYPE.COMMODITIES
        );

        break;
      case DATA_STREAM.LOCALTOP10:
        const { data } = await Top10Model.getAll();

        results = data.map((item) => ({
          symbol: item.symbol,
          name: item.name,
        }));
        break;
      default:
        console.log("DEFAULT CASE: Invalid request");
        break;
    }

    const trimmed = results.slice(0, maxResults);

    return sendResponse(true, "OK", trimmed, res);
  } catch (err) {
    console.error("searchSymbolsForAutoComplete", err);
    sendErrorResponse(res, "Error searching symbols");
  }
};

const searchTradingViewSymbols = async (searchTerm: string, market: string) => {
  try {
    const url = new URL("https://api.twelvedata.com/symbol_search");
    url.searchParams.append("symbol", searchTerm);
    url.searchParams.append("apikey", "b4ed2579b8cf4d4b8dcad4edba38dd0d");

    //console.log(url.toString());
    const { data } = await http.get(url.toString());

    if (market === DATA_MARKETS.CRYPTO) {
      const uniqueSymbols = new Set();
      const uniqueData = data.reduce((acc, d) => {
        if (d.mic_code === "DIGITAL_CURRENCY" && !uniqueSymbols.has(d.symbol)) {
          const currency = d.symbol.split("/")[1] || "USD";
          uniqueSymbols.add(d.symbol);

          acc.push({ ...d, exchange: "CRYPTO", currency });
        }
        return acc;
      }, []);
      return uniqueData;
    } else {
      const _data = data
        .filter((d) => d.mic_code !== "DIGITAL_CURRENCY" && d.mic_code !== "PHYSICAL_CURRENCY")
        .map((d) => {
          const exchange = exchangeList.find((e) => e.mic_code === d.mic_code);

          const cc = countries.find((c) => c.name === d.country)?.code2.toLowerCase() || "";

          return { ...d, exchange: exchange?.code || d.exchange, cc };
        });

      //search in custom list as well
      const customData = customSymbols.filter((d) => d.symbol.includes(searchTerm.toUpperCase()));

      return [..._data, ...customData];
    }
  } catch (error) {
    console.error("searchTradingViewSymbols", error);
    return [];
  }
};
