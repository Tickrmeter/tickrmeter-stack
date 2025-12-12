const etfs = require("./handlers/quotes/jsonFiles/etfs.json");
const indices = require("./handlers/quotes/jsonFiles/indices.json");
const MongoClient = require("mongodb").MongoClient;
dbName = "tickrmeter";

const url = `mongodb://localhost:27017/${dbName}`;
const client = new MongoClient(url);

async function connect() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error(err);
  }
}

async function updateETFsAndIndices() {
  try {
    await connect();

    const collection = client.db(dbName).collection("quotecollectors");

    const allEtfSymbols = await collection.find({ market: "etf" }).toArray();

    console.log("Updating Etf Symbols: Total:", allEtfSymbols.length);

    allEtfSymbols.forEach((etfDB) => {
      const etfData = etfs.find(
        (e) => e.symbol.trim() === etfDB.symbol.trim() && e.currency.toUpperCase() === etfDB.currency.toUpperCase()
      );

      let metaData;
      if (!etfData) {
        console.log({ etfDB });
        console.error(`ETF with symbol ${etfDB.symbol} not found`);
        metaData = null;
      } else {
        metaData = { country: etfData.country, currency: etfData.currency };
      }

      collection.updateOne({ _id: etfDB._id }, { $set: { meta: metaData } });
    });

    const allIndexSymbols = await collection.find({ market: "indices" }).toArray();
    console.log("Updating Indices Symbols: Total:", allIndexSymbols.length);

    allIndexSymbols.forEach((indexDB) => {
      const indexData = indices.find(
        (i) => i.symbol.trim() === indexDB.symbol.trim() && i.currency.toUpperCase() === indexDB.currency.toUpperCase()
      );

      let metaData;
      if (!indexData) {
        console.log({ index: indexDB });
        console.error(`INDEX with symbol ${indexDB.symbol} not found`);
        metaData = null;
      } else {
        metaData = { country: indexData.country, currency: indexData.currency };
      }

      console.log(indexDB._id, metaData);

      collection.updateOne({ _id: indexDB._id }, { $set: { meta: metaData } });
    });
  } catch (err) {
    console.error(err);
  } finally {
    //await client.close();
  }
}

updateETFsAndIndices();
