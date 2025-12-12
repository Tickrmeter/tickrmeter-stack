import { Model, model, Schema } from "mongoose";
import { IDevice, IDeviceWithUser, IPlaylistConfig, ISingleConfig } from "./interfaces";
import moment from "moment";
import FirmwareModel from "./firmware";
import { DATA_STREAM, SYMBOL_TYPE } from "../constants";

class Devices {
  DeviceModel: Model<any>;

  constructor() {
    this.DeviceModel = model("device", this.getDeviceSchema());
  }

  getDeviceSchema() {
    return new Schema(
      {
        name: String,
        macAddress: { type: String, unique: true },
        userId: { type: Schema.Types.ObjectId, ref: "user" },
        isActive: { type: Boolean, default: true },
        registration: {
          key: { type: String, default: "" },
          valid: { type: Date },
        },
        isPlaylist: Boolean,
        mode: { type: String, default: "text" }, //default, page
        pageConfig: [
          {
            pageId: { type: Number, required: true },
            ledColor: { type: String, default: "black" },
          },
        ],
        // Single Ticker
        config: {
          stream: String,
          market: String,
          symbol: String,
          symbolUI: String,
          interval: String,
          symbolType: Number,
          currency: String,
          gainTrackingEnabled: Boolean,
          purchasePrice: Number,
          noOfStocks: Number,
          showFullAssetValue: Boolean,
          isShortSell: Boolean,
          multiplier: Number,
          multiplierEnabled: Boolean,
          extraConfig: { type: Object, default: {} },
          ledBrightness: { type: Number, default: 100 }, //0,80,100
          alertEnabled: { type: Boolean },
          alertConfig: {
            triggerType: String,
            triggerValue: Number,
            flashLightbar: { type: Boolean },
            flashLightbarDur: String,
            playSound: { type: Boolean },
            soundType: String,
            soundDur: String,
            changeLightBarColor: { type: Boolean },
            lightBarColor: String,
          },
          alertConfigArr: [
            {
              triggerType: String,
              triggerValue: Number,
              flashLightbar: Boolean,
              flashLightbarDur: String,
              playSound: Boolean,
              soundType: String,
              soundDur: String,
              changeLightBarColor: Boolean,
              lightBarColor: String,
            },
          ],
        },
        // Multiple Ticker
        playlist: {
          name: String,
          cycleInterval: String,
          updateInterval: String,
          cycleMode: { type: String, default: "default" }, //random, sequential, best, worst
          ledBrightness: { type: Number, default: 100 }, //0,80,100
          symbols: [
            {
              stream: String,
              market: String,
              name: String,
              symbol: String,
              symbolType: Number,
              currency: String,
              gainTrackingEnabled: Boolean,
              purchasePrice: Number,
              noOfStocks: Number,
              showFullAssetValue: Boolean,
              isShortSell: Boolean,
              multiplier: Number,
              multiplierEnabled: Boolean,
              extraConfig: { type: Object, default: {} },
            },
          ],
        },

        playlistId: { type: Schema.Types.ObjectId, ref: "playlist" },
        lastStatusOn: { type: Date, default: Date.now },
        batteryStatus: { type: Number, default: 0 },
        firmwareVersion: { type: String, default: "" },
        nightMode: { type: Boolean, default: false },
        nightModeStart: { type: String, default: "22:00" },
        nightModeEnd: { type: String, default: "06:00" },
        extras: { type: Object, default: {} },
      },
      { timestamps: true }
    );
  }

  async getAll(query: any = {}) {
    try {
      const devices = await this.DeviceModel.find(query).lean();
      return { success: true, data: devices };
    } catch (error) {
      return { success: false, error, data: [] };
    }
  }

  async getDevice(query: any = {}) {
    try {
      const device = await this.DeviceModel.findOne(query).lean();
      if (device) {
        return { success: true, data: device as IDevice };
      } else {
        return { success: false, error: "Device not found" };
      }
    } catch (error) {
      return { success: false, error, data: null };
    }
  }

  formatInterval(interval: number): string {
    if (!interval) return "";

    if (interval > 3559) return `${Math.round(interval / 60 / 60)} hour(s)`;
    else if (interval > 59 && interval < 3559) return `${interval / 60} min(s)`;
    else if (interval < 59) return `${interval} sec(s)`;
    else return "";
  }

