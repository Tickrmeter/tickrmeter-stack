import * as yup from "yup";

import { CheckSquare, Download, UploadCloud } from "react-feather";
import { useState } from "react";
import http from "@src/utility/http";
import { ApiEndPoint, API_PATHS } from "@src/redux/api-paths";
import { Button } from "reactstrap";
import ModalComponent from "@src/@core/components/modal";

// ***************** VALIDATION SCHEMAS ***************//

const yString = yup.string();

export const FirmwareSchema = yup.object().shape({
  version: yString.required("Version No is required!").max(5, "Version must be at most 5 charachters."),
  firmwareFile: yup.mixed().test("fileLength", "Kindly select the file.", (value) => value?.length),
});

export const firmwareDefaults = {
  firmwareFile: null,
  isRelease: false,
  version: "",
};

export const PushAction = ({ message, onPushFirmware }) => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <Button className="btn-icon" color="flat-primary" onClick={() => setShowModal(!showModal)}>
        <UploadCloud size={32} />
      </Button>
      <ModalComponent
        body={message}
        title="Push Firmware"
        headerClass="modal-danger"
        showModal={showModal}
        setShowModal={setShowModal}
        onClickConfirm={onPushFirmware}
      ></ModalComponent>
    </>
  );
};

// ** Column because of custom onClick
export const GetPushFirmwareCol = ({ pushAction }) => {
  return {
    name: "Push",
    sortable: false,
    center: true,
    minWidth: "150px",
    cell: (row) => {
      return (
        <div style={{ display: "flex", justifyContent: "space-around", width: "100%" }}>
          <PushAction
            onPushFirmware={() => pushAction(row._id)}
            message={
              <>
                Are you sure to push <strong>{row.fileName}</strong> to all Devices?
              </>
            }
          />
        </div>
      );
    },
  };
};

export const columns = [
  {
    name: "File Name",
    selector: (row) => row.fileName,
    sortable: true,
    minWidth: "350px",
  },
  {
    name: "Version",
    selector: (row) => row.version,
    sortable: true,
    minWidth: "150px",
  },
  {
    name: "Release",
    selector: (row) => row.isRelease,
    center: true,
    sortable: true,
    minWidth: "100px",
    cell: (row) => {
      return <div>{row.isRelease ? <CheckSquare color="#0eb663" /> : ""}</div>;
    },
  },
  {
    name: "Added By",
    selector: (row) => row.uploadedBy.name,
    sortable: true,
    minWidth: "250px",
  },
  {
    name: "Created On",
    selector: (row) => row.createdAt,
    sortable: true,
    minWidth: "250px",
  },

  {
    name: "Download",
    sortable: false,
    center: true,
    minWidth: "150px",
    cell: (row) => (
      <Button
        className="btn-icon"
        color="flat-primary"
        onClick={() => http.download(`${ApiEndPoint(API_PATHS.DOWNLOAD_FIRMWARE)}/${row._id}`, row.fileName)}
      >
        <Download size={32} />
      </Button>
    ),
  },
  // {
  //   name: "Actions",
  //   sortable: false,
  //   center: true,
  //   width: "160px",
  //   cell: (row) => {
  //     return (
  //       <div style={{ display: "flex", justifyContent: "space-around", width: "100%" }}>
  //         <DeleteAction id={row.id} message="Are you sure to delete this Device?" />
  //       </div>
  //     );
  //   },
  // },
  // ** Action cols are added in the component file as we need to customize the edit and delete actions
];
