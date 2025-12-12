import { compare, compareSync } from "bcrypt";
import { Model, model, Schema } from "mongoose";
import { IUser, IUserLogin } from "./interfaces";
import Devices from "./device";
import moment from "moment";

class Users {
  UserModel: Model<any>;

  constructor() {
    this.UserModel = model("user", this.getUserSchema());
  }

  getUserSchema() {
    return new Schema(
      {
        name: String,
        email: { type: String, unique: true },
        password: String,
        isActive: { type: Boolean, default: true },
        userRole: Number,
        enableFastRefresh: { type: Boolean, default: false },
        timeZone: String,
        timeFormat: { type: String, default: "12h" },
        confirmToken: {
          token: String,
          created: Date,
        },
        resetToken: {
          token: String,
          created: Date,
        },
        meta: {
          type: Object,
          default: {},
        },
      },
      { timestamps: true }
    );
  }

  async Login(userLogin: IUserLogin) {
    try {
      const email = userLogin.email;
      const password = userLogin.password;
      const user: IUser = await this.UserModel.findOne({ email }).lean();

      if (!user) return { success: false, data: null };

      if (!compareSync(password, user.password)) return { success: false, data: null };

      return { success: true, data: user };
    } catch (error) {
      console.error(error);
      return { success: false, data: null };
    }
  }

  async getAll(query = {}) {
    try {
      const users = await this.UserModel.find(query);
      return { success: true, data: users };
    } catch (error) {
      console.error("Error getting users");
      return { success: false, error, data: [] };
    }
  }

  async getAllWithDevices() {
    try {
      let users: IUser[] = await this.UserModel.find({}).lean();

      users = await Promise.all(
        users.map(async (u) => ({
          ...u,
          createdAt: moment(u.createdAt).format("DD-MMM-YYYY"),
          noOfDevices: (await Devices.getUserDevicesByUserId(u._id)).data.length ?? 0,
          password: undefined,
          __v: undefined,
          token: undefined,
        }))
      );

      return { success: true, data: users };
    } catch (error) {
      console.error("Error getting users", error);
      return { success: false, error, data: [] };
    }
  }

  async getAllWithDevicesWithPaging(pageNo: number, limit: number, sort: string, query: string = "") {
    try {
      //let users = await this.UserModel.find({}).lean();
      console.log({ pageNo, limit, sort });

      //check if query is not empty then search for email address or name case insensitive
      let q =
        query !== ""
          ? { $or: [{ email: { $regex: query, $options: "i" } }, { name: { $regex: query, $options: "i" } }] }
          : {};

      const sortField = sort.split(":")[0];
      const sortType = sort.split(":")[1];

      const sortObj = sort ? (sortType === "desc" ? `-${sortField}` : sortField) : "-createdAt";

      let users: IUser[] = await this.UserModel.find(q)
        .skip((pageNo - 1) * limit)
        .limit(limit)
        .sort(sortObj)
        .lean();

      users = await Promise.all(
        users.map(async (u) => ({
          ...u,
          createdAt: moment(u.createdAt).format("DD-MMM-YYYY"),
          noOfDevices: (await Devices.getUserDevicesByUserId(u._id)).data.length ?? 0,
          password: undefined,
          __v: undefined,
          token: undefined,
        }))
      );

      const total = await this.UserModel.countDocuments({});

      if (sortField === "noOfDevices") {
        users = users.sort((a, b) => {
          if (sortType === "asc") {
            return a.noOfDevices - b.noOfDevices;
          } else {
            return b.noOfDevices - a.noOfDevices;
          }
        });
      }

      const data = {
        p: pageNo,
        t: total,
        tp: Math.ceil(total / limit),
        ps: limit,
        d: users,
      };

      return { success: true, data };
    } catch (error) {
      console.error("Error getting users", error);
      return { success: false, error, data: [] };
    }
  }

  async add(data: IUser) {
    try {
      const d = await this.UserModel.create(data);
      return { success: true, data: d, message: "" };
    } catch (err) {
      return { success: false, message: err, data: null };
    }
  }

  async update(data: any) {
    try {
      //      const user = await this.UserModel.findById(data._id.toString()).lean();

      //    if (!user) return { success: false, error: "User not found!" };

      // const updatedData = { ...user, data };

      const d = await this.UserModel.updateOne({ _id: data._id }, data);

      return { success: true, data: d };
    } catch (err) {
      console.log("error", err);
      return { success: false, error: err };
    }
  }

  async getUser(query) {
    try {
      const user: IUser = await this.UserModel.findOne(query).lean();
      if (user) {
        return { success: true, data: user };
      } else {
        return { success: false, error: "User not found" };
      }
    } catch (ex) {
      console.error(ex);
      return { success: false, error: "Invalid User or User not found" };
    }
  }

  async delete(id: string) {
    try {
      console.log("deleting", id);
      await this.UserModel.deleteOne({ _id: id });
      return { success: true, data: null };
    } catch (error) {
      return { success: false, error };
    }
  }

  async getById(_id: string) {
    try {
      if (!_id) return { success: false, error: "User not found" };
      const user: IUser = await this.UserModel.findById(_id.toString()).lean();
      if (user) {
        return { success: true, data: user };
      } else {
        return { success: false, error: "User not found" };
      }
    } catch (ex) {
      console.error(ex);
      return { success: false, error: "Invalid User or User not found" };
    }
  }
}

export default new Users();
