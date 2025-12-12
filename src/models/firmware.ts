import { Model, model, Schema } from "mongoose";
import { IFirmware } from "./interfaces";
import moment from "moment";

class Firmware {
  FirmwareModel: Model<any>;

  constructor() {
    this.FirmwareModel = model("firmware", this.getOTASchema());
  }

  getOTASchema() {
    return new Schema(
      {
        fileName: String,
        version: String,
        isRelease: { type: Boolean, default: false },
        uploadedBy: { type: Schema.Types.ObjectId, ref: "user" },
      },
      { timestamps: true }
    );
  }

  async getAll() {
    try {
      const otaList = await this.FirmwareModel.find({}).populate("uploadedBy", "name userRole").lean();
      return { success: true, data: otaList };
    } catch (error) {
      return { success: false, error, data: [] };
    }
  }

  async add(data: IFirmware) {
    try {
      const d = await this.FirmwareModel.create(data);
      return { success: true, data: d };
    } catch (err) {
      return { success: false, error: err };
    }
  }

  async update(data: any) {
    try {
      const d = await this.FirmwareModel.updateOne({ _id: data._id }, data);
      return { success: true, data: d };
    } catch (err) {
      return { success: false, error: err };
    }
  }

  async delete(id: string) {
    try {
      await this.FirmwareModel.deleteOne({ _id: id });
      return { success: true, data: null };
    } catch (error) {
      return { success: false, error };
    }
  }

  async getById(_id: string) {
    try {
      if (!_id) return { success: false, error: "Not found" };
      const ota = await this.FirmwareModel.findById(_id.toString()).lean();
      if (ota) {
        return { success: true, data: ota as IFirmware };
      } else {
        return { success: false, error: "Not found" };
      }
    } catch (ex) {
      console.error(ex);
      return { success: false, error: "Invalid Id or not found" };
    }
  }

  async getByVersionNo(version: string) {
    try {
      if (!version) return { success: false, error: "Firmware not found" };
      const firmware = await this.FirmwareModel.findOne({ version }).lean();
      if (firmware) {
        return { success: true, data: firmware };
      } else {
        return { success: false, error: "Firmware not found" };
      }
    } catch (ex) {
      return { success: false, error: ex };
    }
  }

  async updateAllToFalse() {
    try {
      await this.FirmwareModel.updateMany({ isRelease: true }, { $set: { isRelease: false } });
      return { success: true, data: null };
    } catch (error) {
      return { success: false, error };
    }
  }

  async getLatestFirmware() {
    try {
      const latestFirmware: IFirmware = await this.FirmwareModel.findOne({ isRelease: true })
        .sort({ createdAt: -1 })
        .lean();

      if (latestFirmware) {
        return {
          success: true,
          data: { version: latestFirmware.version, id: latestFirmware._id, ...latestFirmware },
        };
      } else {
        return { success: false, error: "No Uploaded firmware found.", data: null };
      }
    } catch (error) {
      console.error("getLatestFirmware", error);
      return { success: false, error };
    }
  }
}

export default new Firmware();
