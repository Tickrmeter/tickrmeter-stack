import { useEffect, useState } from "react";
import { Alert, Button, Card, CardBody, CardHeader, CardTitle, Col, FormGroup, Label, Row, Spinner } from "reactstrap";
import { Slide, toast } from "react-toastify";
import classNames from "classnames";
import SlideDown from "react-slidedown";
import { AlertCircle, XCircle } from "react-feather";

import http from "@src/utility/http";
import { getUserData } from "@src/utility/Utils";

import { ApiEndPoint, API_PATHS } from "@src/redux/api-paths";
import ToastContent from "@src/utility/toast-content";

import { InputField, SelectField } from "@src/utility/input-fields";
import { playlistDetailsDefaults, cycleIntervalOptions, updateIntervalOptions, cycleModeOptions } from "./helper";
import {
  ledBrightnessOptions,
  stockMarkets,
  calculateBatteryLife,
  currencyList,
  emptyCurrencyObj,
} from "../ConfigDeviceNew/helper";

import BootstrapSwitchButton from "bootstrap-switch-button-react";

import PlaylistSymbolsTable from "./PlaylistSymbolsTable";
import PlaylistConfig from "./PlaylistItem/PlaylistConfig";
import { SYMBOL_TYPES } from "@device-config/helper2";

