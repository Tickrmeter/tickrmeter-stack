import axios from "axios";
import redis from "./redis";
import conf from "../conf";
import { logToDatabase } from "../models/sys-logs";
// const source = axios.CancelToken.source();

// console.log(getJwt());
const axiosInstance = axios.create({
  timeout: 5000, // Set a reasonable timeout
});

// Axios response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const expectedError = error.response && error.response.status >= 400 && error.response.status < 500;

    if (!expectedError) {
      console.error("An unexpected error occurred", error);
    }

    if (error.response?.data?.message === "Invalid token") {
      console.error("Invalid token error", error.response.data.message);
    }

    return Promise.reject(error);
  }
);

// API sources enumeration
export enum APISOURCES {
  POLYGON = "polygon.io",
  FINAGE = "finage.co.uk",
  COINGECKO = "coingecko.com",
  COMMODITIES = "commodities-api.com",
}

// Cache TTL configurations
const cacheTTLList = {
  [APISOURCES.POLYGON]: {
    ttl: 60,
    lastDayTTL: 1800,
    errorCheck: (res) => res.status !== "OK" && res.status !== "success",
  },
  [APISOURCES.FINAGE]: {
    ttl: 60,
    lastDayTTL: 1800,
    errorCheck: (res) => res.error,
  },
  [APISOURCES.COINGECKO]: {
    ttl: 600,
    lastDayTTL: 1800,
    errorCheck: (res) => res.error,
  },
  [APISOURCES.COMMODITIES]: {
    ttl: 3600,
    lastDayTTL: 10800,
    errorCheck: (res) => res?.data?.error !== undefined,
  },
};

const promiseCache = {};

export const getOrSetPromise = (key, fetchFunction) => {
  if (!promiseCache[key]) {
    promiseCache[key] = fetchFunction()
      .then((result) => {
        delete promiseCache[key];
        return result;
      })
      .catch((error) => {
        delete promiseCache[key];
        throw error;
      });
  }
  return promiseCache[key];
};

const getAPI = async (url: string, configKey: APISOURCES, isObj = false, isAgg = false, overrideCacheTime = -1) => {
  try {
    const aggCacheTTL = 10800;
    let cacheTTL = conf?.app?.cacheTTL || 60;

    // Check Redis cache
    const cachedData = await redis.get(url);
    if (cachedData) {
      //console.log("Cache hit for", url);
      return JSON.parse(cachedData);
    }

    const config = cacheTTLList[configKey];
    if (!config) throw new Error(`No cache configuration for API source: ${configKey}`);

    // // Perform the API call using Axios instance
    // const apiResponse = await get(url);

    // // Error handling based on response
    // if (config.errorCheck(apiResponse)) {
    //   console.error(`Error from API ${configKey}`, url, apiResponse);
    //   logToDatabase(url, configKey, "Error", apiResponse);
    //   return apiResponse;
    // }

    // if (conf?.app?.environment === "dev") {
    //   console.log("URL:", url);
    //   console.log("API Response:", apiResponse);
    // }

    // // Determine cache TTL
    // cacheTTL =
    //   overrideCacheTime !== -1
    //     ? overrideCacheTime
    //     : config
    //     ? isAgg
    //       ? config.lastDayTTL || aggCacheTTL
    //       : config.ttl
    //     : cacheTTL;

    // // Store response in Redis cache
    // await redis.set(url, JSON.stringify(apiResponse), "EX", cacheTTL);

    // logToDatabase(url, configKey, "Success");

    // Use promise cache to prevent duplicate API calls
    const responseData = await getOrSetPromise(url, async () => {
      const response = await get(url);

      //console.log("API Response:", response);

      // Error handling based on response
      if (config.errorCheck(response)) {
        console.error(`Error from API ${configKey}`, url, response);
        await logToDatabase(url, configKey, "Error", response);
        return response;
      }

      if (conf?.app?.environment === "dev") {
        console.log("URL:", url);
        console.log("Response:", response);
      }

      // Determine cache TTL
      cacheTTL =
        overrideCacheTime !== -1
          ? overrideCacheTime
          : config
          ? isAgg
            ? config.lastDayTTL || 1800
            : config.ttl
          : cacheTTL;

      // Store response in Redis cache
      await redis.set(url, JSON.stringify(response), "EX", cacheTTL);
      await logToDatabase(url, configKey, "Success");
      return response;
    });

    return responseData;
  } catch (error) {
    console.error("Error in getAPI:", error);
    if (error.response) {
      return {
        code: error.code || "REQUEST_FAILED",
        status: error.response.status,
        error: error.response.data,
      };
    }
    return isObj ? {} : [];
  }
};

const get = async (url: string) => {
  try {
    const response = await axiosInstance.get(url);
    return response?.data || null;
  } catch (error) {
    console.error("Error in get:", error);
    if (error.response) {
      return {
        code: error.code,
        status: error.response.status,
        error: error.response.data,
      };
    }
    throw error;
  }
};

// GET with Content-Type validation
const getCustom = async (url) => {
  try {
    const response = await axiosInstance.get(url);
    const contentType = response.headers["content-type"];

    if (contentType && contentType.includes("application/json")) {
      return response.data;
    } else {
      throw {
        code: "INVALID_RESPONSE",
        status: response.status,
        error: "Invalid response format. Expected JSON.",
      };
    }
  } catch (error) {
    console.error("Error in getCustom:", error);
    if (error.response) {
      throw {
        code: error.code || "REQUEST_FAILED",
        status: error.response.status,
        error: error.response.data,
      };
    } else {
      throw {
        code: error.code || "REQUEST_FAILED",
        status: 500,
        error: error.message,
      };
    }
  }
};

const post = async (url, data) => {
  try {
    const response = await axiosInstance.post(url, data);
    return response.data || response;
  } catch (error) {
    console.error("Error in post:", error);
    if (error.response) {
      return error.response.data;
    }
    return { error: "POST request failed", details: error.message };
  }
};

export default {
  getAPI,
  get,
  getCustom,
  post,
};
