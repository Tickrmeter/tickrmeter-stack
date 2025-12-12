import { publishData } from "../services/mqtt";

const DEVICE_STATUS_TOPIC = "DEVICESTATUS";
export const askForDeviceStatus = () => {
  console.log("askForDeviceStatus", new Date().toLocaleString());
  publishData(DEVICE_STATUS_TOPIC, JSON.stringify({ action: "status" }));
};

// import { subscribe, publishData, onSubscriptionData, unsubscribeTopic } from "../mqtt";
// import DeviceModel from "../models/device";
// import { IDevice, IDeviceWithUser, IQueryObject } from "../models/interfaces";
// import moment from "moment";
// import { DEFAULT_TIMEZONE, MSG_TYPES } from "../constants";
// // import { getCryptoQuoteFromAPI, getStockQuoteFromAPI } from "./deviceConfig";
// import { onDeviceStatusRecieved } from "./devices";

// import { DateTime, Interval } from "luxon";

// const ON_DEVICE_START = "TICKRMETERBOOT";
// const MAIN_TOPIC = "STOCKPRICEUPDATE";
// const ALERT_TOPIC = "ALERT";
// const FIRMWARE_TOPIC = "FIRMWAREUPDATE";
// const DEVICE_STATUS_RES_TOPIC = "DEVICESTATUS_RES";

// const NO_CONFIG_MSG = { type: MSG_TYPES.NO_CONFIG, success: false, message: "No configuration found." };
// const NO_DEVICE_FOUND = { type: MSG_TYPES.DEVICE_ASSIGNED, success: false, message: "Device Not Found" };

// export const subscribeToTopics = () => {
//   unsubscribeTopic(ON_DEVICE_START);
//   subscribe(ON_DEVICE_START);
//   unsubscribeTopic(MAIN_TOPIC);
//   subscribe(MAIN_TOPIC);
//   unsubscribeTopic(DEVICE_STATUS_RES_TOPIC);
//   subscribe(DEVICE_STATUS_RES_TOPIC);
//   onSubscriptionData(onDataReceive);
// };

//** MQTT Call back when data is received */
// export const onDataReceive = async (topic: string, payload: string) => {
//   try {
//     const message = JSON.parse(payload);

//     if (topic === DEVICE_STATUS_RES_TOPIC) return onDeviceStatusRecieved(message);

//     const { device, type, symbol } = message;

//     //console.log("DATA RECIEVED===>", { topic, device, type, symbol });

//     if (device) {
//       switch (type) {
//         case MSG_TYPES.BOOT:
//           return await getDeviceConfig(device);
//         case MSG_TYPES.UPDATE:
//           return await getDeviceStocks(device, MSG_TYPES.UPDATE, symbol);
//         default:
//           return publishData(
//             device,
//             JSON.stringify({ type: MSG_TYPES.INVALID_FORMAT, success: false, message: "Invalid format" })
//           );
//       }
//     }

//     // if (!type)
//     //   return publishData(
//     //     device,
//     //     JSON.stringify({ type: MSG_TYPES.INVALID_FORMAT, success: false, message: "Invalid format" })
//     //   );

//     // if (type === "BOOT") {
//     //   await getDeviceConfig(device);
//     //   return;
//     // }

//     // if (type === MSG_TYPES.UPDATE) {
//     //   await getDeviceStocks(device, MSG_TYPES.UPDATE, symbol);
//     // }
//   } catch (error) {
//     //console.log(message.toString());
//     console.error("publishDeviceStock-> might be parsing error for invalid json", payload.toString(), error);
//   }
// };

// ** Get Device Configuration on TickrMeter boot
// ** Device Assginement/Registration etc
// const getDeviceConfig = async (deviceMac: string) => {
//   // ** Get Device Details
//   const device = await DeviceModel.getByMacAddress(deviceMac);

//   // ** Check if device exists
//   if (!device.success || device.error === "Device Not Found") {
//     console.log("create a new device");

//     const newDevice: IDevice = {
//       macAddress: deviceMac,
//       mode: "text",
//       isActive: true,
//       batteryStatus: 0,
//       lastStatusOn: moment(),
//       registration: {
//         key: randomNo(),
//         valid: moment().add(10, "m"),
//       },
//     };

//     const res = await DeviceModel.add(newDevice);

//     const data = res.success
//       ? { type: "DEVICE_REG", ...newDevice.registration, success: true, message: "ADDED_SUCCESSFULLY" }
//       : { type: "DEVICE_REG_FAILURE", success: false, message: "Error creating device." };

//     publishData(deviceMac, JSON.stringify(data));
//   } else {
//     if (device?.data?.userId) {
//       getDeviceStocks(deviceMac, MSG_TYPES.NEW);
//     } else {
//       console.log("Generate Random 5 digit code and send on MQTT");
//       const registration = {
//         key: randomNo(),
//         valid: moment().add(10, "m"),
//       };

//       const deviceToUpdate = {
//         ...device.data,
//         registration,
//       };

//       await DeviceModel.update(deviceToUpdate);

