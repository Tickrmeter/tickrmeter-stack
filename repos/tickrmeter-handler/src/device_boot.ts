import { DateTime } from "luxon";
import moment from "moment";
import { MSG_TYPES } from "./constants";
import { getDeviceStocks } from "./handlers/quotes";
import NativeDevices from "./models/device-native";
import { IDevice } from "./models/interfaces";

import { subscribe, publishData, onSubscriptionData, unsubscribeTopic, connectMQTT } from "./services/mqtt";
// import DeviceModel from "../models/device";
// import { IDevice } from "../models/interfaces";
// import { MSG_TYPES } from "../constants";

// import { getDeviceStocks } from "./quotes";
// import { onDeviceStatusRecieved } from "./deviceConfig";

// import NativeDevices from "./models/device-native";

const DEVICE_BOOTED = "DEVICE_BOOTED";
// const MAIN_TOPIC = "STOCKPRICEUPDATE";
// const DEVICE_STATUS_TOPIC = "DEVICESTATUS";
// const DEVICE_STATUS_RES_TOPIC = "DEVICESTATUS_RES";

export const subscribeToTopics = () => {
  unsubscribeTopic(DEVICE_BOOTED);
  subscribe(DEVICE_BOOTED);
  onSubscriptionData(onBootDataReceive);
};

const onBootDataReceive = async (topic: string, payload: string) => {
  const message = JSON.parse(payload);
  const { device, type, symbol } = message;
  console.log("DATA RECIEVED ON BOOT===>", { topic, device, type, symbol });
  if (device && type === MSG_TYPES.BOOT) return getDeviceConfig(device, message);
  //if (topic === DEVICE_STATUS_RES_TOPIC) return onDeviceStatusRecieved(message);
};

const getDeviceConfig = async (deviceMac: string, message: any) => {
  console.log("getDeviceConfig", deviceMac);
  // ** Get Device Details
  let nativeDevice = new NativeDevices();
  try {
    //const device = await DeviceModel.getByMacAddress(deviceMac);
    const device = await nativeDevice.getByMacAddress(deviceMac);
    //nativeDevice = null;

    // ** Check if device exists
    if (!device.success || device.error === "Device Not Found") {
      console.log("create a new device");

      const newDevice: IDevice = {
        macAddress: deviceMac,
        isActive: true,
        batteryStatus: message?.battery || 100,
        lastStatusOn: DateTime.now(),
        registration: {
          key: randomNo(),
          valid: DateTime.local().plus({ minutes: 10 }).toJSDate(),
        },
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
        firmwareVersion: message?.firmware_version || null,
        mode: "text",
      };

      const res = await nativeDevice.add(newDevice);

      //const res = await DeviceModel.add(newDevice);

      const data = res.success
        ? { type: "DEVICE_REG", ...newDevice.registration, success: true, message: "ADDED_SUCCESSFULLY" }
        : { type: "DEVICE_REG_FAILURE", success: false, message: "Error creating device." };

      publishData(deviceMac, JSON.stringify(data));
    } else {
      if (device?.data?.user) {
        console.log("Get Device Stocks");
        getDeviceStocks(deviceMac, MSG_TYPES.NEW);
      } else {
        console.log("Generate Random 5 digit code and send on MQTT");
        const registration = {
          key: randomNo(),
          valid: DateTime.local().plus({ minutes: 10 }).toJSDate(),
        };

        const deviceToUpdate = {
          ...device.data,
          registration,
        };

        await nativeDevice.update(deviceToUpdate);

        const data = { type: "DEVICE_REG", ...registration, message: "UNASSIGNED_DEVICE" };
        publishData(deviceMac, JSON.stringify(data));
      }
    }
  } catch (error) {
    console.error("Error in getDeviceConfig on boot", error);
  } finally {
    nativeDevice = null;
  }
};

const randomNo = () => (Math.floor(Math.random() * 90000) + 10000).toString();

connectMQTT(() => console.log("MQTT Connected"));
subscribeToTopics();
