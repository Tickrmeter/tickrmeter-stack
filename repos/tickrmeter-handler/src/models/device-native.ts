import { ObjectId } from "bson";
import { Collection, Db, MongoClient, ObjectId as MongoObjectId } from "mongodb";
import { IDevice, IDeviceWithUser } from "./interfaces";
import { DateTime } from "luxon";
import conf from "../conf";

import nativeClient from "./native-client";

class NativeDevices {
  // collection: Collection<any>;
  // db: Db;
  // client: MongoClient;
  collectionName = "devices";

  constructor() {
    // this.connect();
  }

  collection() {
    return nativeClient.db(conf.database.dbname).collection(this.collectionName);
  }

  //create device
  async add(data: IDevice) {
    try {
      const result = await this.collection().insertOne(data as any);
      return { success: true, data: result };
    } catch (err) {
      console.error(err);
      return { success: false, error: err };
    }
  }

  async update(data: any) {
    try {
      const d = await this.collection().updateOne({ _id: new ObjectId(data._id) }, { $set: data });
      return { success: true, data: d.modifiedCount };
    } catch (err) {
      return { success: false, error: err };
    }
  }

  async updatePageInfo(macAddress: string, pageConfig: IDevice["pageConfig"]) {
    try {
      const res = await this.collection().updateOne({ macAddress: macAddress }, { $set: { pageConfig } });

      if (res.acknowledged) return { success: true, data: res };
      else return { success: false, error: "Unable to update page info " + macAddress };
    } catch (error) {
      console.error("Update Page Info", error);
      return { success: false, error };
    }
  }

  async getByMacAddress(macAddress: string) {
    try {
      if (!macAddress) return { success: false, error: "Device not found" };

      const pipeline = [
        { $match: { macAddress } },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            name: 1,
            macAddress: 1,
            userId: 1,
            isActive: 1,
            registration: 1,
            isPlaylist: 1,
            config: 1,
            playlist: 1,
            playlistId: 1,
            lastStatusOn: 1,
            batteryStatus: 1,
            firmwareVersion: 1,
            nightMode: 1,
            nightModeStart: 1,
            nightModeEnd: 1,
            extras: 1,
            user: { _id: 1, name: 1, email: 1, timeZone: 1, timeFormat: 1 },
          },
        },
      ];

      const device = await this.collection().aggregate(pipeline).toArray();

      if (device.length > 0) {
        return { success: true, data: device[0] as IDeviceWithUser };
      } else {
        return { success: false, error: "Device not found" };
      }
    } catch (ex) {
      console.error(ex);
      return { success: false, error: ex };
    }
  }

  async updateDeviceStatus(macAddress: string, updateObj: { battery: number; firmware_version: string }) {
    try {
      if (!macAddress) return { success: false, error: "Device not found" };

      const { battery, firmware_version } = updateObj;

      const res = await this.collection().updateOne(
        { macAddress },
        {
          $set: {
            lastStatusOn: DateTime.now().toJSDate(),
            batteryStatus: battery,
            firmwareVersion: firmware_version,
          },
        }
      );

      if (res.modifiedCount === 0) {
        return { success: false, error: "Device not found" };
      }

      return { success: true };
    } catch (error) {
      console.error(error);
      return { success: false, error };
    }
  }
}

export default NativeDevices;
