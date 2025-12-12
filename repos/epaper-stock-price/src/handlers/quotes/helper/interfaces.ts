import { IDevice } from "../../../models/interfaces";

export interface ICurrency {
  code: string;
  symbol: string;
  decimal: string;
}

export interface IGainTracking {
  enabled: boolean;
  purchasePrice: number;
  noOfStocks: number | null;
  showFullAssetValue: boolean;
  isShortSell: boolean;
  isCalculateOnDaily?: boolean;
}

export interface IGetQuoteFromAPIParams {
  market?: string;
  symbol: string;
  symbolType?: number;
  gainTracking: IGainTracking;
  multiplier: {
    enabled: boolean;
    value: number;
  };
  currency?: string;
  stockName?: string;
  aggregateTime?: string;
  unit?: string;
  divideBy100?: boolean;
  manualSearch?: boolean;
}

export interface IGetQuoteFromAPI {
  (params: IGetQuoteFromAPIParams): Promise<{ success: boolean; data: any; error?: string; status?: string }>;
}

export interface IGetQuote {
  (params: IGetQuoteParams): Promise<{ success: boolean; data: any; error?: string; status?: any }>;
}

export interface IQueryObject {
  stream?: string;
  market?: string;
  symbol: string;
  currency: string;
  symbolType: number;
  extraConfig: {
    aggregateTime: string;
    unit: string;
    divideBy100?: boolean;
  };
}

export interface IGetQuoteParams {
  market: string;
  name?: string;
  symbolType: number;
  symbol: string;
  gainTracking: IGainTracking;
  multiplier: { enabled: boolean; value: number };
  currency: string;
  aggregateTime: string;
  unit: string;
  divideBy100?: boolean;
  manualSearch?: boolean;
  customAPIMapping?: any;
  stream?: string;
  tickSymbol?: string;
  timeZone?: string;
  extras?: any;
}

export interface IGetQuoteForSingleSymbol {
  (params: {
    deviceMac: string;
    config: IDevice["config"];
    msgType: string;
    userTimeParams: { timeZone: string; timeFormat: string };
    extras?: any;
  }): Promise<void>;
}

export interface IGetQuoteForPlaylist {
  (params: {
    deviceMac: string;
    symbolFromDevice: string;
    playlist: IDevice["playlist"];
    userTimeParams: { timeZone: string; timeFormat: string };
  }): Promise<void>;
}

export interface ICoinsList {
  id: string;
  symbol: string;
  name: string;
}

export interface ISymbolsSearchList {
  symbol: string;
  name: string;
  country?: string;
  currency?: string;
}

//--------------------------------------------------------------------------------------//

export interface IPageQuoteFromAPI {
  (params: {
    market?: string;
    symbol: string;
    currency?: string;
    ledColor?: string;
    blink?: boolean;
    extras?: any;
    timeZone?: string;
  }): Promise<{
    success: boolean;
    data: any;
    error?: string;
    status?: string;
  }>;
}

export interface IGetPageData {
  (params: { symbol: string; currency?: string; market?: string }): Promise<{
    success: boolean;
    data: any;
    error: any;
  }>;
}

export interface IGetPage {
  (params: { market: string; symbolType: number; symbol: string; currency: string; extras?: any }): Promise<{
    success: boolean;
    data: any;
    error?: string;
    status?: any;
  }>;
}

export interface ICalculatePercentage {
  (currentQuote: number, gainTracking: IGainTracking, currency: ICurrency, aggregateTime?: string): {
    perValue: number;
    percent: string;
  };
}

export interface ICalculateGainLoss {
  (params: { gainTracking: IGainTracking; currentPrice: number; currencyObj: ICurrency }): {
    gainlossText: string;
    percentageGainOrLoss: number;
  };
}

export interface IGetStockPreviousClosingParams {
  symbol: string;
  market: string;
  aggregateTime?: string;
  manualSearch?: boolean;
}

export interface ICalculateProfitLossPercentageParams {
  symbol: string;
  currentPrice: number;
  gainTracking: IGainTracking;
  getStockPreviousClosing: (
    symbol: string,
    market: string,
    aggregateTime?: string,
    manualSearch?: boolean
  ) => Promise<number>;
  currency: ICurrency | null;
  isGBX?: boolean;
  market?: string;
  aggregateTime?: string;
  manualSearch?: boolean;
}

export interface ICalculateProfitLossPercentage {
  (
    symbol: string,
    currentPrice: number,
    gainTracking: IGainTracking,
    getStockPreviousClosing: (
      symbol: string,
      market: string,
      aggregateTime?: string,
      manualSearch?: boolean
    ) => Promise<number>,
    currency: ICurrency | null,
    isGBX?: boolean,
    market?: string,
    aggregateTime?: string,
    manualSearch?: boolean
  ): Promise<{ percent: string; perValue: number }>;
}

// export interface IPushQuote {
//   (params: IPushQuoteParams): Promise<boolean>;
// }

// interface IPushQuoteParams extends IGetQuoteParams {
//   deviceData: {
//     macAddress: string;
//     pushObject: any;
//     extras?: any;
//   };
// }
