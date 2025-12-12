import axios from "axios";
import redis from "./redis";
import conf from "../conf";
// const source = axios.CancelToken.source();

// console.log(getJwt());

axios.interceptors.response.use(null, (error) => {
  const expectedError = error.response && error.response.status >= 400 && error.response.status < 500;

  if (!expectedError) {
    console.log("unexpected", error);
    // throw Error(error);
    // notification("error", `An unexpected error occured. Kindly refresh the page and try again.`);
  }
  if (error.response?.data?.message === "Invalid token") {
    console.log("expeceted", error.response, error.response?.data?.message);
    // window.location = "/signin";
  }
  return Promise.reject(error);
});

const blockList = {};

const isBlocked = (domain) => {
  const blockInfo = blockList[domain];
  if (!blockInfo) return false;

  const currentTime = Date.now();
  return currentTime < blockInfo.unblockTime;
};

const blockDomain = (domain, duration) => {
  const unblockTime = Date.now() + duration;
  blockList[domain] = { unblockTime };
};

export enum APISOURCES {
  POLYGON = "polygon.io",
  FINAGE = "finage.co.uk",
  COINGECKO = "coingecko.com",
  COMMODITIES = "commodities-api.com",
}

const cacheTTLList = {
  [APISOURCES.POLYGON]: {
    ttl: 2,
    lastDayTTL: 1800,
    errorCheck: (res: any) => res.status !== "OK" && res.status !== "success",
  },
  [APISOURCES.FINAGE]: { ttl: 60, lastDayTTL: 1800, errorCheck: (res: any) => res.error },
  [APISOURCES.COINGECKO]: { ttl: 600, lastDayTTL: 1800, errorCheck: (res: any) => res.error },
  [APISOURCES.COMMODITIES]: { ttl: 3600, lastDayTTL: 10800, errorCheck: (res: any) => res?.data?.error !== undefined },
};

const getAPI = async (url: string, configKey: APISOURCES, isObj: boolean = false, isAgg = false) => {
  try {
    const aggCacheTTL = 10800;
    let cacheTTL = conf?.app?.cacheTTL || 60;

    // Try fetching from Redis cache
    let json: any = await redis.get(url);
    if (json) {
      const responeFromCache = JSON.parse(json);
      if (conf?.app?.environment === "dev") console.log("url from cache", url, responeFromCache);
      return responeFromCache;
    }

    const config = cacheTTLList[configKey]; //getAPIConfig(url);
    // Fetch from API

    const blockList = {};

    if (isBlocked(configKey)) {
      console.log(`API calls to ${configKey} are currently blocked.`);

      return { error: "Waiting ... " };
    }

    if (conf?.app?.environment === "dev") {
      console.log("for Dev only .. url", url);
    }
    const response = await get(url);

    // Determine API type based on URL and handle errors/cache TTL accordingly
    if (config && config.errorCheck(response)) {
      if (
        response.status === 429 ||
        response.error?.error === "API limit is increased" ||
        (isAgg && response.error?.info === "Please check the symbol and try again.")
      ) {
        blockDomain(configKey, 600000); // Block for 10 minutes
      }
      console.error(`error from API`, url, response);
      return response;
    }

    if (conf?.app?.environment === "dev") {
      console.log("response", response);
    }

    if (url.includes("commodities-api.com")) {
      console.log(url, config);
    }

    if (config && config.errorCheck(response)) {
      console.error(`error from API`, url, response);
      return response;
    }

    cacheTTL = config ? (isAgg ? config.lastDayTTL || aggCacheTTL : config.ttl) : cacheTTL;
    redis.set(url, JSON.stringify(response), "EX", cacheTTL);

    return response;
  } catch (error) {
    if (error.code === "ECONNABORTED") throw error;
    else return isObj ? {} : [];
  }
};

const get = async (url: string) => {
  const source = axios.CancelToken.source();

  return await axios
    .get(url, {
      cancelToken: source.token,
    })
    .then((res) => res.data)
    .catch((error) => {
      // console.error(error.response);
      if (axios.isCancel(error)) {
        // console.log("Request canceled", error.message);
      } else {
        if (error.response) return { code: error.code, status: error.response.status, error: error.response.data };
        throw error;
      }
    });
};

const getCustom = async (url: string) => {
  const source = axios.CancelToken.source();

  return await axios
    .get(url, {
      cancelToken: source.token,
    })
    .then((res) => {
      const contentType = res.headers["content-type"];

      // Check if the response Content-Type is JSON
      if (contentType && contentType.includes("application/json")) {
        return res.data; // Return the actual JSON data
      } else {
        // If the response is not JSON, throw an error
        throw {
          code: "INVALID_RESPONSE",
          status: res.status,
          error: "Invalid response format. Expected JSON.",
        };
      }
    })
    .catch((error) => {
      if (axios.isCancel(error)) {
        // Handle the case where the request is canceled
        // Optionally return or log something here
        throw { message: "Request was canceled", error };
      } else {
        if (error.response) {
          // Throw error with status and response data
          throw {
            code: error.code || "REQUEST_FAILED",
            status: error.response.status,
            error: error.response.data,
          };
        } else {
          // Throw error for other issues (like network problems)
          console.error("Error in getCustom", error);
          throw { code: error.code || "REQUEST_FAILED", status: 500, error: error.error };
        }
      }
    });
};

const post = async (url, data) =>
  await axios
    .post(url, data)
    .then((res) => res?.data || res)
    .catch((error) => {
      console.error("error in post", url, error);
      if (error.response) {
        return error.response.data;
      }
      return error;
    });

export default {
  getAPI,
  get,
  getCustom,
  post,
};
