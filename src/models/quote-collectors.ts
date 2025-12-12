import { ObjectId } from "bson";

import conf from "../conf";

import nativeClient from "./native-client";

interface IQuoteSymbol {
  market: string;
  stream: string;
  symbol: string;
  currency: string;
}
class QuoteCollectors {
  // collection: Collection<any>;
  // db: Db;
  // client: MongoClient;
  collectionName = "quotecollectors";

  constructor() {
    // this.connect();
  }

  collection() {
    return nativeClient.db(conf.database.dbname).collection(this.collectionName);
  }

  async update(query: any, data: any) {
    try {
      const d = await this.collection().updateOne(query || { _id: new ObjectId(data._id) }, { $set: data });
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

  async get(data: any, projection?: any) {
    try {
      //get data from db
      const d = await this.collection().find(data, projection).toArray();

      return { success: true, data: d };
    } catch (err) {
      return { success: false, error: err };
    }
  }

  async getForAPICalls(data: any) {
    try {
      //get data from db
      const d = await this.collection()
        .find(data, { projection: { _id: 0, symbol: 1, currency: 1 } })
        .toArray();

      return { success: true, data: d as unknown as IQuoteSymbol[] };
    } catch (err) {
      return { success: false, error: err };
    }
  }
}

export default QuoteCollectors;
