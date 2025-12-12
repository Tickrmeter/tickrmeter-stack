import { DateTime } from "luxon";

export const getLowHighTime = (data: any, timeZone: string) => {
  const sorted = [...data].sort((a: any, b: any) => {
    return a.price - b.price;
  });

  const low = sorted[0];
  const high = sorted[sorted.length - 1];

  const lowhighVals = {
    low: DateTime.fromISO(low.date, { zone: timeZone }).toFormat("HH:mm"),
    high: DateTime.fromISO(high.date, { zone: timeZone }).toFormat("HH:mm"),
  };

  return lowhighVals;
};

export const secondsTillNextHour = () => {
  const now = DateTime.local();
  const nextHour = now.plus({ hour: 1 }).startOf("hour");
  return Math.round(nextHour.diff(now, "seconds").seconds);
};

export const sample_data = [
  { date: "2023-10-12T21:00:00Z", price: 819.02 },
  { date: "2023-10-12T20:00:00Z", price: 920.88 },
  { date: "2023-10-12T19:00:00Z", price: 964.57 },
  { date: "2023-10-12T18:00:00Z", price: 1127.94 },
  { date: "2023-10-12T17:00:00Z", price: 1647.81 },
  { date: "2023-10-12T16:00:00Z", price: 1266.86 },
  { date: "2023-10-12T15:00:00Z", price: 1081.19 },
  { date: "2023-10-12T14:00:00Z", price: 485.94 },
  { date: "2023-10-12T13:00:00Z", price: 212.66 },
  { date: "2023-10-12T12:00:00Z", price: 223.02 },
  { date: "2023-10-12T11:00:00Z", price: 194.09 },
  { date: "2023-10-12T10:00:00Z", price: 190.44 },
  { date: "2023-10-12T09:00:00Z", price: 180.22 },
  { date: "2023-10-12T08:00:00Z", price: 192.3 },
  { date: "2023-10-12T07:00:00Z", price: 203.79 },
  { date: "2023-10-12T06:00:00Z", price: 212.29 },
  { date: "2023-10-12T05:00:00Z", price: 175.45 },
  { date: "2023-10-12T04:00:00Z", price: 119.01 },
  { date: "2023-10-12T03:00:00Z", price: 50.48 },
  { date: "2023-10-12T02:00:00Z", price: 43.47 },
  { date: "2023-10-12T01:00:00Z", price: 0.97 },
  { date: "2023-10-12T00:00:00Z", price: 9.17 },
  { date: "2023-10-11T23:00:00Z", price: 0.97 },
  { date: "2023-10-11T22:00:00Z", price: 31.84 },
  { date: "2023-10-11T21:00:00Z", price: 36.24 },
  { date: "2023-10-11T20:00:00Z", price: 44 },
  { date: "2023-10-11T19:00:00Z", price: 72.18 },
  { date: "2023-10-11T18:00:00Z", price: 100.22 },
  { date: "2023-10-11T17:00:00Z", price: 115.88 },
  { date: "2023-10-11T16:00:00Z", price: 115.66 },
  { date: "2023-10-11T15:00:00Z", price: 105.37 },
  { date: "2023-10-11T14:00:00Z", price: 55.63 },
  { date: "2023-10-11T13:00:00Z", price: 0.45 },
  { date: "2023-10-11T12:00:00Z", price: -0.3 },
  { date: "2023-10-11T11:00:00Z", price: -0.45 },
  { date: "2023-10-11T10:00:00Z", price: 0 },
  { date: "2023-10-11T09:00:00Z", price: 7.83 },
  { date: "2023-10-11T08:00:00Z", price: 61.07 },
  { date: "2023-10-11T07:00:00Z", price: 97.83 },
  { date: "2023-10-11T06:00:00Z", price: 113.27 },
  { date: "2023-10-11T05:00:00Z", price: 72.18 },
  { date: "2023-10-11T04:00:00Z", price: 16.18 },
  { date: "2023-10-11T03:00:00Z", price: 0.67 },
  { date: "2023-10-11T02:00:00Z", price: 0 },
  { date: "2023-10-11T01:00:00Z", price: 0.45 },
  { date: "2023-10-11T00:00:00Z", price: 0.82 },
];
