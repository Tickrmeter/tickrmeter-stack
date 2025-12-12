// const mongoose = require("mongoose");
import mongoose from "mongoose";
import conf from "../conf";

// const dbConfig = {
//   mongo_uri: "mongodb://localhost:27017",
//   mongo_dbname: "epaper-stock-price",
//   mongo_username: "root",
//   mongo_password: "123",
// };

export const connectToMongoose = async () => {
  if (mongoose.connection.readyState === 0) {
    // connect to host

    await mongoose.connect(conf.database.host, {
      dbName: conf.database.dbname,
    });

    console.log("Connected to MongoDB");
    return mongoose;
  }
};

export const disConnect = async () => {
  // check if already connected to mongo
  if (mongoose.connection.readyState === 1) {
    await mongoose.disconnect();
  }
};