  //so 7% or under is 0 lvl, 7-10 is 1 lvl 10-17 2 lvl 17-25 3 lvl 25 - 100 4 lvl
  getBatteryLevel(batteryLevel: number) {
    if (batteryLevel <= 7) return 0;
    else if (batteryLevel > 7 && batteryLevel <= 10) return 1;
    else if (batteryLevel > 10 && batteryLevel <= 17) return 2;
    else if (batteryLevel > 17 && batteryLevel <= 35) return 3;
    else if (batteryLevel > 35) return 4;
  }

  async getAllDevicesWithUser(query) {
    try {
      //get latset uploaded firmware
      const randomString = Math.random().toString(36).substring(7);

      //console.time(`getAllDevicesWithUser-${randomString}`);
      const { data: latestFirmware } = await FirmwareModel.getLatestFirmware();

      let devices = await this.DeviceModel.find(query).populate("userId").lean();

      devices = devices.map((d: any) => {
        const isOnline = d.lastStatusOn ? moment().diff(d.lastStatusOn, "seconds") < 1200 : null;

        const firmwareDetails =
          !latestFirmware || !isOnline || d.firmwareVersion === latestFirmware.version ? null : latestFirmware;

        const device: any = {
          _id: d._id,
          name: d.name,
          user: d.userId ? { _id: d.userId._id, name: d.userId.name } : "",
          macAddress: d.macAddress,
          createdAt: moment(d.createdAt).format("DD-MMM-YYYY HH:mm:ss"),
          isActive: d.isActive,
          isPlaylist: d.isPlaylist || false,
          batteryStatus: this.getBatteryLevel(d.batteryStatus || -1),
          firmwareVersion: d.firmwareVersion || "",
          lastStatusOn: d.lastStatusOn ? moment(d.lastStatusOn).fromNow() : "",
          symbolType: d.isPlaylist ? undefined : d.config?.symbolType,
          isOnline,
          firmwareDetails,
        };

        if (d.isPlaylist) {
          //console.log("playlist return");
          //console.timeLog(`getAllDevicesWithUser-${randomString}`);
          return {
            ...device,
            symbol: d.playlist.name,
            interval: this.formatInterval(parseInt(d.playlist?.cycleInterval?.toString(), 10)),
            playlistSymbols:
              d.playlist.symbols?.map((s: any) => ({
                name: s.symbolType === SYMBOL_TYPE.MUSIC_CREATORS ? s?.extraConfig?.displayLabel ?? "" : s.name,
                symbol: s.symbolType === 2 ? `${s.symbol}-${s.currency}` : s.symbol,
              })) || [],
            alertEnabled: false,
            alertConfig: null,
          };
        } else {
          //console.log("else return");
          //console.timeLog(`getAllDevicesWithUser-${randomString}`);
          const _symbol =
            d.config?.symbolType === 2 ? `${d.config?.symbol}-${d.config?.currency}` : d.config?.symbol || "";

          return {
            ...device,
            symbol: _symbol,
            symbolUI:
              d.config?.symbolType === 2 && d.config.stream === DATA_STREAM.TRADINGVIEW
                ? d.config?.symbol
                : d.config?.symbolType === 2 && d.config.stream === DATA_STREAM.TRADINGVIEW
                ? `${d.config?.symbolUI || d.config?.symbol}-${d.config?.currency}`
                : d.config?.symbolType === 3
                ? `${d.config?.symbol}/${d.config?.currency}`
                : d.config?.symbolType === 8 && d.config?.extraConfig?.addressValue
                ? `⚡ ${d.config?.extraConfig?.addressValue}`
                : d.config?.symbolUI || _symbol,
            interval: this.formatInterval(parseInt(d.config?.interval?.toString(), 10)),
            alertEnabled: d.config?.alertEnabled,
            alertConfig: d.config?.alertEnabled ? d.config?.alertConfig : null,
          };
        }
      });

      //console.timeEnd(`getAllDevicesWithUser-${randomString}`);
      return { success: true, data: devices };
    } catch (error) {
      console.error(error);
      return { success: false, error, data: [] };
    }
  }

