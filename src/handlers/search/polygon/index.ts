import { ISymbolsSearchList } from "../../quotes/helper/interfaces";
import usStocksList from "./us_stocks.json";
import currencyCodes from "./forex.json";
import usIndices from "../../jsonFiles/us_indices_tv.json";

export const searchPolygonSymbols = (searchTerm: string): ISymbolsSearchList[] => {
  const results = usStocksList
    .filter(
      (symbol) =>
        symbol.name.toLowerCase().startsWith(searchTerm.toLowerCase()) ||
        symbol.symbol.toLowerCase().startsWith(searchTerm.toLowerCase())
    )
    .map((symbol) => ({
      ...symbol,
      currency: "USD",
    }));

  return results;
};

export const searchForexList = (searchTerm: string): ISymbolsSearchList[] => {
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

export const searchUSIndicesList = (searchTerm: string): ISymbolsSearchList[] => {
  const results = usIndices
    .filter(
      (symbol) =>
        symbol.symbol.toLowerCase().startsWith(searchTerm.toLowerCase()) ||
        symbol.name.toLowerCase().startsWith(searchTerm.toLowerCase())
    )
    .map((symbol) => ({
      name: symbol.name,
      symbol: symbol.symbol,
    }));

  return results;
};