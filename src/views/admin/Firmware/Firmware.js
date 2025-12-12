// import DataTable from "@components/datatable";
// import columns from "../../datatable-columns/firmware";

import { useEffect, useState } from "react";

import { useDispatch } from "react-redux";

import DataTable from "@components/datatable";
import { getFirmwares } from "@store/actions/data";
import { GetActionCol } from "@src/utility/datatable-common";
import { columns, GetPushFirmwareCol } from "./helper";

import http from "@src/utility/http";
import { ApiEndPoint, API_PATHS } from "@src/redux/api-paths";

import { toast, Slide } from "react-toastify";
import ToastContent from "@src/utility/toast-content";

import FirmwareForm from "./FirmwareForm";

const Firmware = () => {
  const dispatch = useDispatch();
  const [refreshGrid, setRefreshGrid] = useState(false);

  // ** Get data on mount
  useEffect(() => {
    dispatch(getFirmwares());
  }, [dispatch, refreshGrid]);

  // ** Delete Device API Call
  const deleteFirmware = async (id) => {
    const API_URI = `${ApiEndPoint(API_PATHS.DELETE_FIRMWARE)}/${id}`;

    const { success, message, type } = await http.delete(API_URI, { _id: id });

    if (success) {
      toast.success(<ToastContent type="success" title="Success!" body={"Firmware deleted successfully!"} />, {
        transition: Slide,
        hideProgressBar: true,
        autoClose: 2000,
      });
      setRefreshGrid(!refreshGrid);
    } else {
      toast.error(
        <ToastContent
          type="danger"
          title="Unable to delete!"
          body={type === 1 ? message : "Unable to delete firmware, please try again later."}
        />,
        { transition: Slide, hideProgressBar: true, autoClose: 4000 }
      );
    }
  };

  // ** Push Firmware

  // const onPushFirmware = async (id) => {
  //const API_URI = `${ApiEndPoint(API_PATHS.PUSH_FIRMWARE)}/${id}`;

  //   const { success, message, type } = await http.post(API_URI, { _id: id });

  //   if (success) {
  //     toast.success(<ToastContent type="success" title="Success!" body={"Firmware pushed successfully!"} />, {
  //       transition: Slide,
  //       hideProgressBar: true,
  //       autoClose: 2000,
  //     });
  //     setRefreshGrid(!refreshGrid);
  //   } else {
  //     toast.error(
  //       <ToastContent
  //         type="danger"
  //         title="Unable to push!"
  //         body={type === 1 ? message : "Unable to push firmware, please try again later."}
  //       />,
  //       { transition: Slide, hideProgressBar: true, autoClose: 4000 }
  //     );
  //   }
  // };

  //const pushColumn = { ...GetPushFirmwareCol({ pushAction: onPushFirmware }) };

  const ActionCol = GetActionCol({
    deleteAction: deleteFirmware,
    nameKey: "fileName",
    msgSuffix: "file",
  });

  const firmwareColumns = [...columns, ActionCol];
  return (
    <>
      <FirmwareForm postSubmit={setRefreshGrid} refreshGrid={refreshGrid} />
      <DataTable title="Firmwares" columns={firmwareColumns} storekey="firmwares"></DataTable>
    </>
  );
};

export default Firmware;
