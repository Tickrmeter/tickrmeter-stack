import http from "../../services/http";
import { getFormattedNumber, isValidURL } from "../quotes/helper";
import { IGetQuote } from "./helper/interfaces";

export const FetchDataFromCustomAPI = async (url: string) => {
  return { success: false, error: "not found" };
  try {
    if (!isValidURL(url)) {
      return { success: false, error: "Invalid URL" };
    }

    const response = await http.getCustom(url);

    const dotNotationKeys = getDotNotationKeys(response);

    return { success: true, data: dotNotationKeys };
  } catch (error) {
    console.error("--- GetDataFromCustomAPI Error ---", error);
    return { success: false, error: error };
  }
};

const getDotNotationKeys = (obj: any, parentKey = "") => {
  const result = [];

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const currentKey = parentKey ? `${parentKey}.${key}` : key;

      if (typeof obj[key] === "object" && obj[key] !== null) {
        result.push(...getDotNotationKeys(obj[key], currentKey));
      } else {
        const value = typeof obj[key] === "number" ? getFormattedNumber(obj[key]) : obj[key];

        result.push({ key: currentKey, value });
      }
    }
  }

  return result;
};

const ProcessCustomAPIData = async (url, mapping) => {
  try {
    if (!isValidURL(url)) {
      return { success: false, error: "Invalid URL" };
    }
    if (!mapping || !Object.keys(mapping).length) {
      return { success: false, error: "Invalid Mapping" };
    }

    const { success, data } = await FetchDataFromCustomAPI(url);

    if (!success) {
      return { success, data: null, error: "Failed to get data from API" };
    }

    //get all keys starting with placeholder from mapping
    const keys = Object.keys(mapping).filter((key) => key.startsWith("placeholder"));

    //get the values of the keys
    const mappedValues = keys.reduce((acc, key) => {
      acc[key] = data.find((item) => item.key === mapping[key])?.value ?? "";
      return acc;
    }, {});

    //get layout mapping
    let layoutMapping;

    if (mapping.layout === "1") {
      layoutMapping = getLayout1Mapping(mappedValues);
    }

    return { success: true, data: layoutMapping };
  } catch (error) {
    console.error("--- PushDataFromCustomAPI Error ---", error);
    return { success: false, error: error };
  }
};

const getLayout1Mapping = (data) => {
  return {
    symbol: data.placeholder1,
    price: data.placeholder2,
    date: data.placeholder3,
    percent: data.placeholder4,
  };
};

export const GetProcessedDataFromCustomAPI: IGetQuote = async (params) => {
  return { success: false, error: "not found", data: null };
  const { symbol, customAPIMapping } = params;

  const data = await ProcessCustomAPIData(symbol, customAPIMapping);

  return {
    success: data.success,
    data: data.data,
    error: data.error,
  };
};
