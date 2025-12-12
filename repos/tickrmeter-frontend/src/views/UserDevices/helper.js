import * as yup from "yup";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, UncontrolledTooltip } from "reactstrap";
import { UploadCloud, Settings, Bell } from "react-feather";

import moment from "moment";
// ***************** VALIDATION SCHEMAS ***************//

const yString = yup.string();

export const DeviceSchema = yup.object().shape({
  name: yString.required("Device Name is required!").max(30, "Name must be at most 30 charachters."),
  macAddress: yString
    .required("Mac Address is required!")
    .test("len", "Must be exactly 12 characters", (val) => val.length === 12),
});

export const DeviceRegSchema = yup.object().shape({
  r1: yString.required(),
  r2: yString.required(),
  r3: yString.required(),
  r4: yString.required(),
  r5: yString.required(),
});

export const deviceDefaults = {
  name: "",
  email: "",
  isActive: true,
};

export const deviceRegDefaults = {
  r1: "",
  r2: "",
  r3: "",
  r4: "",
  r5: "",
};

// ** Column because of custom onClick
export const GetOTAUpdateCol = ({ onClickAction }) => {
  return {
    id: "ota-update",
    name: "OTA Update",
    sortable: false,
    center: true,
    width: "150px",
    button: true,
    cell: (row) => {
      return (
        <div style={{ display: "flex", justifyContent: "space-around", width: "100%" }}>
          <Button
            className="btn-icon"
            color="flat-primary"
            onClick={() => onClickAction(row._id)}
            title="Click here to update firmware on devices."
          >
            <UploadCloud size={32} />
          </Button>
        </div>
      );
    },
  };
};
export const mobileCols = [
  {
    id: "name",
    name: "Name",
    sortable: true,
    minWidth: "250px",
    maxWidth: "350px",
    cell: (row) => {
      if (!row.alertEnabled) return row.name || row.macAddress;

      return (
        <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
          {row.name}
          {row.alertEnabled ? (
            <Bell
              size={32}
              color="red"
              href="#"
              id={`alert-${row._id}`}
              style={{
                cursor: "pointer",
              }}
            />
          ) : null}
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
                {row.alertConfig.flashLightbar && "Flashlight Bar"}
                <br />
                {row.alertConfig.playSound && `Play Sound - ${row.alertConfig.soundType}`}
                <br />
                {row.alertConfig.changeLightBarColor && `Light Bar Color - ${row.alertConfig.lightBarColor}`}
              </p>
            </div>
          </UncontrolledTooltip>
        </div>
      );
    },
  },
];

export const columns = [
  {
    id: "name",
    name: "Name",
    sortable: true,
    minWidth: "250px",
    maxWidth: "350px",
    cell: (row) => {
      if (!row.alertEnabled) return row.name;

      return (
        <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
          {row.name}
          {row.alertEnabled ? (
            <Bell
              size={32}
              color="red"
              href="#"
              id={`alert-${row._id}`}
              style={{
                cursor: "pointer",
              }}
            />
          ) : null}
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
                {row.alertConfig.flashLightbar && "Flashlight Bar"}
                <br />
                {row.alertConfig.playSound && `Play Sound - ${row.alertConfig.soundType}`}
                <br />
                {row.alertConfig.changeLightBarColor && `Light Bar Color - ${row.alertConfig.lightBarColor}`}
              </p>
            </div>
          </UncontrolledTooltip>
        </div>
      );
    },
  },
  {
    id: "macAddress",
    name: "Mac Address",
    selector: (row) => row.macAddress,
    sortable: true,
    minWidth: "200px",
    maxWidth: "250px",
  },
  {
    id: "symbol",
    name: "Symbol",
    selector: (row) => row.symbol,
    sortable: true,
    maxWidth: "240px",
  },
  {
    id: "interval",
    name: "Interval",
    selector: (row) => row.interval,
    sortable: true,
    width: "140px",
  },
  {
    id: "firmwareVersion",
    name: "Version",
    sortable: true,
    width: "100px",
    center: true,
    cell: (row) => (row.firmwareVersion ? row.firmwareVersion : "-"),
  },
  {
    id: "createdAt",
    name: "Created On",
    selector: (row) => row.createdAt,
    sortable: true,
    width: "250px",
  },
  // {
  //   id: "isActive",
  //   name: "Active",
  //   selector: "isActive",
  //   sortable: true,
  //   center: true,
  //   width: "150px",
  //   cell: (row) =>
  //     row.isActive ? (
  //       <FontAwesomeIcon icon={["far", "check-circle"]} size="2x" style={{ color: "green" }} />
  //     ) : (
  //       <FontAwesomeIcon icon={["far", "times-circle"]} size="2x" style={{ color: "maroon" }} />
  //     ),
  // },

  // ** Action cols are added in the component file as we need to customize the edit and delete actions
];

//return 15 mins interval of 24 hours
export const getTimeOptions = () => {
  const timeOptions = [];
  const time = moment("00:00", "HH:mm");
  for (let i = 0; i < 96; i++) {
    timeOptions.push({ _id: time.format("HH:mm"), name: time.format("hh:mm A") });
    time.add(15, "m");
  }
  return timeOptions;
};