  async getAllDevicesWithUserPaging(query, pageNo: number, limit: number, sort: string) {
    try {
      //get latset uploaded firmware

      const { data: latestFirmware } = await FirmwareModel.getLatestFirmware();

      // const sortObj = sort
      //   ? sort.split(":")[1] === "desc"
      //     ? `-${sort.split(":")[0]}`
      //     : sort.split(":")[1]
      //   : "-createdAt";

      // let sortObj = "-createdAt";
      // if (sort) {
      //   const [field, order] = sort.split(":");
      //   console.log("field", field, "order", order)

      // if (order === "desc") {
      //   sortObj = `-${field}`;
      // } else {
      //   sortObj = field;
      // }
      // }

      let q =
        query && query !== ""
          ? { $or: [{ macAddress: { $regex: query, $options: "i" } }, { name: { $regex: query, $options: "i" } }] }
          : {};

      console.log({ query, q });

      let sortObj: { [key: string]: 1 | -1 } = { createdAt: -1 };
      if (sort) {
        const [field, order] = sort.split(":");
        console.log("field", field, "order", order);

        if (order === "desc") {
          sortObj = { [field]: -1 };
        } else {
          sortObj = { [field]: 1 };
        }
      }

      console.log("sortObj", sort, sortObj);

      console.log(q, typeof q);

      let devices = await this.DeviceModel.find(q)
        .populate("userId")
        .sort(sortObj)
        .skip((pageNo - 1) * limit)
        .limit(limit)
        .lean();

      devices = devices.map((d: any) => {
        const isOnline = d.lastStatusOn ? moment().diff(d.lastStatusOn, "seconds") < 300 : null;

        const firmwareDetails =
          !latestFirmware || !isOnline || d.firmwareVersion === latestFirmware.version ? null : latestFirmware;

        const device: any = {
          _id: d._id,
          name: d.name,
          user: d.userId ? { _id: d.userId._id, name: d.userId.name } : "",
          macAddress: d.macAddress,
          createdAt: d.createdAt ? moment(d.createdAt).format("DD-MMM-YYYY HH:mm:ss") : "",
          isActive: d.isActive,
          isPlaylist: d.isPlaylist || false,
          batteryStatus: this.getBatteryLevel(d.batteryStatus || -1),
          firmwareVersion: d.firmwareVersion || "",
          lastStatusOn: d.lastStatusOn ? moment(d.lastStatusOn).fromNow() : "",
          isOnline,
          firmwareDetails,
        };

        if (d.isPlaylist) {
          return {
            ...device,
            symbol: d.playlist.name,
            interval: this.formatInterval(parseInt(d.playlist?.cycleInterval?.toString(), 10)),
            playlistSymbols: d.playlist.symbols.map((s: any) => ({
              name: s.name,
              symbol: s.symbolType === 2 ? `${s.symbol}-${s.currency}` : s.symbol,
            })),
            alertEnabled: false,
            alertConfig: null,
          };
        } else {
          return {
            ...device,
            symbol: d.config?.symbolType === 2 ? `${d.config?.symbol}-${d.config?.currency}` : d.config?.symbol || "",
            interval: this.formatInterval(parseInt(d.config?.interval?.toString(), 10)),
            alertEnabled: d.config?.alertEnabled,
            alertConfig: d.config?.alertEnabled ? d.config?.alertConfig : null,
          };
        }
      });

      const total = await this.DeviceModel.countDocuments(q);

      const data = {
        p: pageNo,
        t: total,
        tp: Math.ceil(total / limit),
        ps: limit,
        d: devices,
      };

      return { success: true, data };
    } catch (error) {
      console.error(error);
      return { success: false, error, data: [] };
    }
  }

  async add(data: IDevice) {
    try {
      const d = await this.DeviceModel.create(data);
      return { success: true, data: d };
    } catch (err) {
      return { success: false, error: err };
    }
  }

