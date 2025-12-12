import { Schema } from "mongoose";
import { Model, model } from "mongoose";

export interface IMarketSymbol {
  type: number;
  stream: string;
  market: string;
  symbol: string;
  currency: string;
  meta?: any;
}

export interface IQuoteCollector extends IMarketSymbol {
  price: number;
  lastUpdated: number;
  lastClosingPrice: number;
  lastClosingTime: number;
  rawResponse: any;
  lastClosingPriceRawResponse: any;
}

class QuoteCollector {
  QuoteCollectorModel: Model<IQuoteCollector>;

  constructor() {
    this.QuoteCollectorModel = model("quotecollector", this.getQuoteCollectorModel()) as Model<IQuoteCollector>;
  }

  getQuoteCollectorModel() {
    return new Schema(
      {
        type: Number,
        stream: String,
        market: String,
        symbol: String,
        currency: String,
        price: Number,
        meta: Object,
        lastUpdated: Number,
        lastClosingPrice: Number,
        lastClosingTime: Number,
        rawResponse: Object,
        lastClosingPriceRawResponse: Object,
      },
      { timestamps: true, versionKey: false }
    ).index({ stream: 1, market: 1, symbol: 1, currency: 1 }, { unique: true });
  }

  async getAll(query: any = {}) {
    try {
      const result = await this.QuoteCollectorModel.find(query).lean();
      return { success: true, data: result };
    } catch (error) {
      console.error("Error in QuoteCollector.getAll", error);
      return { success: false, error };
    }
  }

  async getOne(query: any = {}) {
    try {
      const result = await this.QuoteCollectorModel.findOne(query).lean();

      return { success: result ? true : false, data: result as any };
    } catch (error) {
      console.error("Error in QuoteCollector.getOne", error);
      return { success: false, error };
    }
  }

  async add(data: IQuoteCollector | IMarketSymbol) {
    try {
      const result = await this.QuoteCollectorModel.create(data);
      return { success: true, data: result };
    } catch (error) {
      //console.error("Error in QuoteCollector.create", error);
      return { success: false, error };
    }
  }

  async updateMeta(query: any = {}, meta: any = {}) {
    try {
      const result = await this.QuoteCollectorModel.findOneAndUpdate(query, { meta });
      return { success: true, data: result };
    } catch (error) {
      console.error("Error in QuoteCollector.updateMeta", error);
      return { success: false, error };
    }
  }

  async update(query: any = {}, data: any = {}) {
    try {
      const result = await this.QuoteCollectorModel.findOneAndUpdate(query, data, { new: true });
      return { success: true, data: result };
    } catch (error) {
      console.error("Error in QuoteCollector.update", error);
      return { success: false, error };
    }
  }
}

export default new QuoteCollector();
