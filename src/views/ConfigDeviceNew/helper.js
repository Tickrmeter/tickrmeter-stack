/* eslint-disable no-useless-escape */
/* eslint-disable no-mixed-operators */
import React, { useEffect, useState } from "react";
import * as yup from "yup";
import moment from "moment";
import PopoverSetup from "@components/popover-setup";

import { Button, UncontrolledTooltip } from "reactstrap";
import { Bell, BellOff, AlertCircle } from "react-feather";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faCircle } from "@fortawesome/free-solid-svg-icons";
import ModalComponent from "@src/@core/components/modal";
import { CheckBoxField } from "@src/utility/input-fields";
import { DATA_MARKETS, SYMBOL_TYPES } from "./helper2";

// ***************** VALIDATION SCHEMAS ***************//

const yString = yup.string();

export const DeviceRegSchema = yup.object().shape({
  r1: yString.required(),
  r2: yString.required(),
  r3: yString.required(),
  r4: yString.required(),
  r5: yString.required(),
});

export const deviceRegDefaults = {
  r1: "",
  r2: "",
  r3: "",
  r4: "",
  r5: "",
};

function isMobileDevice() {
  return typeof window.orientation !== "undefined" || navigator.userAgent.indexOf("IEMobile") !== -1;
}

const FirmwareDownloadConfirm = ({ deviceId, deviceName, onClickConfirm, battery }) => {
  const [showModal, setShowModal] = useState(false);
  const [iUnderstand, setIUnderstand] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  //const isUpdating = useRef(false);
  //console.log("battery", battery, deviceName);

  useEffect(() => {
    getDeviceLastUpdateAt();
  }, []);

  const onClickOk = () => {
    setIUnderstand(false);
    onClickConfirm();
    setIsUpdating(true);
  };

  const getDeviceLastUpdateAt = () => {
    const fpo = localStorage.getItem("fpd");
    if (!fpo) return false;

    const fpoObj = JSON.parse(fpo);
    if (!fpoObj) return false;

    const lastUpdateAt = fpoObj[deviceId];
    if (!lastUpdateAt) return false;

    const lastUpdateAtDate = moment(lastUpdateAt);
    if (!lastUpdateAtDate.isValid()) return false;

    const diff = moment().diff(lastUpdateAtDate, "minutes");
    setIsUpdating(diff < 3);
  };

  const getPopoverText = () => {
    //setIsUpdating(_isUpdating);
    if (battery < 2 && battery !== -1) {
      return (
        <>
          <p>The firmware on your device is outdated.</p>
          <p>The battery level is low. Please charge your device before updating the firmware.</p>
        </>
      );
    }

    if (isUpdating) {
      return "Firmware update is in progress";
    } else {
      if (isMobileDevice()) return "";
      return (
        <>
          <p>The firmware on your device is outdated.</p>
          <p>
            Please{" "}
            <Button
              className="btn-link"
              style={{ margin: "0", padding: "0" }}
              color="flat-danger"
              onClick={() => setShowModal(!showModal)}
            >
              click here
            </Button>{" "}
            to update your device.
          </p>
        </>
      );
    }
  };

  const onButtonClick = () => {
    if (isUpdating) return;
    if (battery < 2 && battery !== -1) return;

    setShowModal(!showModal);
  };

  const getToolTip = () => {
    const popOverText = getPopoverText();

    if (popOverText === "") return "";
    else {
      return (
        <UncontrolledTooltip placement="right" target={`firmwareDetails-${deviceId}`} autohide={false}>
          <div style={{ textAlign: "left" }}>{popOverText}</div>
        </UncontrolledTooltip>
      );
    }
  };

  return (
    <>
      <Button
        id={`firmwareDetails-${deviceId}`}
        className="btn-icon"
        color="flat-danger"
        onClick={onButtonClick}
        style={{ marginLeft: "10px" }}
      >
        <AlertCircle size={24} color="red" />
      </Button>

      {getToolTip()}
      <ModalComponent
        body={
          <>
            <p>
              Are you sure to update the firmware on <strong>{deviceName}</strong>?
            </p>
            <p>
              Please ensure your TickrMeter is powered in by USB when updating and do not turn it off before untill
              update is finished.
            </p>

            <CheckBoxField
              name="iUnderstand"
              label="I understand the risks and I am ready to update the firmware"
              checked={iUnderstand}
              onChange={(e) => setIUnderstand(e.target.checked)}
            />
          </>
        }
        title={`Update ${deviceName} Firmware`}
        headerClass="modal-danger"
        showModal={showModal}
        setShowModal={setShowModal}
        onClickConfirm={onClickOk}
        confirmButtonTitle="Update Device!"
        showConfirmBtn={iUnderstand}
      ></ModalComponent>
    </>
  );
};

