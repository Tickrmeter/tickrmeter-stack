import { Model, model, Schema } from "mongoose";
import { ITop10 } from "./interfaces";

class Top10 {
  Top10: Model<any>;

  constructor() {
    this.Top10 = model("top10", this.getTop10Schema());
  }

  getTop10Schema() {
    return new Schema(
      {
        symbol: { type: String, required: true },
        name: { type: String, required: true },
        price: { type: String, required: true },
        percent: { type: String, required: true },
        date: { type: String, required: true },
        currency: { type: String, required: true },
        uploadedBy: { type: Schema.Types.ObjectId, ref: "user" },
      },
      {
        timestamps: true,
        versionKey: false,
      }
    );
  }

  async update(top10Details: any) {
    try {
      //delete all records
      await this.Top10.deleteMany({});

      //insert array into multiple records
      const d = await this.Top10.insertMany(top10Details);

      return { success: true, data: d };
    } catch (err) {
      console.error(err);
      return { success: false, error: err };
    }
  }

  async getBySymbol(symbol: string) {
    try {
      const top10 = await this.Top10.findOne({ symbol });
      if (!top10) return { success: false, error: "Symbol not found!", data: null };
      return { success: true, data: top10 as ITop10 };
    } catch (error) {
      return { success: false, error, data: null };
    }
  }

  async getAll() {
    try {
      const top10 = await this.Top10.find({});
      if (!top10 || top10.length === 0) return { success: false, error: "No Symbol not found!", data: [] };
      return { success: true, data: top10 as ITop10[] };
    } catch (error) {
      return { success: false, error, data: [] };
    }
  }
}

export default new Top10();
