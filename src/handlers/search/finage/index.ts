import { ISymbolsSearchList } from "../../quotes/helper/interfaces";
import indicesList from "./indices.json";
import etfList from "./etfs.json";
import ukStocksList from "./uk_stocks.json";
import canadaStocksList from "./canada_stocks.json";
import swedenStocksList from "./sweden_stocks.json";
import denmarkStocksList from "./denmark_stocks.json";
import countryCodes from "./country_codes.json";
import currencyCodes from "./forex.json";
import { dataMarkets } from "../../quotes/helper";

export enum FINAGE_TYPE {
  UK_STOCKS = "uk_stocks",
  CANADA_STOCKS = "ca_stocks",
  DENMARK_STOCKS = "dk_stocks",
  SWEDEN_STOCKS = "se_stocks",
  INDICES = "indices",
  ETF = "etf",
  FOREX = "forex",
}

export const searchFinageSymbols = (searchTerm: string, type: FINAGE_TYPE): ISymbolsSearchList[] => {
  switch (type) {
    case FINAGE_TYPE.UK_STOCKS:
    case FINAGE_TYPE.CANADA_STOCKS:
    case FINAGE_TYPE.DENMARK_STOCKS:
    case FINAGE_TYPE.SWEDEN_STOCKS:
      return searchFinageStocksList(searchTerm, type);
    case FINAGE_TYPE.INDICES:
    case FINAGE_TYPE.ETF:
      return searchIndicesOrETFList(searchTerm, type);
    case FINAGE_TYPE.FOREX:
      return searchForexList(searchTerm);
    default:
      console.log("default:", type);
      return [];
  }
};

const searchFinageStocksList = (searchTerm: string, type: FINAGE_TYPE): ISymbolsSearchList[] => {
  const stockLists = {
    [FINAGE_TYPE.UK_STOCKS]: ukStocksList,
    [FINAGE_TYPE.CANADA_STOCKS]: canadaStocksList,
    [FINAGE_TYPE.DENMARK_STOCKS]: denmarkStocksList,
    [FINAGE_TYPE.SWEDEN_STOCKS]: swedenStocksList,
  };
  const stockList = stockLists[type] || [];

  const currency = dataMarkets.find((market) => `${market._id}_stocks` === type)?.currency.code || "-";

  const results = stockList
    .filter(
      (stock) =>
        stock.name.toLowerCase().startsWith(searchTerm.toLowerCase()) ||
        stock.symbol.toLowerCase().startsWith(searchTerm.toLowerCase())
    )
    .map((stock) => {
      return {
        ...stock,
        currency: currency.toUpperCase(),
      };
    });

  return results;
};

const searchIndicesOrETFList = (searchTerm: string, type: FINAGE_TYPE): ISymbolsSearchList[] => {
  const symbolList = type === FINAGE_TYPE.INDICES ? indicesList : etfList;

  const results = symbolList
    .filter(
      (symbol) =>
        symbol.name.toLowerCase().startsWith(searchTerm.toLowerCase()) ||
        symbol.symbol.toLowerCase().startsWith(searchTerm.toLowerCase())
    )
    .map((symbol) => {
      return {
        ...symbol,
        currency: symbol.currency.toUpperCase(),
        country_code: countryCodes.find((country) => country.name === symbol.country)?.code || "",
      };
    });

  return results;
};

const searchForexList = (searchTerm: string): ISymbolsSearchList[] => {
  const results = currencyCodes
    .filter(
      (symbol) =>
        symbol.code.toLowerCase().startsWith(searchTerm.toLowerCase()) ||
        symbol.name.toLowerCase().startsWith(searchTerm.toLowerCase())
    )
    .map((symbol) => ({
      name: symbol.name,
      symbol: symbol.code,
    }));

  return results;
};