// ** Column because of custom onClick
export const GetConfigCol = ({ onClickAction }) => {
  return {
    id: "device-config",
    name: "Edit",
    sortable: false,
    center: true,
    hide: "sm",
    button: true,
    minWidth: "150px",
    cell: (row) => {
      return (
        <div style={{ display: "flex", justifyContent: "space-around", width: "100%" }}>
          <Button id="cog" className="btn-icon" color="flat-primary" onClick={() => onClickAction(row._id)}>
            Edit
          </Button>
          <PopoverSetup
            placement="bottom"
            target="cog"
            triggeringCookie={"Popover1"}
            body={"Press the “Config” button to add stocks to your TickrMeter"}
            title={"Add stocks"}
            confirmButtonTitle={"Okay"}
            icon={<FontAwesomeIcon icon={faCheck} />}
            nextCookieValue={"Popover2"}
          ></PopoverSetup>
        </div>
      );
    },
  };
};

export const GetMobileOnlyCols = ({ onClickAction, onFirmwareDownloadClick }) => {
  return [
    {
      id: "devices-all",
      name: "Tickrmeters",
      sortable: false,
      width: "100%",
      cell: (row) => {
        return (
          <div className="w-100 d-flex align-items-center">
            <div className="w-2rem h-2rem ">
              {/* Online Status Indicator */}
              {row.isOnline !== null ? (
                row.isOnline === false ? (
                  <>
                    <FontAwesomeIcon icon={faCircle} color="red" size="lg" id={`status-${row._id}`} />
                    <UncontrolledTooltip placement="right" target={`status-${row._id}`}>
                      <div className="text-left">Online {row.lastStatusOn}</div>
                    </UncontrolledTooltip>
                  </>
                ) : (
                  <FontAwesomeIcon icon={faCircle} color="green" size="lg" />
                )
              ) : (
                ""
              )}
            </div>

            {/* Device Name & Firmware */}

            <div className="d-flex justify-content-between ml-quaterrem w-100">
              <div className="d-flex flex-column justify-content-center ">
                <div className="mb-quaterrem cursor-pointer " onClick={() => onClickAction(row._id)}>
                  <div className="d-inline-block mr-halfrem">{row.name || row.macAddress}</div>
                  <div className="d-inline-block justify-content-between align-items-center">
                    {row.batteryStatus > -1 && <div className={`battery b-${row.batteryStatus}`}>{""}</div>}
                  </div>
                </div>
                <div className="font-weight-bold">{getSymbolCellData(row)}</div>
              </div>
              <div className="cursor-pointer d-flex align-items-center flex-column justify-content-center">
                <div className="d-flex justify-content-end " style={{ minWidth: "140px", marginRight: "10px" }}>
                  {row.firmwareDetails && (
                    <FirmwareDownloadConfirm
                      deviceId={row._id}
                      deviceName={row.name || row.macAddress}
                      onClickConfirm={() => onFirmwareDownloadClick(row._id, row.firmwareDetails)}
                      battery={row.batteryStatus}
                    />
                  )}
                  {/* <div className="d-flex justify-content-between align-items-center">
                    {row.batteryStatus > -1 && <div className={`battery b-${row.batteryStatus}`}>{""}</div>}
                  </div> */}
                </div>

                {/* Alerts */}
                {row.alertEnabled && (
                  <div
                    className="d-flex justify-content-end align-items-center"
                    style={{ minWidth: "140px", height: "57px" }}
                  >
                    <Bell
                      size={32}
                      color="red"
                      href="#"
                      id={`alert-${row._id}`}
                      style={{
                        cursor: "pointer",
                      }}
                    />
                    {row.symbolType !== SYMBOL_TYPES.ELECTRICITY && (
                      <Button
                        className="btn-icon"
                        color="flat-warning"
                        onClick={() => onClickAction(row.macAddress)}
                        title="If alert is active on device, this will disable the alert."
                      >
                        <BellOff size={32} />
                      </Button>
                    )}
                    {getAlertColPopover(row)}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      },
    },
  ];
};

export const GetNameAndStatusCol = ({ onClickAction, onFirmwareDownloadClick }) => {
  return [
    {
      id: "status",
      name: "",
      selector: (row) => row.isOnline,
      sortable: false,
      width: "50px",
      hide: "sm",
      cell: (row) => {
        return (
          <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
            {row.isOnline !== null ? (
              row.isOnline === false ? (
                <>
                  <FontAwesomeIcon icon={faCircle} color="red" size="lg" id={`status-${row._id}`} />
                  <UncontrolledTooltip placement="right" target={`status-${row._id}`}>
                    <div style={{ textAlign: "left" }}>Online {row.lastStatusOn}</div>
                  </UncontrolledTooltip>
                </>
              ) : (
                <FontAwesomeIcon icon={faCircle} color="green" size="lg" />
              )
            ) : (
              ""
            )}
          </div>
        );
      },
    },
    {
      id: "name",
      name: "Name",
      selector: (row) => row.name,
      sortable: true,
      hide: "sm",
      minWidth: "300px",
      style: { paddingRight: "10px !important" },
      cell: (row) => {
        return (
          <div
            className="d-flex justify-content-between"
            style={{ display: "flex", justifyContent: "space-between", width: "100%" }}
          >
            <div className="cursor-pointer d-flex align-items-center">
              <div onClick={() => onClickAction(row._id)}>{row.name || row.macAddress}</div>

              {row.firmwareVersion && row.firmwareDetails && (
                <FirmwareDownloadConfirm
                  deviceId={row._id}
                  deviceName={row.name || row.macAddress}
                  onClickConfirm={() => onFirmwareDownloadClick(row._id, row.firmwareDetails)}
                  battery={row.batteryStatus}
                />
              )}
            </div>
            <div className="d-flex justify-content-between align-items-center" style={{ width: "80px" }}>
              {row.batteryStatus > -1 && <div className={`battery b-${row.batteryStatus}`}>{""}</div>}
            </div>
          </div>
        );
      },
    },
  ];
};

const getFirmwareDownloadConfirm = ({ row, deviceId, deviceName, onClickConfirm }) => {};

export const GetDisableAlertCol = ({ onClickAction }) => {
  return {
    id: "disable-alert",
    name: "Alert",
    sortable: false,
    center: true,
    hide: "sm",
    style: { width: "100px", padding: "10px !important" },

    cell: (row) => {
      if (!row.alertEnabled) return "";

      return (
        <div style={{ display: "flex", justifyContent: "space-evenly", alignItems: "center", width: "100%" }}>
          <Bell
            size={32}
            color="red"
            href="#"
            id={`alert-${row._id}`}
            style={{
              cursor: "pointer",
            }}
          />
          {row.symbolType !== SYMBOL_TYPES.ELECTRICITY && (
            <Button
              className="btn-icon"
              color="flat-warning"
              onClick={() => onClickAction(row.macAddress)}
              title="If alert is active on device, this will disable the alert."
            >
              <BellOff size={32} />
            </Button>
          )}
          {getAlertColPopover(row)}
        </div>
      );
    },
  };
};

export const columns = [
  {
    id: "symbol",
    name: "Symbol",
    selector: (row) => row.symbol,
    sortable: true,
    hide: "sm",
    style: { paddingLeft: "10px !important", paddingRight: "10px !important", whiteSpace: "nowrap" },
    cell: (row) => getSymbolCellData(row),
  },

  // ** Action cols are added in the component file as we need to customize the edit and delete actions
];

const getSymbolCellData = (row) => {
  if (row.symbolType === SYMBOL_TYPES.CUSTOMAPI) {
    return (
      <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
        <a href="#" id={`customapi-${row._id}`} style={{ cursor: "pointer" }}>
          {row?.symbolUI}
        </a>

        <UncontrolledTooltip placement="right" target={`customapi-${row._id}`}>
          <div style={{ textAlign: "left" }}>
            <p>
              <strong>API URL:</strong>
            </p>
            <p>{row.symbol}</p>
          </div>
        </UncontrolledTooltip>
      </div>
    );
  }

  if (row.symbolType === SYMBOL_TYPES.MUSIC_CREATORS) {
    if (row.symbol.includes("by")) {
      //split the symbol in 2 lines
      const symbol = row.symbol;
      const symbolWithLineBreak = symbol.split("by");
      return symbolWithLineBreak.length > 1 ? (
        <>
          {symbolWithLineBreak[0]} by <br /> {symbolWithLineBreak[1]}
        </>
      ) : (
        symbolWithLineBreak[0]
      );
    }
  }

  if (!row.isPlaylist) return row?.symbolUI || row.symbol;

  return (
    <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
      <a href="#" id={`playlist-${row._id}`} style={{ cursor: "pointer" }}>
        {row?.symbolUI || row.symbol}
      </a>

      <UncontrolledTooltip placement="right" target={`playlist-${row._id}`}>
        <div style={{ textAlign: "left" }}>
          <p>
            <strong>Symbols:</strong>
          </p>
          <p>
            {row.playlistSymbols.map((symbol) => (
              <span key={symbol.symbol}>
                {`${symbol.symbol} : ${symbol.name}`}
                <br />
              </span>
            ))}
          </p>
        </div>
      </UncontrolledTooltip>
    </div>
  );
};

const getAlertColPopover = (row) => {
  if (!row.alertEnabled) return <></>;

  return (
    <UncontrolledTooltip placement="right" target={`alert-${row._id}`}>
      <div style={{ textAlign: "left" }}>
        <p>
          <strong>Alerts:</strong>
          <br />
          Trigger Type: {row.alertConfig.triggerType}
          <br />
          Trigger Value: {row.alertConfig.triggerValue}
        </p>
        <p>
          {row.alertConfig.flashLightbar && (
            <>
              Flashlight Bar
              <br />
            </>
          )}
          {row.alertConfig.playSound && (
            <>
              {`Play Sound - ${row.alertConfig.soundType} - ${row.alertConfig.soundDur}`}
              <br />
            </>
          )}
          {row.alertConfig.changeLightBarColor && `Light Bar Color - ${row.alertConfig.lightBarColor}`}
        </p>
      </div>
    </UncontrolledTooltip>
  );
};

export const ledBrightnessOptions = [
  { _id: "0", name: "OFF" },
  { _id: "50", name: "LOW" },
  { _id: "100", name: "HIGH", selected: true },
];
export const intervalOptions = [
  // { _id: "1", name: "1 Second" },
  // { _id: "2", name: "2 Seconds" },
  // { _id: "3", name: "3 Seconds" },
  // { _id: "4", name: "4 Seconds" },
  // { _id: "10", name: "10 Seconds" },
  { _id: "5", name: "Sstream" },
  { _id: "20", name: "Stream" },
  { _id: "30", name: "30 Seconds" },
  { _id: "60", name: "1 Min " },
  { _id: "120", name: "2 Min ", selected: true },
  { _id: "180", name: "3 Mins" },
  { _id: "300", name: "5 Mins" },
  { _id: "600", name: "10 Mins" },
  { _id: "900", name: "15 Mins" },
  { _id: "1800", name: "30 Mins" },
  { _id: "3660", name: "1 Hour" },
  { _id: "43200", name: "12 Hours" },
  { _id: "86400", name: "24 Hours" },
];

export const currencyOptions = [
  { _id: "USD", name: "USD" },
  { _id: "EUR", name: "EUR" },
  { _id: "GBP", name: "GBP" },
];

export const triggerTypeOptions = [
  { _id: "Greater than", name: "Greater than" },
  { _id: "Less than", name: "Less than" },
];

export const soundTypeOptions = [
  { _id: "Bell", name: "Bell" },
  { _id: "Beep", name: "Beep" },
];

export const defaultAlertConfig = {
  enabled: false,
  triggerType: "Greater than",
  triggerValue: "",
  flashLightbar: false,
  playSound: false,
  soundType: "bell",
  soundDur: "Once",
  changeLightBarColor: false,
  lightBarColor: "Blue",
};

export const lightBarColorOpts = [
  { _id: "Blue", name: "Blue" },
  { _id: "Green", name: "Green" },
  { _id: "Red", name: "Red" },
  { _id: "Yellow", name: "Yellow" },
  { _id: "Purple", name: "Purple" },
];

export const isValidFolatingNumber = (value) => /^[0-9]*(?:\.[0-9]*)?$/.test(value);

export const isValidAmount = (value) => {
  const regex = /^[0-9]*([.,][0-9]*)?$/;

  // Check if both dot and comma are present
  const hasBothSeparators = value.includes(".") && value.includes(",");

  return regex.test(value) && !hasBothSeparators;
};

export const symbolDetailsDefault = {
  dataStream: "tradingview", //"polygon",
  dataMarket: "",
  symbolType: 1,
  searchSymbol: "",
  currency: "USD",
  interval: "300",
  gainTrackingEnabled: false,
  purchasePrice: "",
  noOfStocks: "",
  isShortSell: false,
  showFullAssetValue: false,
  ledBrightness: "0",
  multiplierEnabled: false,
  multiplier: 1,
  newAPI: false,
  commodityUnit: "perOunce",
  isMetalCommodity: false,
  aggregateTime: "1d",
};

export const stockMarkets = [
  { _id: "us", name: "United States", stream: ["polygon"], currency: "USD" },
  { _id: "uk", name: "United Kingdom", stream: ["finage"], currency: "GBP" },
  { _id: "ca", name: "Canada", stream: ["finage"], currency: "CAD" },
  { _id: "hk", name: "Hong Kong", stream: ["finage"], currency: "HKD" },
  { _id: "se", name: "Sweden", stream: ["finage"], currency: "SEK" },
  { _id: "no", name: "Norway", stream: ["finage"], currency: "NOK" },
  { _id: "dk", name: "Denmark", stream: ["finage"], currency: "DKK" },
  { _id: "fi", name: "Finland", stream: ["finage"], currency: "EUR" },
  { _id: "lv", name: "Latvia", stream: ["finage"], currency: "EUR" },
  { _id: "ee", name: "Estonia", stream: ["finage"], currency: "EUR" },
  { _id: "de", name: "Germany", stream: ["finage"], currency: "EUR" },
  { _id: "nl", name: "Netherlands", stream: ["finage"], currency: "EUR" },
  { _id: "fr", name: "France", stream: ["finage"], currency: "EUR" },
  { _id: "sw", name: "Switzerland", stream: ["finage"], currency: "CHF" },
  { _id: "jp", name: "Japan", stream: ["finage"], currency: "JPY" },
  { _id: "cz", name: "Czech Republic", stream: ["finage"], currency: "CZK" },
  { _id: "il", name: "Israel", stream: ["finage"], currency: "ILS" },
  { _id: "be", name: "Belgium", stream: ["finage"], currency: "EUR" },
  { _id: "au", name: "Australia", stream: ["finage"], currency: "AUD" },
];

export const cryptoDataMarkets = [
  { _id: "polygon", name: "Polygon" },
  { _id: "coingecko", name: "Coin Gecko" },
];

export const currencyList = [
  { symbol: "$", code: "USD", name: "United States Dollar", decimal: "." },
  { symbol: "£", code: "GBP", name: "British Pound", decimal: "." },
  { symbol: "", code: "GBX", name: "British Pound", decimal: "." },
  { symbol: "$", code: "CAD", name: "Canadian Dollar", decimal: "." },
  { symbol: "$", code: "HKD", name: "Hong Kong Dollar", decimal: "." },
  { symbol: "SEK", code: "SEK", name: "Swedish Krona", decimal: "," },
  { symbol: "NOK", code: "NOK", name: "Norwegian Krone", decimal: "," },
  { symbol: "DKK", code: "DKK", name: "Danish Krone", decimal: "," },
  { symbol: "€", code: "EUR", name: "Euro", decimal: "," },
  { symbol: "CHF", code: "CHF", name: "Swiss Franc", decimal: "." },
  { symbol: "$", code: "AUD", name: "Australian Dollar", decimal: "." },
  { symbol: "¥", code: "JPY", name: "Japanese Yen", decimal: "." },
  { symbol: "CZK", code: "CZK", name: "Czech Koruna", decimal: "," },
  { symbol: "₪", code: "ILS", name: "Israeli New Shekel", decimal: "." },
];


export const SupportedCurrencySymbols = [
  { _id: "USD", name: "USD - United States Dollar $" },
  { _id: "GBP", name: "GBP - British Pound £" },
  { _id: "EUR", name: "EUR - Euro € " },
];

export const commoditiesCurrencyList = [...SupportedCurrencySymbols];


export const getFormattedNumber = (num, decimalChar = ".") =>
  num.toFixed(num > 9999 ? 0 : num > 999 ? 1 : num > 99 || num > 9 ? 2 : 4).replace(".", decimalChar);

export const calculateBatteryLife = (interval, ledBrightness, isPlaylist, cycleInterval) => {
  const UPDATE_CONSUMPTION = 100; //in ma
  const BATTERY_CAPACITY = 1800; //in mah

  const UPDATE_DURATION = isPlaylist ? 5 : 3; //in seconds
  const CYCLE_CONSUMPTION = isPlaylist ? 74 : 0; //in ma
  const CYCLE_DURATION = isPlaylist ? 2 : 0; //in seconds

  const SLEEP_CONSUMPTION = ledBrightness === 0 ? 1.5 : ledBrightness === 50 ? 10.5 : 16.5; //in ma
  const CYCLE_INTERVAL = isPlaylist ? cycleInterval / 60 : 99; //in minute
  const UPDATE_INTERVAL = interval / 60; //in minutes

  const lifeTime =
    (BATTERY_CAPACITY * 3600) /
    (UPDATE_CONSUMPTION * ((3600 / (UPDATE_INTERVAL * 60)) * UPDATE_DURATION) +
      CYCLE_CONSUMPTION * ((3600 / (CYCLE_INTERVAL * 60)) * CYCLE_DURATION) +
      SLEEP_CONSUMPTION * 3600);

  const lifeTimeInDays = lifeTime / 24;

  return lifeTimeInDays.toFixed(0);
};

// const getIntervalOptions2 = (symbolDetails, intervalOptions) => {
//   if (symbolDetails.dataStream === "coingecko") return intervalOptions.filter((option) => option._id >= 300);
//   if (symbolDetails.dataStream === "finage" && symbolDetails.symbolType !== 3) {
//     return intervalOptions.filter((option) => option._id >= 300);
//   }

//   if (symbolDetails.dataStream === DATA_STREAMS.COMMODITYAPI && symbolDetails.symbolType === SYMBOL_TYPES.COMMODITY) {
//     return intervalOptions.filter((option) => option._id >= 900);
//   }

//   const userData = getUserData();
//   if (userData?.enableFastRefresh) return intervalOptions;
//   else return intervalOptions.filter((option) => option._id >= 60);
// };

export const isMobile = () => {
  let check = false;
  (function (a) {
    if (
      /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(
        a
      ) ||
      /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(
        a.substr(0, 4)
      )
    )
      // eslint-disable-next-line nonblock-statement-body-position
      check = true;
  })(navigator.userAgent || navigator.vendor || window.opera);
  return check;
};

export const emptyCurrencyObj = { symbol: " ", code: " ", decimal: "." };

export const ignoredCurrencySymbols = ["SEK", "NOK", "DKK", "CHF", "CZK"];

export const roundNumber = (num, decimalChar) => {
  const absNum = Math.abs(num);
  let formattedNum;

  if (absNum < 10) {
    formattedNum = absNum.toFixed(2);
  } else if (absNum < 100) {
    formattedNum = absNum.toFixed(1);
  } else {
    formattedNum = Math.floor(absNum).toString();
  }

  const result = parseFloat(num < 0 ? `-${formattedNum}` : formattedNum).toString();

  return result.replace(".", decimalChar);
};

export const formatNumberToMagnitude = (num, decimalChar) => {
  if (num >= 1.0e9) return `${roundNumber(num / 1.0e9, decimalChar)}B`;
  else if (num >= 1.0e6) return `${roundNumber(num / 1.0e6, decimalChar)}M`;
  else if (num >= 1.0e3) return `${roundNumber(num / 1.0e3, decimalChar)}K`;
  else return `${roundNumber(num, decimalChar)}`;
};

export const aggregateTimeOpts = [
  { _id: "1d", name: "1 Day" },
  { _id: "7d", name: "7 Days" },
  { _id: "14d", name: "14 Days" },
  { _id: "1m", name: "1 Month" },
];
