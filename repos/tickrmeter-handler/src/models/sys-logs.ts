import { APISOURCES } from "../services/http";
import nativeClient from "./native-client";
import { DateTime } from "luxon";

export const logToDatabase = async (url: string, configKey: APISOURCES, status: string, error: any = null) => {
  let logEntry = {};
  try {
    return; // Disable logging to database for now
    const now = DateTime.utc();
    const utcDate = now.toFormat("yyyy-MM-dd"); // UTC Date only
    const utcDateTime = now.toFormat("yyyy-MM-dd HH:mm"); // UTC DateTime without seconds and milliseconds
    const creationDate = now.toJSDate();

    logEntry = {
      configKey,
      url,
      status,
      error,
      date: utcDate,
      dateTime: utcDateTime,
      creationDate,
    };

    const logEntries = nativeClient.db("logs").collection("api-logs");

    logEntries.insertOne(logEntry);

    return;
  } catch (error) {
    console.error("Error logging to database", error, logEntry);
    return;
  }
};
