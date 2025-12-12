import { IDevice } from "../../models/interfaces";
import DeviceModel from "../../models/device";
import { GetHumbl3Data } from "../quotes/humbl3";




export const PushHumbl3Data = async (params) => {
  const { success, data: quote, error } = await GetHumbl3Data(params);

  console.log({ success, quote, error });
  if (!success) return { success: false, dataForDevice: null };

  //const { data: quote } = await ProcessPagesForElectricityPrices(data);

  console.log("quote", quote);

  const { macAddress, pushObject } = params.deviceData;

  let ledColor = quote.ledColor;
  let blink = false;
  let raiseAlert = false;
  // if (pushObject.alertEnabled) {
  //   const alertData = CheckElectricityAlert(pushObject.alertConfig, quote.price);

  //   ledColor = alertData?.ledColor;
  //   blink = alertData?.blink;
  //   raiseAlert = alertData ? true : false;
  // }

  if (success) {
    const dataForDevice = {
      ...pushObject,
      mode: "page",
      page: [{ id: quote.pageId, ledColor, blink, rev: quote.rev, alert: raiseAlert }],
      updateInterval: pushObject.interval,
      ttl: quote.ttl,
      alertEnabled: undefined,
      alertConfig: undefined,
      gainTrackingEnabled: undefined,
      purchasePrice: undefined,
      stream: undefined,
      market: undefined,
      symbolType: undefined,
      isPlaylist: undefined,
      interval: undefined,
      deviceId: undefined,
    };

    console.log("d", JSON.parse(JSON.stringify(dataForDevice)));

    const pageConfig: IDevice["pageConfig"] = [
      {
        pageId: quote.pageId,
        ledColor: quote.color,
      },
    ];

    //update pageConfig in the device
    const { success: s4 } = await DeviceModel.updatePageInfo(macAddress, pageConfig);

    if (s4) {
      //publishData(macAddress, JSON.stringify(dataForDevice));
      return { success: true, dataForDevice };
    }
    return { success: false, dataForDevice: null };
  } else {
    return { success: false, dataForDevice: null };
  }
};
