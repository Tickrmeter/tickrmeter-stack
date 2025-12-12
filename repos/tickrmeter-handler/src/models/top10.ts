import { ObjectId } from "bson";
import { Collection, Db, MongoClient, ObjectId as MongoObjectId } from "mongodb";
import { IDevice, IDeviceWithUser } from "./interfaces";
import { DateTime } from "luxon";
import conf from "../conf";

import nativeClient from "./native-client";

class NativeTop10 {
  // collection: Collection<any>;
  // db: Db;
  // client: MongoClient;
  collectionName = "top10";

  constructor() {
    // this.connect();
  }

  collection() {
    return nativeClient.db(conf.database.dbname).collection(this.collectionName);
  }

  async getBySymbol(symbol: string) {
    try {
      const result = await this.collection().findOne({ symbol });
      return { success: true, data: result };
    } catch (err) {
      console.error(err);
      return { success: false, error: err, data: null };
    }
  }
}

export default NativeTop10;
