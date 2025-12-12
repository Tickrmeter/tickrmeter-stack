import { DateTime } from "luxon";
import { IDeviceWithUser, ISingleConfig } from "../../../models/interfaces";

/**
 * Get led brightness from device on the basis of night mode settings
 * @param deviceData
 * @param timeZone
 * @returns ledbrightness value
 */

export const GetLEDBrightness = (deviceData: IDeviceWithUser, timeZone: string) => {
  const nightModeEnabled = deviceData.nightMode || false;
  let brightness = deviceData.isPlaylist
    ? deviceData.playlist?.ledBrightness ?? 100
    : (deviceData.config as ISingleConfig)?.ledBrightness ?? 100;

  if (nightModeEnabled) {
    brightness = getLEDBrightness({
      tz: timeZone,
      startTime: deviceData.nightModeStart,
      endTime: deviceData.nightModeEnd,
      brightness,
    });
  }

  return brightness;
};

export const getLEDBrightness = ({ tz, startTime, endTime, brightness }): number => {
  const currentTime: DateTime = DateTime.now();
  const nightModeStart = startTime;
  const nightModeEnd = endTime;

  if (!nightModeStart || !nightModeEnd) return brightness;

  return isWithinNightModeRange(currentTime, nightModeStart, nightModeEnd, tz) ? 0 : brightness;
};

export const isWithinNightModeRange = (currentTime: DateTime, start: string, end: string, tz: string): boolean => {
  try {
    currentTime = currentTime.setZone(tz);

    // Create DateTime objects for the start and end times using the current date.
    let startTime = DateTime.fromObject(
      {
        hour: parseInt(start.split(":")[0]),
        minute: parseInt(start.split(":")[1]),
      },
      { zone: tz }
    );

    let endTime = DateTime.fromObject(
      {
        hour: parseInt(end.split(":")[0]),
        minute: parseInt(end.split(":")[1]),
      },
      { zone: tz }
    );

    //const startTime = DateTime.fromFormat(start, "HH:mm", { zone: tz });
    //const endTime = DateTime.fromFormat(end, "HH:mm", { zone: tz });

    //console.log("1", startTime1.toRFC2822(), endTime1.toRFC2822());
    //console.log("2", startTime.toRFC2822(), endTime.toRFC2822());

    if (startTime > endTime) {
      // Case where the interval spans over midnight.
      return currentTime >= startTime || currentTime <= endTime;
    } else if (startTime < endTime) {
      // Normal case where interval is within the same day.
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Start time and end time are the same.
      return true;
    }
  } catch (error) {
    console.error("Error in isWithinNightModeRange: ", error);
    return false;
  }
};
