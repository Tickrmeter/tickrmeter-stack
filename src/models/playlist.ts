import { Model, model, Schema } from "mongoose";
import { IDevice, IPlaylist } from "./interfaces";
import moment from "moment";
import DeviceModel from "./device";

class Playlists {
  PlaylistModel: Model<any>;

  constructor() {
    this.PlaylistModel = model("playlist", this.getPlaylistSchema());
  }

  getPlaylistSchema() {
    return new Schema(
      {
        name: String,
        cycleInterval: String,
        updateInterval: String,
        cycleMode: { type: String, default: "default" }, //default, random, best, worst
        isCalculateOnDaily: { type: Boolean, default: false },
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
            order: Number,
            extraConfig: { type: Object, default: {} },
          },
        ],
        userId: { type: Schema.Types.ObjectId, ref: "user" },
      },
      { timestamps: true }
    );
  }

  async getUserPlaylists(userId: string) {
    try {
      const playlists = await this.PlaylistModel.find({ userId }).sort({ createdAt: -1 }).lean();
      const { success: sd, data: devices } = await DeviceModel.getUserDevicesByUserId(userId);

      const _playlists = playlists.map((playlist: any) => ({
        ...playlist,
        assignedTo: sd
          ? devices
              .filter((ud) => ud.playlistId && ud.playlistId.toString() === playlist._id.toString())
              .map((ud) => ud.name)
          : [],
      }));

      return { success: true, data: _playlists };
    } catch (error) {
      return { success: false, error, data: [] };
    }
  }

  async add(data: IPlaylist) {
    try {
      const d = await this.PlaylistModel.create(data);
      return { success: true, data: d };
    } catch (err) {
      console.error("saving playlist", err);
      return { success: false, error: err };
    }
  }

  async getById(_id: string) {
    try {
      if (!_id) return { success: false, error: "Device not found" };
      const playlist: IPlaylist = await this.PlaylistModel.findById(_id.toString()).lean();
      if (playlist) {
        return { success: true, data: playlist };
      } else {
        return { success: false, error: "Device not found" };
      }
    } catch (ex) {
      console.error(ex);
      return { success: false, error: "Invalid Device or Device not found" };
    }
  }

  async update(data: any) {
    try {
      const d = await this.PlaylistModel.updateOne({ _id: data._id }, data);
      return { success: true, data: d };
    } catch (err) {
      return { success: false, error: err };
    }
  }

  async delete(id: string) {
    try {
      await this.PlaylistModel.deleteOne({ _id: id });
      return { success: true, data: null };
    } catch (error) {
      return { success: false, error };
    }
  }

  /********************************************************************************************* */
  async getAll(query: any = {}) {
    try {
      const playlists = await this.PlaylistModel.find(query).lean();
      return { success: true, data: playlists };
    } catch (error) {
      return { success: false, error, data: [] };
    }
  }

  async getPlaylists(query: any = {}) {
    try {
      const playlist = await this.PlaylistModel.findOne(query).lean();
      if (playlist) {
        return { success: true, data: playlist as IPlaylist };
      } else {
        return { success: false, error: "Playlist not found" };
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

  getBatteryLevel(batteryLevel: number) {
    if (batteryLevel >= 90) return 4;
    if (batteryLevel >= 65) return 3;
    if (batteryLevel >= 40) return 2;
    if (batteryLevel >= 10) return 1;
    if (batteryLevel >= 0) return 0;
    return -1;
  }

  async getUserDevicesByUserId(_id: string) {
    try {
      if (!_id) return { success: false, error: "Device not found" };
      const devices = await this.PlaylistModel.find({ userId: _id.toString() }).lean();
      if (devices) {
        return { success: true, data: devices };
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
      const device = await this.PlaylistModel.findOne({ macAddress })
        .populate("userId", "_id name email timeZone")
        .lean();
      if (device) {
        return { success: true, data: device };
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

      const res = await this.PlaylistModel.updateOne(
        { macAddress },
        { $set: { lastStatusOn: moment(), batteryStatus: battery, firmwareVersion: firmware_version } }
      );
      return { success: true, data: res };
    } catch (error) {
      console.error(error);
      return { success: false, error };
    }
  }

  async deleteUserPlaylists(userId: string) {
    try {
      const res = await this.PlaylistModel.deleteMany({ userId });
      return { success: true, data: res };
    } catch (error) {
      console.error("error deleteing Playlist", error);
    }
  }
}

export default new Playlists();
