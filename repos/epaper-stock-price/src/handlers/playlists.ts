import { Request, Response } from "express";
import { sendErrorResponse, sendResponse } from "./utils";
import PlaylistModel from "../models/playlist";
import DeviceModel from "../models/device";
import { IDevice, IPlaylist, IUserReq } from "../models/interfaces";
import { DATA_STREAM, MSG_TYPES } from "../constants";
import { addToQuoteCollector } from "./deviceConfig";
import { getSymbolsOnCycleMode } from "./quotes/helper/playlistCycleMode";

export const getMyPlaylists = async (req: Request, res: Response) => {
  const currentUser = req?.user as IUserReq;
  const { success, data: myDevices } = await PlaylistModel.getUserPlaylists(currentUser.userId);
  if (!success) sendErrorResponse(res);
  else sendResponse(true, "User Fetched", myDevices, res);
};

export const saveMyPlaylist = async (req: Request, res: Response) => {
  const currentUser = req?.user as IUserReq;
  const { name, cycleInterval, updateInterval, ledBrightness, cycleMode, symbols, isCalculateOnDaily, userId } =
    req.body;

  if (currentUser.userId !== userId) return sendErrorResponse(res, "Unauthorized");

  const newPlaylist: IPlaylist = {
    name,
    cycleInterval,
    updateInterval,
    ledBrightness,
    symbols,
    userId,
    cycleMode: cycleMode || "default",
    isCalculateOnDaily: isCalculateOnDaily || false,
  };

  const { success, data: newPl } = await PlaylistModel.add(newPlaylist);

  if (!success) sendErrorResponse(res);
  else sendResponse(true, "Playlist saved successfully", null, res);
};

export const getPlaylistDetails = async (req: Request, res: Response) => {
  const { id: playlistId } = req.params;
  const currentUser = req?.user as IUserReq;

  const { success, data: playlist } = await PlaylistModel.getById(playlistId);

  if (!success) return sendErrorResponse(res);

  if (playlist.userId.toString() !== currentUser.userId) return sendErrorResponse(res, "Unauthorized");

  sendResponse(true, "Playlist fetched", playlist, res);
};

export const updateMyPlaylist = async (req: Request, res: Response) => {
  console.log("Playlist update ...");

  const currentUser = req?.user as IUserReq;
  const { _id, name, cycleInterval, updateInterval, cycleMode, isCalculateOnDaily, ledBrightness, symbols, userId } =
    req.body;

  if (currentUser.userId !== userId) return sendErrorResponse(res, "Unauthorized");

  const { success: s1, data: playlist } = await PlaylistModel.getById(_id);
  if (!s1) return sendErrorResponse(res, "Playlist not found");

  const updatedPlaylist: IPlaylist = {
    _id: playlist._id,
    name,
    cycleInterval,
    updateInterval,
    ledBrightness,
    symbols,
    cycleMode: cycleMode || playlist?.cycleMode || "default",
    isCalculateOnDaily: isCalculateOnDaily ?? false,
    userId: playlist.userId,
  };

  const { success, data: newPl } = await PlaylistModel.update(updatedPlaylist);

  if (!success) sendErrorResponse(res);
  else sendResponse(true, "Playlist saved successfully", null, res);

  //check if this playlist is assigned to any device
  //if yes, update the device with the new playlist
  const { success: sd, data: devices } = await DeviceModel.getUserDevicesByUserId(userId);
  if (!sd) return;

  const playlistDevices = devices.filter((d) => d.isPlaylist && d.playlistId && d.playlistId.toString() === _id);

  if (playlistDevices.length === 0) return;

  const tickerConfig: IDevice["playlist"] = {
    name,
    cycleInterval,
    updateInterval,
    symbols: symbols.map((s) => ({
      ...s,
      symbol: s.stream === DATA_STREAM.COINGECKO ? s.name : s.symbol,
      name: s.stream === DATA_STREAM.COINGECKO ? s.symbol : s.name,
    })),
    ledBrightness,
    isCalculateOnDaily,
    cycleMode,
  };

  const querySymbol = await getSymbolsOnCycleMode(symbols, cycleMode, isCalculateOnDaily, currentUser.timeZone);

  console.log("querySymbol", querySymbol);

  const queryObject = {
    symbol: querySymbol.symbol,
    currency: querySymbol.currency,
    symbolType: querySymbol.symbolType,
    gainTrackingEnabled: querySymbol.gainTrackingEnabled,
    purchasePrice: querySymbol.purchasePrice,
  };

  const pushObject = {
    isPlaylist: true,
    type: MSG_TYPES.NEW,
    ...tickerConfig,
    symbols: symbols.map((s) => (s.symbolType === 2 ? `${s.symbol}/${s.currency}` : s.symbol)).join(","),
  };

  playlistDevices.forEach(async (device) => {
    const {
      success: upds,
      error,
      macAddress,
    } = await DeviceModel.updateTickerSymbol(device._id, tickerConfig, true, playlist._id, null);

    if (!upds) return;

    const gainTracking = {
      enabled: queryObject.gainTrackingEnabled || false,
      purchasePrice: queryObject.purchasePrice || null,
    };

    // const { success: success2, data: quote } =
    //   queryObject.symbolType === 1
    //     ? await getStockQuoteFromAPI(queryObject.symbol, gainTracking, currentUser.timeZone)
    //     : queryObject.symbolType === 2
    //     ? await getCryptoQuoteFromAPI(queryObject.symbol, currentUser.timeZone, queryObject.currency, gainTracking)
    //     : { success: false, data: null };

    // if (success2) {
    //   const dataForDevice = { ...quote, ...pushObject, gainTrackingEnabled: undefined, purchasePrice: undefined };

    //   publishData(macAddress, JSON.stringify(dataForDevice));
    //}
  });

  const { symbols: updatedSymbols } = tickerConfig;

  for (const symbol of updatedSymbols) {
    addToQuoteCollector({
      type: symbol.symbolType,
      stream: symbol.stream,
      market: symbol.market,
      symbol: symbol.symbol,
      currency: symbol.currency,
    });
  }
};

export const deleteMyPlaylist = async (req: Request, res: Response) => {
  const {
    body,
    params: { id },
  } = req;

  const currentUser = req?.user as IUserReq;

  if (!body._id || body._id !== id) return sendErrorResponse(res);

  const { success, data: firmware } = await PlaylistModel.getById(body._id);

  if (!success) return sendErrorResponse(res);

  //check if playlist is assigned to any device, if yes then return response  with error
  const { success: sd, data: devices } = await DeviceModel.getUserDevicesByUserId(currentUser.userId);

  if (sd) {
    const playlistDevices = devices.filter((d) => d.isPlaylist && d.playlistId && d.playlistId.toString() === body._id);

    if (playlistDevices.length > 0) return sendErrorResponse(res, "Playlist is assigned to a device", 1);
  }

  const { success: deleteSuccess } = await PlaylistModel.delete(body._id);

  if (deleteSuccess) sendResponse(true, "Playlist deleted successfully.", null, res);
  else sendErrorResponse(res, "def Unable to delete the Playlsit.", 1);
};