//       const data = { type: "DEVICE_REG", ...registration, message: "UNASSIGNED_DEVICE" };
//       publishData(deviceMac, JSON.stringify(data));
//     }
//   }
// };

//const randomNo = () => (Math.floor(Math.random() * 90000) + 10000).toString();

// //** Main function called on the message recieved with UPDATE MSG */
// const getDeviceStocks_old = async (deviceMac: string, UPDATE_OR_NEW = MSG_TYPES.UPDATE, symbolFromDevice = null) => {
//   const { success, data: deviceData } = await DeviceModel.getByMacAddress(deviceMac);

//   if (!success) return publishData(deviceMac, JSON.stringify(NO_DEVICE_FOUND));

//   const timeZone = deviceData?.userId?.timeZone || DEFAULT_TIMEZONE;

//   // Check configuration
//   if (!isConfigAvailable(deviceData)) return publishData(deviceMac, JSON.stringify(NO_CONFIG_MSG));

//   //** CHECK NIGHTMODE ENABLED IN DEVICE CONFIG
//   let ledBrigthness = GetLEDBrightness(deviceData, timeZone);
//   const { isPlaylist, playlist, config } = deviceData;

//   if (isPlaylist) playlist.ledBrightness = ledBrigthness;
//   else config.ledBrightness = ledBrigthness;

//   //if function called from UPDATE message
//   if (symbolFromDevice) return getQuoteForPlaylistSymbol(deviceMac, symbolFromDevice, playlist, timeZone);

//   if (isPlaylist) publishPlaylistData(playlist, deviceMac, timeZone);
//   //** not a playlist */
//   else publishSingleTickerData(deviceMac, config, UPDATE_OR_NEW, timeZone);
// };

// //** Get Symbol data when its in the playlist */
// const getQuoteForPlaylistSymbol = async (
//   deviceMac: string,
//   symbolFromDevice: string,
//   devicePlaylist: any,
//   timeZone: string
// ) => {
//   const _split = symbolFromDevice.split("/");
//   const playlistSymbol = _split[0];
//   const playlistSymbolType = _split.length > 1 ? 2 : 1;
//   const playlistCurrency = playlistSymbolType === 2 ? _split[1] : null;

//   const symbolData = playlistCurrency
//     ? devicePlaylist.symbols.find((s) => s.symbol === playlistSymbol && s.currency === playlistCurrency)
//     : devicePlaylist.symbols.find((s) => s.symbol === playlistSymbol);

//   let gainTracking = { enabled: false, purchasePrice: -1 };
//   if (symbolData) {
//     gainTracking = {
//       enabled: symbolData?.gainTrackingEnabled || false,
//       purchasePrice: symbolData?.purchasePrice || -1,
//     };
//   }

//   const { success: success4, data: playlistQuoteData } =
//     playlistSymbolType === 1
//       ? await getStockQuoteFromAPI(playlistSymbol, gainTracking, timeZone)
//       : playlistSymbolType === 2
//       ? await getCryptoQuoteFromAPI(playlistSymbol, timeZone, playlistCurrency || "USD", gainTracking)
//       : { success: false, data: null };

//   if (!success4)
//     return publishData(
//       deviceMac,
//       JSON.stringify({ type: MSG_TYPES.STOCK_ERROR, success: false, message: "Unable to get the stocks quote." })
//     );

//   const playlistDataForDevice = {
//     ...playlistQuoteData,
//     type: MSG_TYPES.UPDATE,
//     isPlaylist: true,
//     gainTrackingEnabled: undefined,
//     purchasePrice: undefined,
//     ledBrightness: devicePlaylist.ledBrightness,
//   };

//   publishData(deviceMac, JSON.stringify(playlistDataForDevice));
//   return;
// };

// const isConfigAvailable = (device: IDeviceWithUser) => {
//   if (!device) return false;
//   if (device.isPlaylist && !device.playlist) return false;

//   if (!device.isPlaylist) {
//     const { config } = device;
//     if (!config) return false;
//     if (!config?.symbol || !config?.interval || !config?.symbolType) return false;
//   }

//   return true;
// };

// //** For publishing Playlist Data */
// const publishPlaylistData = (playlist: IDevice["playlist"], deviceMac: string, timeZone) => {
//   const { name, cycleInterval, updateInterval, symbols, ledBrightness } = playlist;

//   if (!name || !cycleInterval || !updateInterval || !symbols)
//     return publishData(deviceMac, JSON.stringify(NO_CONFIG_MSG));

//   const tickerConfig = { name, cycleInterval, updateInterval, symbols };

//   // using 1st object to push to device
//   const queryObject = { symbol: symbols[0].symbol, currency: symbols[0].currency, symbolType: symbols[0].symbolType };
//   const configObject = {
//     isPlaylist: true,
//     type: MSG_TYPES.NEW,
//     ...tickerConfig,
//     ledBrightness: ledBrightness ?? 100,
//     symbols: symbols.map((s) => (s.symbolType === 2 ? `${s.symbol}/${s.currency}` : s.symbol)).join(","),
//     alertEnabled: false,
//   };

//   publishDataToDevice(deviceMac, queryObject, configObject, timeZone);
// };

