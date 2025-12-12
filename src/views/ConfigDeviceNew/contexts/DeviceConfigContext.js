import { createContext, useContext, useReducer } from "react";
import { defaultAlertConfig, symbolDetailsDefault } from "../helper";

const DeviceConfigContext = createContext();

const initialState = {
  symbolDetails: symbolDetailsDefault,
  alertConfig: defaultAlertConfig,
  alertConfigArr: [{ ...defaultAlertConfig }],
  configType: "single",
  deviceDetails: null,
  loading: false,
  serverError: null,
  stockQuote: null,
  stockQuotePercentage: null,
};

const deviceConfigReducer = (state, action) => {
  switch (action.type) {
    case "SET_SYMBOL_DETAILS":
      return { ...state, symbolDetails: action.payload };
    case "SET_ALERT_CONFIG":
      return { ...state, alertConfig: action.payload };
    case "SET_ALERT_CONFIG_ARR":
      return { ...state, alertConfigArr: action.payload };
    case "SET_CONFIG_TYPE":
      return { ...state, configType: action.payload };
    case "SET_DEVICE_DETAILS":
      return { ...state, deviceDetails: action.payload };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_SERVER_ERROR":
      return { ...state, serverError: action.payload };
    case "SET_STOCK_QUOTE":
      return { ...state, stockQuote: action.payload };
    case "SET_STOCK_QUOTE_PERCENTAGE":
      return { ...state, stockQuotePercentage: action.payload };

    default:
      return state;
  }
};

export const DeviceConfigProvider = ({ children }) => {
  const [state, dispatch] = useReducer(deviceConfigReducer, initialState);

  return <DeviceConfigContext.Provider value={{ state, dispatch }}>{children}</DeviceConfigContext.Provider>;
};

export const useDeviceConfig = () => {
  const context = useContext(DeviceConfigContext);
  if (!context) {
    throw new Error("useDeviceConfig must be used within DeviceConfigProvider");
  }
  return context;
};