const PlaylistForm = ({ postSubmit, refreshGrid, editPlaylistId, setEditPlaylistId }) => {
  const [hidden, setHidden] = useState(true);
  const [serverError, setServerError] = useState();
  const [playlistError, setPlaylistError] = useState();
  const [loading, setLoading] = useState(false);

  // const [playlistItem, setPlaylistItem] = useState({ ...playlistItemDefaults });
  const [playlistDetails, setPlaylistDetails] = useState({ ...playlistDetailsDefaults });
  const [playlist, setPlaylist] = useState([]);
  const [batteryLife, setBatteryLife] = useState("");
  //

  const isMusicCreatorPlaylist =
    playlist.length === 0 ? null : playlist.some((item) => item.symbolType === SYMBOL_TYPES.MUSIC_CREATORS);
  //const [top10List, setTop10List] = useState([]);

  useEffect(() => {
    if (editPlaylistId && editPlaylistId !== "new") {
      getPlaylistDetails(editPlaylistId);
    }
  }, [editPlaylistId]);

  useEffect(() => {
    //calculateBatteryLife();

    const { updateInterval, ledBrightness, cycleInterval } = playlistDetails;

    if (updateInterval && ledBrightness && cycleInterval) {
      const _batteryLife = calculateBatteryLife(
        parseInt(updateInterval),
        parseInt(ledBrightness),
        true,
        parseInt(cycleInterval)
      );

      setBatteryLife(`${_batteryLife} days`);
    }
  }, [playlistDetails.updateInterval, playlistDetails.ledBrightness, playlistDetails.cycleInterval]);

  const getPlaylistDetails = async (id) => {
    try {
      const API_URI = `${ApiEndPoint(API_PATHS.GET_PLAYLIST_DETAILS)}/${id}`;
      const { success, data, message, type } = await http.get(API_URI);
      if (success) {
        const _symbols = data.symbols.map((symbol) => {
          const currency = currencyList.find((c) => c.code === symbol.currency) || emptyCurrencyObj;
          return {
            ...symbol,
            purchasePrice: symbol.purchasePrice?.toString().replace(".", currency.decimal) || "",
          };
        });

        data.symbols = [..._symbols];

        setPlaylistDetails(data);
        setPlaylist(data.symbols);

        //setIsEditing(-1);
        setHidden(false);
      } else {
        toast.error(
          <ToastContent
            type="danger"
            title="Unable to fetch playlist details!"
            body={type === 1 ? message : "Unable to fetch playlist details, please try again later"}
          />,
          { transition: Slide, hideProgressBar: true, autoClose: 4000 }
        );
      }
    } catch (error) {
      console.error(error);
      hideForm();
      toast.error(
        <ToastContent
          type="danger"
          title="Unable to fetch playlist details!"
          body={"Unable to fetch playlist details, please try again later"}
        />,
        { transition: Slide, hideProgressBar: true, autoClose: 4000 }
      );
    }
  };

  const getUpdateIntervalOptions = () => updateIntervalOptions.filter((option) => option._id >= 30);

  const hideForm = () => {
    setServerError(null);
    setPlaylistError(null);
    setEditPlaylistId(null);
    setPlaylist([]);
    setPlaylistDetails({ ...playlistDetailsDefaults });
    //setIsEditing(-1);
    //setPlaylistItem({ ...playlistItemDefaults });
    setHidden(true);
    postSubmit(!refreshGrid);
  };

  const savePlaylist = async () => {
    try {
      setLoading(true);

      const data = {
        ...playlistDetails,
        cycleMode: "default",
        isCalculateOnDaily: false,
        symbols: [
          ...playlist.map((pls) => ({
            stream: pls.stream,
            market: pls.market,
            name: pls.name,
            symbol: pls.symbol,
            symbolType: parseInt(pls.symbolType),
            currency: pls.currency || stockMarkets.find((dm) => dm._id === pls.market)?.currency,
            gainTrackingEnabled: pls.gainTrackingEnabled,
            purchasePrice: pls.purchasePrice.replace(",", "."),
            noOfStocks: pls.noOfStocks,
            showFullAssetValue: pls.showFullAssetValue,
            isShortSell: pls.isShortSell,
            multiplierEnabled: pls.multiplierEnabled,
            multiplier: pls.multiplier,
            extraConfig: pls.extraConfig,
          })),
        ],
        userId: getUserData()._id,
        _id: editPlaylistId && editPlaylistId !== "new" ? editPlaylistId : undefined,
      };

      const { success, message, type } =
        editPlaylistId && editPlaylistId !== "new"
          ? await http.put(ApiEndPoint(API_PATHS.SAVE_MY_PLAYLIST), data)
          : await http.post(ApiEndPoint(API_PATHS.SAVE_MY_PLAYLIST), data);

      if (success) {
        toast.success(<ToastContent type="success" title="Success!" body={"Playlist saved successfully."} />, {
          transition: Slide,
          hideProgressBar: true,
          autoClose: 4000,
        });

        hideForm(true);
        setServerError(null);
      } else {
        toast.error(
          <ToastContent
            type="danger"
            title="Unable to save!"
            body={type === 1 ? message : "Unable to save playlist, please try again later."}
          />,
          { transition: Slide, hideProgressBar: true, autoClose: 4000 }
        );
      }
    } catch (error) {
      console.error(error);
      toast.error(
        <ToastContent
          type="danger"
          title="Unable to push!"
          body={"Unable to save playlist, please try again later."}
        />,
        { transition: Slide, hideProgressBar: true, autoClose: 4000 }
      );
    } finally {
      setLoading(false);
    }
  };

  // ** Render Functions ** //
  const renderPlaylistDetails = () => (
    <div className="p-2">
      <Row className="justify-content-center">
        <Col xs="12" lg="6" className="mt-1">
          <InputField
            name="playlistName"
            label="Playlist Name"
            placeholder="Office Tickrmeter Playlist"
            value={playlistDetails.name}
            onChange={(e) => setPlaylistDetails({ ...playlistDetails, name: e.target.value })}
          />
        </Col>
        <Col xs="12" lg="6" className="mt-1">
          <SelectField
            name="cycleInterval"
            label="Cycle Interval"
            options={cycleIntervalOptions}
            value={playlistDetails.cycleInterval}
            onChange={(e) => setPlaylistDetails({ ...playlistDetails, cycleInterval: e.target.value })}
          />
        </Col>
      </Row>
      <Row className="justify-content-center">
        <Col xs="12" lg="6" className="mt-1">
          <SelectField
            name="interval"
            label="Update Interval"
            options={getUpdateIntervalOptions()}
            value={playlistDetails.updateInterval}
            onChange={(e) => setPlaylistDetails({ ...playlistDetails, updateInterval: e.target.value })}
          />
        </Col>

        <Col xs="12" lg="6" className="mt-1">
          <SelectField
            name="ledBrightness"
            label="LED Brightness"
            options={ledBrightnessOptions}
            value={playlistDetails.ledBrightness ?? "100"}
            onChange={(e) => setPlaylistDetails({ ...playlistDetails, ledBrightness: e.target.value })}
          />
        </Col>
      </Row>
      {!isMusicCreatorPlaylist && (
        <Row className="justify-content-center">
          <Col xs="12" lg="6" className="mt-1">
            <SelectField
              name="cycleMode"
              label="Cycle Mode"
              options={cycleModeOptions}
              value={playlistDetails.cycleMode || "default"}
              onChange={(e) => setPlaylistDetails({ ...playlistDetails, cycleMode: e.target.value })}
            />
          </Col>
          <Col xs="12" lg="6" className="mt-1">
            {(playlistDetails.cycleMode === "best" || playlistDetails.cycleMode === "worst") && (
              <>
                <FormGroup>
                  <Label for="isCalculateOnDaily">Calculate Performance on:</Label>
                  <BootstrapSwitchButton
                    checked={playlistDetails.isCalculateOnDaily ?? false}
                    onlabel="Daily"
                    offlabel="Gain"
                    offstyle="outline-primary"
                    style="d-block"
                    height="43"
                    width="200"
                    onChange={(checked) => {
                      setPlaylistDetails({ ...playlistDetails, isCalculateOnDaily: checked });
                    }}
                  />
                </FormGroup>
              </>
            )}
          </Col>
        </Row>
      )}
      <Row className="justify-content-center">
        <Col xs="12" lg="6" className="mt-1">
          <FormGroup>
            <strong>Estimated Battery Life: {batteryLife}</strong>
          </FormGroup>
        </Col>
        <Col xs="12" lg="6" className="mt-1"></Col>
      </Row>
      <Row></Row>
    </div>
  );

  return (
    <Card>
      <CardHeader className={classNames({ "border-bottom": true, "justify-content-end": hidden })}>
        <CardTitle className={classNames({ "d-flex w-100 justify-content-between": !hidden })}>
          {hidden ? (
            <Button.Ripple
              color="primary"
              onClick={() => {
                setEditPlaylistId("new");
                setHidden(false);
              }}
            >
              New Playlist
            </Button.Ripple>
          ) : (
            <>
              <h4>{editPlaylistId && editPlaylistId !== "new" ? "Edit Playlist" : "New Playlist"}</h4>
              <XCircle size={24} onClick={hideForm} style={{ cursor: "pointer" }} />
            </>
          )}
        </CardTitle>
      </CardHeader>

      <SlideDown className={"react-slidedown"}>
        <>
          {!hidden ? (
            <CardBody className={hidden ? "hidden" : ""}>
              {serverError && (
                <Alert color="danger" isOpen={serverError !== null} fade={true}>
                  <div className="alert-body">
                    <AlertCircle size={15} />
                    <span className="ml-1">{serverError}</span>
                  </div>
                </Alert>
              )}
              <Row className="justify-content-center device-config">
                <Col sm="12">
                  <>
                    {serverError && (
                      <Alert color="danger" isOpen={serverError !== null} fade={true}>
                        <div className="alert-body">
                          <AlertCircle size={15} />
                          <span className="ml-1">{serverError}</span>
                        </div>
                      </Alert>
                    )}
                    <Row className="justify-content-center device-config">
                      <Col sm="12">
                        {renderPlaylistDetails()}
                        {/* {renderConfig()} */}
                        <PlaylistConfig
                          playlistState={{ playlist, setPlaylist }}
                          plErrorState={{ playlistError, setPlaylistError }}
                          isMusicCreatorPlaylist={isMusicCreatorPlaylist}
                        />
                        {playlist.length > 0 && (
                          <PlaylistSymbolsTable
                            playlist={playlist}
                            setPlaylist={setPlaylist}
                            isMusicCreatorPlaylist={isMusicCreatorPlaylist}
                          />
                        )}
                      </Col>
                    </Row>

                    <Row className="justify-content-center">
                      <Col xs="7" className="mt-1 mb-1 text-center">
                        {loading ? (
                          <Spinner type="grow" color="primary" style={{ width: "3rem", height: "3rem" }} />
                        ) : (
                          <FormGroup className="d-block mb-0">
                            <Button.Ripple
                              className="mr-1"
                              block
                              color="primary"
                              disabled={!playlistDetails.name || playlist.length < 2}
                              onClick={savePlaylist}
                            >
                              {editPlaylistId && editPlaylistId !== "new" ? "Update" : "Save"} Playlist
                            </Button.Ripple>
                          </FormGroup>
                        )}
                      </Col>
                    </Row>
                    <Row className="justify-content-center">
                      <Col className="small m-2 font-italic">
                        * You have to add atleast two symbols in the playlist.
                      </Col>
                    </Row>
                  </>
                </Col>
              </Row>
            </CardBody>
          ) : null}
        </>
      </SlideDown>
    </Card>
  );
};

export default PlaylistForm;
