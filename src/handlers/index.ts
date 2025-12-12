import { subscribe, publishData, onSubscriptionData, unsubscribeTopic } from "../services/mqtt";

import { MSG_TYPES } from "../constants";

import { getDeviceStocks } from "./quotes";
import { onDeviceStatusRecieved } from "./deviceConfig";

const ON_DEVICE_START = "TICKRMETERBOOT";
const MAIN_TOPIC = "STOCKPRICEUPDATE";
const DEVICE_STATUS_TOPIC = "DEVICESTATUS";
const DEVICE_STATUS_RES_TOPIC = "DEVICESTATUS_RES";

export const subscribeToTopics = () => {
  unsubscribeTopic(ON_DEVICE_START);
  subscribe(ON_DEVICE_START);
  unsubscribeTopic(MAIN_TOPIC);
  subscribe(MAIN_TOPIC);
  unsubscribeTopic(DEVICE_STATUS_RES_TOPIC);
  subscribe(DEVICE_STATUS_RES_TOPIC);
  onSubscriptionData(onDataReceive);
};

// ** MQTT Call back when data is received */
export const onDataReceive = async (topic: string, payload: string) => {
  try {
    const message = JSON.parse(payload);

    if (topic === DEVICE_STATUS_RES_TOPIC) return onDeviceStatusRecieved(message);

    const { device, type, symbol } = message;

    if (device) {
      switch (type) {
        case MSG_TYPES.BOOT:
          publishData("DEVICE_BOOTED", payload);
          return;
        //return await getDeviceConfig(device);
        case MSG_TYPES.UPDATE:
          return await getDeviceStocks(device, MSG_TYPES.UPDATE, symbol);

        default:
          return publishData(
            device,
            JSON.stringify({ type: MSG_TYPES.INVALID_FORMAT, success: false, message: "Invalid format" })
          );
      }
    }
  } catch (error) {
    console.error("publishDeviceStock-> might be parsing error for invalid json", payload.toString(), error);
  }
};

export const askForDeviceStatus = () => {
  publishData(DEVICE_STATUS_TOPIC, JSON.stringify({ action: "status" }));
};