  async updateTickerSymbol(
    deviceId: string,
    tickerConfig: ISingleConfig | IPlaylistConfig,
    isPlaylist: boolean,
    playlistId: string,
    extras: any,
    mode = "text"
  ) {
    try {
      const { success: success2, data: device, error } = await this.getById(deviceId);
      if (!success2) throw new Error(error);

      if (!success2) {
        console.error("Device not found", error);
        return { success2, error };
      }
      //console.log(tickerConfig);

      const config = isPlaylist ? {} : tickerConfig;
      //const playlist = isPlaylist ?  tick: {};

      const playlist = isPlaylist ? tickerConfig : {};

      // const playlist = isPlaylist
      //   ? {
      //       ...tickerConfig,
      //       symbols: (tickerConfig as IPlaylistConfig).symbols.map((s: any) => ({
      //         ...s,
      //         symbol: s.stream === DATA_STREAM.COINGECKO ? s.name : s.symbol,
      //         name: s.stream === DATA_STREAM.COINGECKO ? s.symbol : s.name,
      //       })),
      //     }
      //   : {};

      const res = await this.DeviceModel.updateOne(
        { _id: deviceId },
        { $set: { mode, isPlaylist, config, playlist, playlistId, extras } }
      );

      return { success: true, data: res, macAddress: device.macAddress };
    } catch (error) {
      console.error(error);
      return { success: false, error };
    }
  }

  async updatePageInfo(macAddress: string, pageConfig: IDevice["pageConfig"]) {
    try {
      const res = await this.DeviceModel.updateOne({ macAddress: macAddress }, { $set: { pageConfig } });

      if (res.acknowledged) return { success: true, data: res };
      else return { success: false, error: "Unable to update page info " + macAddress };
    } catch (error) {
      console.error("Update Page Info", error);
      return { success: false, error };
    }
  }

  async updateConfig(id: string, config: IDevice["config"]) {
    try {
      //console.log(config);
      const res = await this.DeviceModel.updateOne({ _id: id }, { $set: { isPlaylist: false, config, playlist: {} } });

      return { success: true, data: res };
    } catch (error) {
      console.error(error);
      return { success: false, error };
    }
  }

  async update(data: any) {
    try {
      const d = await this.DeviceModel.updateOne({ _id: data._id }, data);
      return { success: true, data: d };
    } catch (err) {
      return { success: false, error: err };
    }
  }

  async delete(id: string) {
    try {
      await this.DeviceModel.deleteOne({ _id: id });
      return { success: true, data: null };
    } catch (error) {
      return { success: false, error };
    }
  }

  async getById(_id: string) {
    try {
      if (!_id) return { success: false, error: "Device not found" };
      const device: IDevice = await this.DeviceModel.findById(_id.toString()).lean();
      if (device) {
        return { success: true, data: device };
      } else {
        return { success: false, error: "Device not found" };
      }
    } catch (ex) {
      console.error(ex);
      return { success: false, error: "Invalid Device or Device not found" };
    }
  }

  async getUserDevicesByUserId(_id: string) {
    try {
      if (!_id) return { success: false, error: "Device not found" };
      const devices = await this.DeviceModel.find({ userId: _id.toString() }).lean();
      if (devices) {
        return { success: true, data: devices as IDevice[] };
      } else {
        return { success: false, error: "Device not found" };
      }
    } catch (ex) {
      console.error(ex);
      return { success: false, error: "Invalid Device or Device not found" };
    }
  }

  async getByMacAddress(macAddress: string) {
    try {
      if (!macAddress) return { success: false, error: "Device not found" };
      const device = await this.DeviceModel.findOne({ macAddress })
        .populate("userId", "_id name email timeZone")
        .lean();

      if (device) {
        return { success: true, data: device as IDeviceWithUser };
      } else {
        return { success: false, error: "Device not found" };
      }
    } catch (ex) {
      return { success: false, error: ex };
    }
  }

  async updateDeviceStatus(macAddress: string, updateObj: { battery: number; firmware_version: string }) {
    try {
      if (!macAddress) return { success: false, error: "Device not found" };

      const { battery, firmware_version } = updateObj;

      const res = await this.DeviceModel.updateOne(
        { macAddress },
        { $set: { lastStatusOn: moment(), batteryStatus: battery, firmwareVersion: firmware_version } }
      );
      return { success: true, data: res };
    } catch (error) {
      console.error(error);
      return { success: false, error };
    }
  }

  async deleteUserDevices(userId: string) {
    try {
      const res = await this.DeviceModel.deleteMany({ userId });
      return { success: true, data: res };
    } catch (error) {
      console.error("error deleteing device", error);
    }
  }
}

export default new Devices();
