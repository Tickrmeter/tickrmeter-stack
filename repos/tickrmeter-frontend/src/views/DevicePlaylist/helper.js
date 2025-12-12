export const playlistDetailsDefaults = {
  name: "",
  cycleInterval: "120",
  cycleMode: "default",
  updateInterval: "60",
  ledBrightness: "100",
  isActive: "",
  symbols: [],
};

export const playlistItemDefaults = {
  type: 1,
  symbol: "",
  currency: "",
  gainTrackingEnabled: false,
  purchasePrice: "",
};

export const cycleIntervalOptions = [
  { _id: "30", name: "30 Seconds" },
  { _id: "60", name: "1 Min" },
  { _id: "120", name: "2 Mins", selected: true },
  { _id: "180", name: "3 Mins" },
  { _id: "300", name: "5 Mins" },
  { _id: "600", name: "10 Mins" },
  { _id: "900", name: "15 Mins" },
  { _id: "1200", name: "20 Mins" },
  { _id: "1500", name: "25 Mins" },
  { _id: "1800", name: "30 Mins" },
  { _id: "3600", name: "1 Hour" },
  { _id: "7200", name: "2 Hours" },
  { _id: "10800", name: "3 Hours" },
  { _id: "21600", name: "6 Hours" },
  { _id: "43200", name: "12 Hours" },
  { _id: "86400", name: "24 Hours" },
];

export const updateIntervalOptions = [
  { _id: "5", name: "5 Seconds" },
  { _id: "10", name: "10 Seconds" },
  { _id: "30", name: "30 Seconds" },
  { _id: "60", name: "1 Min", selected: true },
  { _id: "120", name: "2 Mins" },
  { _id: "180", name: "3 Mins" },
  { _id: "300", name: "5 Mins" },
  { _id: "600", name: "10 Mins" },
  { _id: "900", name: "15 Mins" },
  { _id: "1200", name: "20 Mins" },
  { _id: "1500", name: "25 Mins" },
  { _id: "1800", name: "30 Mins" },
];

export const cycleModeOptions = [
  { _id: "default", name: "Playlist Order" },
  { _id: "best", name: "Top Performers" },
  { _id: "worst", name: "Worst Performers" },
];
