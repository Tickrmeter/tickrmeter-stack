import { isWithinNightModeRange, getLEDBrightness } from "../handlers/quotes/helper/ledBrightness";
import { DateTime } from "luxon";

describe("isWithinNightModeRange", () => {
  //const timeZone = "America/New_York"; // Chosen for demonstration purposes
  //const timeZone = "Asia/Karachi"; // Chosen for demonstration purposes
  //+3 timezone
  const timeZone = "Europe/Istanbul"; // Chosen for demonstration purposes
  const getCurrentTime = (current) => DateTime.fromFormat(current, "HH:mm", { zone: timeZone });
  it("user test --> should return true when current time is within the night mode range", () => {
    const current = "11:03";

    const start = "11:00";
    const end = "11:15";

    const currentTime = getCurrentTime(current);

    //loop through 10:55 to 11:20 and console.log the result
    //let cTime = DateTime.fromObject({ hour: 10, minute: 55 });
    // for (let i = 0; i < 25; i++) {
    //   const result = isWithinNightModeRange(cTime, start, end, timeZone);
    //   console.log(cTime.toFormat("HH:mm"), result);
    //   cTime = cTime.plus({ minutes: 1 });
    // }

    const result = isWithinNightModeRange(currentTime, start, end, timeZone, "AA:BB:CC:DD:EE:FF");

    expect(result).toBe(true);
  });

  it("should return true when current time is within the night mode range", () => {
    const current = "23:30";

    const start = "22:00";
    const end = "06:00";

    const currentTime = getCurrentTime(current);

    const result = isWithinNightModeRange(currentTime, start, end, timeZone, "AA:BB:CC:DD:EE:FF");

    expect(result).toBe(true);
  });

  it("should return true when current time is on next day and within the night mode range", () => {
    const current = "09:00";

    const start = "22:00";
    const end = "11:00";

    const currentTime = getCurrentTime(current);
    const result = isWithinNightModeRange(currentTime, start, end, timeZone, "AA:BB:CC:DD:EE:FF");

    expect(result).toBe(true);
  });

  it("should return false when current time is outside the night mode range", () => {
    const current = "14:30";

    const start = "22:00";
    const end = "06:00";

    const currentTime = getCurrentTime(current);

    const result = isWithinNightModeRange(currentTime, start, end, timeZone, "AA:BB:CC:DD:EE:FF");
    expect(result).toBe(false);
  });

  it("should handle scenarios where night mode range doesn't span across days", () => {
    const current = "03:30";

    const start = "02:00";
    const end = "05:00";

    const currentTime = getCurrentTime(current);

    const result = isWithinNightModeRange(currentTime, start, end, timeZone, "AA:BB:CC:DD:EE:FF");

    expect(result).toBe(true);
  });

  it("should handle scenarios where end time is before start time within the same day", () => {
    const current = "15:30";

    const start = "16:00";
    const end = "14:00";

    const currentTime = getCurrentTime(current);

    const result = isWithinNightModeRange(currentTime, start, end, timeZone, "AA:BB:CC:DD:EE:FF");

    expect(result).toBe(false);
  });
});

// describe("getLEDBrightness", () => {
//   afterEach(() => {
//     jest.restoreAllMocks();
//   });

//   it("returns 0 when within night mode range", () => {
//     // jest.spyOn(DateTime, "now").mockReturnValue(DateTime.fromISO("2022-01-01T23:00:00.000-05:00"));

//     const deviceData = {
//       tz: "Asia/Karachi",
//       startTime: "22:00",
//       endTime: "11:00",
//       brightness: 50,
//     };
//     const result = getLEDBrightness(deviceData);

//     expect(result).toEqual(0);
//   });

//   it("returns brightness when outside night mode range", () => {
//     const deviceData = {
//       tz: "Asia/Karachi",
//       startTime: "22:00",
//       endTime: "06:00",
//       brightness: 50,
//     };
//     //jest.spyOn(DateTime, "now").mockReturnValue(DateTime.fromISO("2022-01-01T12:00:00.000-05:00"));

//     const result = getLEDBrightness(deviceData);

//     expect(result).toEqual(50);
//   });
// });
