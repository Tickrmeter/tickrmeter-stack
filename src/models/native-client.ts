import { MongoClient, MongoClientOptions } from "mongodb";
import conf from "../conf";

const url = `${conf.database.host}/${conf.database.dbname}`;
const options: MongoClientOptions = {
  maxPoolSize: 500, // Adjust the connection pool size
  serverSelectionTimeoutMS: 5000, // Timeout for server selection
  socketTimeoutMS: 45000, // Socket timeout
  connectTimeoutMS: 30000, // Connection timeout
};
const client = new MongoClient(url, options);

async function connect() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error(err);
  }
}

connect();

export default client;
