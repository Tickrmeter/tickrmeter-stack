import { DateTime } from "luxon";
import { Moment } from "moment";
import { SYMBOL_TYPE } from "../constants";

export interface IUserLogin {
  email: string | RegExp | any;
  password: string;
}

export interface IUserReq {
  userId: string;
  isAdmin: boolean;
  timeZone: string;
}

export interface IUser {
  _id?: string;
  name: string;
  email: string;
  password: string;
  isActive: boolean;
  userRole: number;
  enableFastRefresh: boolean;
  timeZone: string;
  timeFormat: string;
  isAdmin?: boolean;
  token: string;
  confirmToken?: {
    token: string;
    created: Date;
  };
  resetToken?: {
    token: string;
    created: Date;
  };
  createdAt?: DateTime | string;
  updatedAt?: DateTime | string;
  noOfDevices?: number;
  meta: any;
  __v?: number;
}

export interface ISingleConfig {
  stream: string;
  market: string;
  symbol: string;
  interval: string;
  symbolType: number;
  currency: string;
  ledBrightness: number;
  alertEnabled?: boolean;
  multiplierEnabled?: boolean;
  multiplier?: number;
  alertConfig?: {
    alertEnabled?: boolean;
    triggerType: string;
    triggerValue: number;
    flashLightbar: boolean;
    playSound: boolean;
    soundType: string;
    changeLightBarColor: boolean;
    lightBarColor: string;
  };
  gainTrackingEnabled: boolean;
  purchasePrice?: number;
  noOfStocks: number;
  showFullAssetValue: boolean;
  isShortSell: boolean;
  extraConfig: {
    aggregateTime: string;
    isMetalCommoidity: boolean;
    unit: string;
    divideBy100: boolean;
    manualSearch: boolean;
  };
}

export interface IPlaylistConfig {
  name: string;
  cycleInterval: string;
  updateInterval: string;
  ledBrightness: number;
  cycleMode: string;
  isCalculateOnDaily: boolean;
  symbols: {
    stream?: string;
    market?: string;
    symbol: string;
    symbolType: number;
    currency: string;
    gainTrackingEnabled: boolean;
    purchasePrice?: number;
    noOfStocks: number;
    showFullAssetValue: boolean;
    isShortSell: boolean;
    multiplierEnabled?: boolean;
    multiplier?: number;
    extraConfig: {
      aggregateTime: string;
      isMetalCommoidity: boolean;
      unit: string;
      divideBy100: boolean;
      manualSearch: boolean;
    };
  }[];
}

export interface IDevice {
  _id?: string;
  name?: string;
  macAddress: string;
  isActive: boolean;
  userId?: string;
  registration?: {
    key: string;
    valid: Date;
  };
  mode: string; //text, page
  isPlaylist?: boolean;
  pageConfig?: {
    pageId: number;
    ledColor: string;
  }[];
  config?: ISingleConfig | {};
  playlist?: IPlaylistConfig;
  playlistId?: string;
  firmwareVersion?: string;
  lastStatusOn: DateTime | string;
  batteryStatus: number;
  nightMode?: boolean;
  nightModeStart?: string;
  nightModeEnd?: string;
  extras?: any;
  createdAt?: DateTime;
  updatedAt?: DateTime;
}

export interface IDeviceWithUser extends Omit<IDevice, "userId"> {
  user: {
    _id: string;
    name: string;
    email: string;
    timeZone: string;
    timeFormat: string;
  };
}

export type IPageOpts = {
  title: string;
  error: string;
  error2?: string;
  isAdmin: boolean;
  deviceValues?: any;
  userValues?: any;
  users?: any[];
  devices?: any;
  firmwares?: any;
  firmwareValues?: any;
  extras?: any;
};

export interface IFirmware {
  _id?: string;
  fileName: string;
  isRelease: boolean;
  version: string;
  uploadedBy: string;
}

export interface IQueryObject {
  symbol: string;
  currency: string;
  symbolType: number;
}

export interface IPlaylist {
  _id?: string;
  name: string;
  cycleInterval: string;
  updateInterval: string;
  ledBrightness: number;
  cycleMode: string;
  isCalculateOnDaily: boolean;
  symbols: {
    stream: string;
    market: string;
    symbol: string;
    symbolType: number;
    currency: string;
    gainTrackingEnabled: boolean;
    multiplierEnabled?: boolean;
    multiplier?: number;
    purchasePrice?: number;
    noOfStocks: number;
    showFullAssetValue: boolean;
    isShortSell: boolean;
  }[];
  userId: string;
}

export interface ITop10 {
  _id?: string;
  symbol: string;
  name: string;
  price: string;
  percent: string;
  date: string;
  currency: string;
  uploadedBy: string;
  createdAt?: DateTime | string;
}

export interface IDevicePage {
  pageId: number;
  symbolType: number;
  symbol: string;
  price: number;
  currency: string;
  stream: string | SYMBOL_TYPE;
  market: string;
  currentHour?: number;
  createdAt?: Date;
  updatedAt?: Date;
  rev?: number;
  name?: string;
}
