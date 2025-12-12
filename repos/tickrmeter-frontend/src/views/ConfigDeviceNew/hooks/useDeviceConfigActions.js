// hooks/useDeviceConfigActions.js
import { useDeviceConfig } from "../contexts/DeviceConfigContext";

// Action Types
export const UPDATE_ACTIONS = {
  SYMBOL_DETAILS: "SET_SYMBOL_DETAILS",
  ALERT_CFG: "SET_ALERT_CONFIG",
  ALERT_CFG_ARR: "SET_ALERT_CONFIG_ARR",
  DEVICE: "SET_DEVICE_DETAILS",
  CONFIG_TYPE: "SET_CONFIG_TYPE",
  LOADING: "SET_LOADING",
  ERROR: "SET_SERVER_ERROR",
  STOCK_QUOTE: "SET_STOCK_QUOTE",
  QUOTE_PER: "SET_STOCK_QUOTE_PERCENTAGE",
};

export const useDeviceConfigActions = () => {
  const { dispatch } = useDeviceConfig();

  return {
    setSymbolDetails: (details) => dispatch({ type: UPDATE_ACTIONS.SYMBOL_DETAILS, payload: details }),

    setAlertConfig: (config) => dispatch({ type: UPDATE_ACTIONS.ALERT_CFG, payload: config }),

    setAlertConfigArr: (config) => dispatch({ type: UPDATE_ACTIONS.ALERT_CFG_ARR, payload: config }),

    setDeviceDetails: (details) => dispatch({ type: UPDATE_ACTIONS.DEVICE, payload: details }),

    setConfigType: (type) => dispatch({ type: UPDATE_ACTIONS.CONFIG_TYPE, payload: type }),

    setLoading: (status) => dispatch({ type: UPDATE_ACTIONS.LOADING, payload: status }),

    setServerError: (error) => dispatch({ type: UPDATE_ACTIONS.ERROR, payload: error }),
    setStockQuote: (quote) => dispatch({ type: UPDATE_ACTIONS.STOCK_QUOTE, payload: quote }),
    setStockQuotePercentage: (percentage) => dispatch({ type: UPDATE_ACTIONS.QUOTE_PER, payload: percentage }),
  };
};
