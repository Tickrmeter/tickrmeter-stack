import { IGetQuoteParams } from "../quotes/helper/interfaces";

export interface IGetQuoteFromMarketObjParms {
  stream: string;
  market: string;
  symbolType: number;
  symbol: string;
  currency: string;
  unit?: string;
  divideBy100?: boolean;
  manualSearch?: boolean;
}
export interface IGetQuoteFromMarketObj {
  (params: IGetQuoteFromMarketObjParms): Promise<{
    success: boolean;
    data: any;
    error?: any;
  }>;
}

export interface IGetQuoteFromMarket {
  (
    market: string,
    symbolType: number,
    symbol: string,
    currency: string,
    unit?: string,
    divideBy100?: boolean,
    manualSearch?: boolean
  ): Promise<{
    success: boolean;
    data: any;
    error?: any;
  }>;
}

export interface IGetStockData {
  (params: { symbol: string; currency?: string; market?: string }): Promise<{
    success: boolean;
    data: any;
    error: any;
  }>;
}

export interface IPushQuote {
  (params: IPushQuoteParams): Promise<{ success: boolean; dataForDevice: any }>;
}

export interface IPushQuoteParams extends IGetQuoteParams {
  deviceData: {
    macAddress: string;
    pushObject: any;
    extras?: any;
  };
}

export interface IGetPageDataFromMarket {
  (market: string, symbol: string, currency: string): void;
}
