import { ObjectId } from "bson";
import { Collection, Db, MongoClient, ObjectId as MongoObjectId } from "mongodb";
import { IDevice, IDeviceWithUser } from "./interfaces";
import { DateTime } from "luxon";
import conf from "../conf";

import nativeClient from "./native-client";

class ClosingQuotes {
  // collection: Collection<any>;
  // db: Db;
  // client: MongoClient;
  collectionName = "closingquotes";

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

  async getOne(data: any) {
    try {
      const d = await this.collection().findOne(data);
      return { success: true, data: d };
    } catch (err) {
      return { success: false, error: err };
    }
  }
}

export default ClosingQuotes;
