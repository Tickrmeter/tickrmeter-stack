import { ObjectId } from "bson";
import { Collection, Db, MongoClient, ObjectId as MongoObjectId } from "mongodb";
import { IDevice, IDevicePage, IDeviceWithUser } from "./interfaces";
import { DateTime } from "luxon";
import conf from "../conf";

import nativeClient from "./native-client";

class NativeDevicePages {
  // collection: Collection<any>;
  // db: Db;
  // client: MongoClient;
  collectionName = "devicepages";

  constructor() {
    // this.connect();
  }

  collection() {
    return nativeClient.db(conf.database.dbname).collection(this.collectionName);
  }

  //create device
  async getAll() {
    try {
      const devicePages = await this.collection().find().toArray();
      return { success: true, data: devicePages };
    } catch (ex) {
      return { success: false, error: ex };
    }
  }

  async getOne(query) {
    try {
      const devicePages = (await this.collection().findOne(query)) as unknown as IDevicePage;
      return { success: true, data: devicePages };
    } catch (ex) {
      console.error("DevicePage.getOne", ex);
      return { success: false, error: ex, data: null as null };
    }
  }

  async getLastPageId() {
    try {
      const devicePages = await this.collection().find().sort({ createdAt: -1 }).limit(1).toArray();

      const devicePage = devicePages.length > 0 ? devicePages[0] : null;

      if (devicePage) {
        return { success: true, error: null, data: devicePage.pageId };
      } else {
        return { success: true, error: null, data: 0 };
      }
    } catch (error) {
      console.error(error);
      return { success: false, error: error, data: -1 };
    }
  }

  async add(data: IDevicePage) {
    try {
      const d = await this.collection().insertOne(data);

      console.log(d);

      const newDoc = (await this.collection().findOne({ _id: d.insertedId })) as unknown as IDevicePage;

      return { success: true, data: newDoc };
    } catch (ex) {
      console.error(ex);
      return { success: false, error: ex };
    }
  }

  async update(data: any) {
    try {
      const updatedDevicePage = await this.collection().findOneAndUpdate({ _id: data._id }, { $set: data });

      if (!updatedDevicePage.ok) console.error("Update device page failed", updatedDevicePage, data);
      const updatedDoc = (await this.collection().findOne({ _id: data._id })) as unknown as IDevicePage;

      return { success: true, data: updatedDoc };
    } catch (ex) {
      return { success: false, error: ex };
    }
  }

  // async delete(id: string) {
  //   try {
  //     const deletedDevicePage = await this.DevicePagesModel.findOneAndDelete({ _id: id }).lean();
  //     return { success: true, data: deletedDevicePage };
  //   } catch (ex) {
  //     return { success: false, error: ex };
  //   }
  // }

  async getById(_id: string) {
    try {
      const devicePage = await this.collection().findOne({ _id: new MongoObjectId(_id) });

      if (devicePage) {
        return { success: true, data: devicePage };
      } else {
        return { success: false, error: "Device page not found" };
      }
    } catch (ex) {
      return { success: false, error: ex };
    }
  }
}

export default NativeDevicePages;
