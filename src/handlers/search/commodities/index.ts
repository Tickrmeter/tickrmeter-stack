import { ISymbolsSearchList } from "../../quotes/helper/interfaces";
import commoditiesList from "./commodities.json";
import currencyList from "./currencies.json";

export enum COMMODITY_TYPE {
  COMMODITIES = "commodities",
  CURRENCIES = "currencies",
}

export const searchCommodities = (
  searchTerm: string,
  maxResults: number,
  type: COMMODITY_TYPE
): ISymbolsSearchList[] => {
  switch (type) {
    case COMMODITY_TYPE.COMMODITIES:
      return serchCommoditiesList(searchTerm, maxResults);
    case COMMODITY_TYPE.CURRENCIES:
      return searchCurrenciesList(searchTerm, maxResults);
    default:
      return [];
  }
};

const serchCommoditiesList = (searchTerm: string, maxResults: number): ISymbolsSearchList[] => {
  const results = commoditiesList.filter(
    (commodity) =>
      commodity.name.toLowerCase().startsWith(searchTerm.toLowerCase()) ||
      commodity.symbol.toLowerCase().startsWith(searchTerm.toLowerCase())
  );

  return results.length > maxResults ? results.slice(0, maxResults) : results;
};

const searchCurrenciesList = (searchTerm: string, maxResults: number): ISymbolsSearchList[] => {
  const results = currencyList.filter(
    (currency) =>
      currency.name.toLowerCase().startsWith(searchTerm.toLowerCase()) ||
      currency.symbol.toLowerCase().startsWith(searchTerm.toLowerCase())
  );

  return results.length > maxResults ? results.slice(0, maxResults) : results;
};