// //** For publishing single Ticker Data */
// const publishSingleTickerData = async (
//   deviceMac: string,
//   config: IDevice["config"],
//   UPDATE_OR_NEW = MSG_TYPES.UPDATE,
//   timeZone: string
// ) => {
//   const { interval, symbol, symbolType, currency, alertEnabled, alertConfig, ledBrightness } = config;

//   if (!interval || !symbol || !symbolType || !currency) return publishData(deviceMac, JSON.stringify(NO_CONFIG_MSG));

//   //const tickerConfig = { symbol, interval, symbolType, currency, alertEnabled, alertConfig };

//   const queryObject = { symbol, currency, symbolType };
//   const configObject = {
//     isPlaylist: false,
//     type: UPDATE_OR_NEW,
//     ...config,
//     ledBrightness: ledBrightness ?? 100,
//     alertEnabled: alertEnabled || false,
//     alertConfig: config.alertEnabled ? config.alertConfig : undefined,
//   };

//   publishDataToDevice(deviceMac, queryObject, configObject, timeZone);
// };

// //** Function to publish the data to device */
// const publishDataToDevice = async (deviceMac: string, queryObject: IQueryObject, configObject: any, timeZone) => {
//   const gainTracking = {
//     enabled: configObject?.gainTrackingEnabled || false,
//     purchasePrice: configObject?.purchasePrice || -1,
//   };

//   const { success: success2, data: quote } =
//     queryObject.symbolType === 1
//       ? await getStockQuoteFromAPI(queryObject.symbol, gainTracking, timeZone)
//       : queryObject.symbolType === 2
//       ? await getCryptoQuoteFromAPI(queryObject.symbol, timeZone, queryObject.currency, gainTracking)
//       : { success: false, data: null };

//   if (!success2)
//     return publishData(
//       deviceMac,
//       JSON.stringify({ type: MSG_TYPES.STOCK_ERROR, success: false, message: "Unable to get the stocks quote." })
//     );

//   const dataForDevice = { ...quote, ...configObject, gainTrackingEnabled: undefined, purchasePrice: undefined };

//   publishData(deviceMac, JSON.stringify(dataForDevice));

//   if (configObject?.alertEnabled) {
//     checkAlert(configObject.alertConfig, quote.p, deviceMac);
//   }
// };

// const checkAlert = async (alertConfig, price, deviceMac) => {
//   const { triggerType, triggerValue } = alertConfig;

//   const raiseAlert =
//     triggerType.toLowerCase() === "less than" && parseFloat(price) < triggerValue
//       ? true
//       : triggerType.toLowerCase() === "greater than" && parseFloat(price) > triggerValue
//       ? true
//       : false;

//   const dataForAlert = raiseAlert
//     ? {
//         type: MSG_TYPES.ALERT_ENABLE,
//         ...alertConfig,
//         triggerType: undefined,
//         triggerValue: undefined,
//       }
//     : { type: MSG_TYPES.ALERT_DISABLE };

//   publishData(`${ALERT_TOPIC}/${deviceMac}`, JSON.stringify(dataForAlert));
// };

// /****************************************** */

// /**
//  * Get led brightness from device on the basis of night mode settings
//  * @param deviceData
//  * @param timeZone
//  * @returns ledbrightness value
//  */
// const GetLEDBrightness = (deviceData: IDeviceWithUser, timeZone: string) => {
//   const nightModeEnabled = deviceData.nightMode || false;

//   if (nightModeEnabled) {
//     //convert time to UTC time
//     const startTimeNM = DateTime.fromFormat(`${deviceData.nightModeStart} ${timeZone}`, "HH:mm z")
//       .setZone("UTC")
//       .toFormat("HH:mm");
//     const endTimeNM = DateTime.fromFormat(`${deviceData.nightModeEnd} ${timeZone}`, "HH:mm z")
//       .setZone("UTC")
//       .toFormat("HH:mm");

//     //format to 24 hour format
//     const nightModeStartDateTime = DateTime.fromFormat(startTimeNM, "HH:mm");
//     let nightModeEndDateTime = DateTime.fromFormat(endTimeNM, "HH:mm");

//     //const now = DateTime.now().setZone(timeZone);
//     const now = DateTime.now();

//     //check if end time is less than start time then add 1 day to end time
//     if (nightModeEndDateTime < nightModeStartDateTime) {
//       nightModeEndDateTime = nightModeEndDateTime.plus({ days: 1 });
//     }

//     //check if night mode is bwtween start and end time

//     if (now > nightModeStartDateTime && now < nightModeEndDateTime) {
//       console.log("====> Night Mode Enabled", {
//         device: deviceData.macAddress,
//         currentTime: now.toFormat("HH:mm z"),
//         nightModeStart: deviceData.nightModeStart,
//         nightModeEnd: deviceData.nightModeEnd,
//         nightModeStartUTC: startTimeNM,
//         nightModeEndUTC: endTimeNM,
//       });

//       return 0;
//     }
//   }
//   return deviceData.isPlaylist ? deviceData.playlist?.ledBrightness ?? 100 : deviceData.config?.ledBrightness ?? 100;
// };
