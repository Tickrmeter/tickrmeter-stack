import { Model, model, Schema } from "mongoose";

import moment from "moment";
import FirmwareModel from "./firmware";
import { DATA_STREAM } from "../constants";

class ClosingQuote {
  ClosingQuote: Model<any>;

  constructor() {
    this.ClosingQuote = model("closingquote", this.getDeviceSchema());
  }

  getDeviceSchema() {
    return new Schema({
      stream: String,
      market: String,
      symbol: String,
      currency: String,
      country: String,
      currency2: String,
      date: Date,
      quote: Number,
      timestamp: Number,
    });
  }

  async getOne(query: any = {}) {
    try {
      const quote = await this.ClosingQuote.findOne(query).lean();
      if (quote) {
        return { success: true, data: quote };
      } else {
        return { success: false, error: "Quote not found" };
      }
    } catch (error) {
      return { success: false, error, data: null };
    }
  }
}

export default new ClosingQuote();
