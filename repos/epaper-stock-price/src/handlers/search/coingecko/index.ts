import { ICoinsList } from "../../quotes/helper/interfaces";
import redis from "../../../services/redis";
import { HTTPClient, APISOURCES } from "../../../services/httpClass";

const CACHE_KEY = "coingecko:coins_list";
const CACHE_EXPIRY = 3 * 60 * 60; // 3 hours in seconds
const COINS_URL = "https://api.coingecko.com/api/v3/coins/list";

// Function to fetch coins list with caching
async function getCoinsListWithCache(): Promise<ICoinsList[]> {
  try {
    // Check if we have cached data
    const cachedData = await redis.get(CACHE_KEY);

    if (cachedData) {
      return JSON.parse(cachedData);
    }

    // If no cache, fetch data using HTTPClient
    const httpClient = HTTPClient.create();

    // Use the HTTPClient but don't rely on its internal caching
    // We'll handle our custom 3-hour cache for the coinlist specifically
    const response = await httpClient.get(COINS_URL);

    const coins = response.map((coin: any) => ({
      id: coin.id,
      symbol: coin.symbol,
      name: coin.name,
    }));

    // Cache the data with our specific expiry time
    await redis.set(CACHE_KEY, JSON.stringify(coins), "EX", CACHE_EXPIRY);

    httpClient.dispose();
    return coins;
  } catch (error) {
    console.error("Error fetching coins list:", error);
    // If API fails, return cached data if available or empty array
    const cachedData = await redis.get(CACHE_KEY);
    return cachedData ? JSON.parse(cachedData) : [];
  }
}

export const searchCoinsList = async (searchTerm: string, maxResults: number): Promise<ICoinsList[]> => {
  const coinsList = await getCoinsListWithCache();

  const results = coinsList
    .filter(
      (coin) =>
        coin.id.toLowerCase().startsWith(searchTerm.toLowerCase()) ||
        coin.name.toLowerCase().startsWith(searchTerm.toLowerCase()) ||
        coin.symbol.toLowerCase().startsWith(searchTerm.toLowerCase())
    )
    .map((coin) => ({
      ...coin,
      symbol: coin.symbol.toUpperCase(),
    }));

  return results.length > maxResults ? results.slice(0, maxResults) : results;
};
