import axios, { AxiosInstance } from "axios";
import redis from "./redis";
import conf from "../conf";
//import { logToDatabase } from "../models/sys-logs";

export enum APISOURCES {
  POLYGON = "polygon.io",
  FINAGE = "finage.co.uk",
  COINGECKO = "coingecko.com",
  COMMODITIES = "commodities-api.com",
}

export class HTTPClient {
  private static cacheTTLList = {
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

  private axiosInstance: AxiosInstance;
  private promiseCache: { [key: string]: Promise<any> };

  constructor() {
    this.axiosInstance = axios.create({ timeout: 5000 });
    this.promiseCache = {};
    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        const expectedError = error.response && error.response.status >= 400 && error.response.status < 500;
        if (!expectedError) {
          console.error("An unexpected error occurred", error?.response);
        }
        if (error.response?.data?.message === "Invalid token") {
          console.error("Invalid token error", error.response.data.message);
        }
        return Promise.reject(error);
      }
    );
  }

  private getOrSetPromise(key: string, fetchFunction: () => Promise<any>): Promise<any> {
    if (!this.promiseCache[key]) {
      this.promiseCache[key] = fetchFunction()
        .then((result) => {
          delete this.promiseCache[key];
          return result;
        })
        .catch((error) => {
          delete this.promiseCache[key];
          throw error;
        });
    }
    return this.promiseCache[key];
  }

  async getAPI(url: string, configKey: APISOURCES, isObj = false, isAgg = false, overrideCacheTime = -1): Promise<any> {
    try {
      const cachedData = await redis.get(url);

      if (cachedData) return JSON.parse(cachedData);

      const config = HTTPClient.cacheTTLList[configKey];
      if (!config) throw new Error(`No cache configuration for API source: ${configKey}`);

      const responseData = await this.getOrSetPromise(url, async () => {
        const response = await this.get(url);

        if (config.errorCheck(response)) {
          console.error(`Error from API ${configKey}`, url, response.error || response.status);
          // await logToDatabase(url, configKey, "Error", response);
          return response;
        }

        const cacheTTL =
          overrideCacheTime !== -1
            ? overrideCacheTime
            : config
            ? isAgg
              ? config.lastDayTTL
              : config.ttl
            : conf?.app?.cacheTTL || 60;

        await redis.set(url, JSON.stringify(response), "EX", cacheTTL);
        // await logToDatabase(url, configKey, "Success");
        return response;
      });

      return responseData;
    } catch (error) {
      //console.error("Error in getAPI:", error);
      return isObj ? {} : [];
    }
  }

  async get(url: string): Promise<any> {
    try {
      const response = await this.axiosInstance.get(url);
      return response?.data || null;
    } catch (error) {
      //console.error("Error in get:", error);
      throw error;
    }
  }

  async getCustom(url: string): Promise<any> {
    try {
      const response = await this.axiosInstance.get(url);
      const contentType = response.headers["content-type"];

      if (contentType && contentType.includes("application/json")) {
        return response.data;
      }
      throw new Error("Invalid response format. Expected JSON.");
    } catch (error) {
      console.error("Error in getCustom:", error);
      throw error;
    }
  }

  async post(url: string, data: any): Promise<any> {
    try {
      const response = await this.axiosInstance.post(url, data);
      return response.data || response;
    } catch (error) {
      console.error("Error in post:", error);
      return { error: "POST request failed", details: error.message };
    }
  }

  dispose(): void {
    this.promiseCache = {};
    this.axiosInstance = null;
  }

  static create(): HTTPClient {
    return new HTTPClient();
  }
}
