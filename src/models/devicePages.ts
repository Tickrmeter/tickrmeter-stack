import { Model, model, Schema } from "mongoose";
import { IDevicePage } from "./interfaces";
import moment from "moment";

class DevicePages {
  DevicePagesModel: Model<any>;

  constructor() {
    const DevicePagesSchema = new Schema(
      {
        pageId: { type: Number, required: true, unique: true },
        symbolType: { type: Number, required: true },
        symbol: { type: String, required: true },
        price: { type: Number, required: true },
        currency: { type: String, required: true },
        stream: { type: String, required: true },
        market: { type: String, required: true },
        currentHour: { type: Number, required: true },
        name: { type: String },
      },
      { versionKey: false, timestamps: true }
    );

    this.DevicePagesModel = model("DevicePages", DevicePagesSchema);
  }

  async getAll() {
    try {
      const devicePages = await this.DevicePagesModel.find().lean();
      return { success: true, data: devicePages };
    } catch (ex) {
      return { success: false, error: ex };
    }
  }

  async getOne(query) {
    try {
      const devicePages = (await this.DevicePagesModel.findOne(query).lean()) as IDevicePage;
      return { success: true, data: devicePages };
    } catch (ex) {
      return { success: false, error: ex, data: null as null };
    }
  }

  async get(query) {
    try {
      const devicePages = await this.DevicePagesModel.find(query).lean();
      return { success: true, data: devicePages };
    } catch (ex) {
      return { success: false, error: ex, data: [] };
    }
  }
  async getLastPageId() {
    try {
      const devicePage: IDevicePage = await this.DevicePagesModel.findOne().sort({ createdAt: -1 }).lean();

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
      const d = await this.DevicePagesModel.create(data);
      return { success: true, data: d as IDevicePage };
    } catch (ex) {
      console.error(ex);
      return { success: false, error: ex };
    }
  }

  async update(data: any) {
    try {
      const updatedDevicePageRes = await this.DevicePagesModel.findOneAndUpdate({ _id: data._id }, { $set: data });

      if (!updatedDevicePageRes) return { success: false, error: "Updating Device PAge" };

      const updatedDevicePage: IDevicePage = await this.DevicePagesModel.findOne({ _id: data._id }).lean();

      return { success: true, data: updatedDevicePage };
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
      const devicePage = await this.DevicePagesModel.findOne({ _id }).lean();
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

export default new DevicePages();
