import { useState } from "react";
import { Alert, Button, Col, FormGroup, Row, Spinner, Table } from "reactstrap";
import { Slide, toast } from "react-toastify";
import classNames from "classnames";

import { AlertCircle, Search, X } from "react-feather";

import http from "@src/utility/http";
import { ApiEndPoint, API_PATHS } from "@src/redux/api-paths";
import ToastContent from "@src/utility/toast-content";

import { CheckBoxField, InputField, SelectField } from "@src/utility/input-fields";

import { playlistDetailsDefaults, cycleIntervalOptions, playlistItemDefaults, updateIntervalOptions } from "./helper";
import { currencyOptions, isValidFolatingNumber, ledBrightnessOptions } from "../ConfigDeviceNew/helper";
import { getUserData } from "@src/utility/Utils";

const CreatePlaylist = ({ deviceId, hideForm }) => {
  const [serverError, setServerError] = useState();
  const [playlistError, setPlaylistError] = useState();
  const [loading, isLoading] = useState(false);

  const [playlistItem, setPlaylistItem] = useState({ ...playlistItemDefaults });

  const [playlistDetails, setPlaylistDetails] = useState({ ...playlistDetailsDefaults });
  const [playlistSymbols, setPlaylistSymbols] = useState([]);

  const getCycleIntervalOptions = () => {
    const userData = getUserData();
    if (userData?.enableFastRefresh) return cycleIntervalOptions;
    else return cycleIntervalOptions.filter((option) => option._id >= 120);
  };

  const getUpdateIntervalOptions = () => {
    const userData = getUserData();
    if (userData?.enableFastRefresh) return updateIntervalOptions;
    else return updateIntervalOptions.filter((option) => option._id >= 60);
  };

  const savePlaylist = async () => {
    try {
      isLoading(true);
      //console.log(playlistDetails);
      const data = {
        deviceId,
        isPlaylist: true,
        ...playlistDetails,
        symbols: [
          ...playlistSymbols.map((pls) => ({
            name: pls.name,
            symbol: pls.symbol,
            symbolType: parseInt(pls.type),
            currency: pls.currency,
            gainTrackingEnabled: pls.gainTrackingEnabled,
            purchasePrice: pls.purchasePrice,
          })),
        ],
      };

      const { success, message, type } = await http.post(`${ApiEndPoint(API_PATHS.QUOTE_PUSH)}`, data);

      if (success) {
        toast.success(
          <ToastContent type="success" title="Success!" body={"Device configuration pushed successfully."} />,
          {
            transition: Slide,
            hideProgressBar: true,
            autoClose: 4000,
          }
        );

        hideForm(true);
        setServerError(null);
      } else {
        toast.error(
          <ToastContent
            type="danger"
            title="Unable to push!"
            body={type === 1 ? message : "Unable to push device configuration, please try again later."}
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
          body={"Unable to push device configuration, please try again later."}
        />,
        { transition: Slide, hideProgressBar: true, autoClose: 4000 }
      );
    } finally {
      isLoading(false);
    }
  };

  const addSymbolToPlaylist = async () => {
    const { symbol, currency, type: symbolType, gainTrackingEnabled, purchasePrice } = playlistItem;

    const isSymbolInList = playlistSymbols.find((playlist) =>
      symbolType === 2 ? playlist.symbol === symbol && playlist.currency === currency : playlist.symbol === symbol
    );

    if (isSymbolInList) {
      setPlaylistError(`Symbol ${symbolType === 2 ? `${symbol}-${currency}` : symbol} already exists in the list!`);
      return;
    }

    isLoading(true);
    const { success, data, message, type } = await http.get(
      `${ApiEndPoint(API_PATHS.SEARCH_SYMBOL)}/${symbolType}/${symbol}/${currency || "USD"}`
    );

    if (success) {
      const newPlaylist = {
        ...data,
        type: symbolType,
        gainTrackingEnabled,
        purchasePrice,
        currency: currency || "USD",
      };
      setPlaylistSymbols([...playlistSymbols, newPlaylist]);
      setPlaylistItem({ ...playlistItemDefaults, type: symbolType });
      setPlaylistError(null);
    } else {
      setPlaylistError(message);
    }
    isLoading(false);
  };

  const removeSymbolFromList = (symbol) => {
    const newPlaylists = playlistSymbols.filter((playlist) => playlist.symbol !== symbol);
    setPlaylistSymbols([...newPlaylists]);
  };

  // ** Render Functions ** //
  const renderPlaylistDetails = () => (
    <div className="p-2">
      <Row className="justify-content-center">
        <Col xs="12" lg="8" className="mt-1">
          <InputField
            name="playlistName"
            label="Playlist Name"
            placeholder="Office Tickrmeter Playlist"
            value={playlistDetails.name}
            onChange={(e) => setPlaylistDetails({ ...playlistDetails, name: e.target.value })}
          />
        </Col>
        <Col xs="12" lg="8" className="mt-1">
          <SelectField
            name="cycleInterval"
            label="Cycle Interval"
            options={getCycleIntervalOptions()}
            value={playlistDetails.cycleInterval}
            onChange={(e) => setPlaylistDetails({ ...playlistDetails, cycleInterval: e.target.value })}
          />
        </Col>
        {/* <Col xs="12" lg="8" className="mt-1">
          <SelectField
            name="cycleMode"
            label="cycleMode"
            options={cycleModeOptions}
            value={playlist.cycleInterval}
            onChange={(e) => setPlaylist({ ...playlist, cycleInterval: e.target.value })}
          />
        </Col> */}
        <Col xs="12" lg="8" className="mt-1">
          <SelectField
            name="interval"
            label="Update Interval"
            options={getUpdateIntervalOptions()}
            value={playlistDetails.updateInterval}
            onChange={(e) => {
              if (parseInt(playlistDetails.cycleInterval) > parseInt(e.target.value)) {
                setPlaylistDetails({ ...playlistDetails, updateInterval: e.target.value });
              } else {
                setPlaylistDetails({
                  ...playlistDetails,
                  updateInterval: e.target.value,
                  cycleInterval: e.target.value,
                });
              }
            }}
          />
        </Col>
      </Row>
      <Row className="justify-content-center">
        <Col xs="12" lg="8" className="mt-1">
          <SelectField
            name="ledBrightness"
            label="LED Brightness"
            options={ledBrightnessOptions}
            defaultValue={"100"}
            onChange={(e) => setPlaylistDetails({ ...playlistDetails, ledBrightness: e.target.value })}
          />
        </Col>
      </Row>
      <Row></Row>
    </div>
  );

  const renderAddButton = () => {
    if (playlistSymbols.length > 4) return <></>;

    // return (
    //   <>
    //     {loading ? (
    //       <Spinner type="grow" color="primary" style={{ width: "3rem", height: "3rem" }} />
    //     ) : (
    //       <FormGroup className="d-flex mb-0">
    //         <Button.Ripple color="primary" type="submit" disabled={!playlistItem.symbol} onClick={addSymbolToPlaylist}>
    //           <Search className="d-block d-sm-none" />
    //           <span className=" d-none d-sm-block">Add</span>
    //         </Button.Ripple>
    //       </FormGroup>
    //     )}
    //   </>
    // );
    return (
      <FormGroup className="d-flex mb-0 justify-content-center">
        <Button.Ripple
          color="primary"
          type="submit"
          className={classNames("search-button", { loader: loading })}
          style={{ padding: "0.75rem 1.5rem" }}
          disabled={!playlistItem.symbol}
          onClick={addSymbolToPlaylist}
        >
          {!loading ? (
            <>
              {/* <Search className="d-block d-sm-none" size={24} /> */}
              <span>Add</span>
            </>
          ) : (
            <Spinner type="grow" color="white" />
          )}
        </Button.Ripple>
      </FormGroup>
    );
  };

  const renderConfig = () => (
    <div className="m-1 p-1" style={{ border: "1px solid #ccc", borderRadius: "10px" }}>
      {playlistError && (
        <Alert color="danger" isOpen={playlistError !== null} fade={true}>
          <div className="alert-body">
            <AlertCircle size={15} />
            <span className="ml-1">{playlistError}</span>
          </div>
        </Alert>
      )}
      <Row>
        <Col sm="12" className="text-center">
          <div className="mb-1 symbolType">
            <Button
              color="primary"
              className="mr-2"
              onClick={() => setPlaylistItem({ ...playlistItem, type: 1 })}
              active={playlistItem.type === 1}
            >
              Stock
            </Button>
            <Button
              color="primary"
              className="mr-2"
              onClick={() => setPlaylistItem({ ...playlistItem, type: 2 })}
              active={playlistItem.type === 2}
            >
              Crypto
            </Button>
            {/* <Button color="primary" onClick={() => setSymbolType(3)} active={symbolType === 3}>
              Forex
            </Button> */}
          </div>
        </Col>
      </Row>
      <Row className="justify-content-center">
        <Col xs="12" lg="8" className="mt-1 ">
          <InputField
            name="symbolSearch"
            label={`Search ${playlistItem.type === 1 ? "Stock symbol" : "Cyrpto"}`}
            placeholder={`${playlistItem.type === 1 ? "TSLA" : "BTC"}`}
            onChange={({ target }) => setPlaylistItem({ ...playlistItem, symbol: target.value.toUpperCase() })}
            style={{ textTransform: "uppercase" }}
            value={playlistItem.symbol}
          />
        </Col>
      </Row>
      {playlistItem.type === 2 && (
        <Row className="justify-content-center">
          <Col xs="12" lg="8" className="mt-1 ">
            <SelectField
              name="currency"
              label="Select Currency"
              options={currencyOptions}
              onChange={({ target }) => setPlaylistItem({ ...playlistItem, currency: target.value })}
            />
          </Col>
        </Row>
      )}
      <Row className="justify-content-center">
        <Col xs="12" lg="8" className="mt-1">
          <CheckBoxField
            name="isGainTrackingEnabled"
            label="Enable Gain Tracking?"
            checked={playlistItem.gainTrackingEnabled}
            onChange={({ target }) => {
              setPlaylistItem({ ...playlistItem, gainTrackingEnabled: target.checked, purchasePrice: "" });
            }}
          />
        </Col>
      </Row>
      {playlistItem.gainTrackingEnabled && (
        <Row className="justify-content-center">
          <Col xs="12" lg="8" className="mt-1">
            <InputField
              name="purchasePrice"
              label={`Purchase Price`}
              placeholder="Enter average purchase price"
              onChange={({ target }) => {
                if (!isValidFolatingNumber(target.value)) return false;
                const pp = parseFloat(target.value);
                if (isNaN(pp) && target.value !== "") return false;
                else if (pp < 0) return false;
                else setPlaylistItem({ ...playlistItem, purchasePrice: target.value });
              }}
              value={playlistItem.purchasePrice}
            />
          </Col>
        </Row>
      )}
      <Row className="justify-content-center">
        <Col className="mt-1">{renderAddButton()}</Col>
      </Row>
    </div>
  );

  const renderPlaylist = () => (
    <div>
      <Table striped responsive>
        <thead>
          <tr>
            <th>Name</th>
            <th>Symbol</th>
            <th>Current Price</th>
            <th>Purchase Price</th>
            <th>Remove</th>
          </tr>
        </thead>
        <tbody>
          {playlistSymbols.map((playlist, index) => (
            <tr key={index}>
              <td>{playlist.name}</td>
              <td>{playlist.type === 2 ? `${playlist.symbol}-${playlist.currency}` : playlist.symbol}</td>
              <td>{playlist.price}</td>
              <td>{playlist.purchasePrice}</td>
              <td>
                <Button.Ripple
                  className="btn-icon"
                  outline
                  color="primary"
                  onClick={() => removeSymbolFromList(playlist.symbol)}
                >
                  <X size={16} />
                </Button.Ripple>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );

  return (
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
          {renderConfig()}
          {playlistSymbols.length > 0 && renderPlaylist()}
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
                disabled={!playlistDetails.name || playlistSymbols.length === 1}
                onClick={savePlaylist}
              >
                Send to Tickrmeter
              </Button.Ripple>
            </FormGroup>
          )}
        </Col>
      </Row>
      <Row className="justify-content-center">
        <Col className="small m-2 font-italic">* You have to add atleast two symbols in the playlist.</Col>
      </Row>
    </>
  );
};

export default CreatePlaylist;
