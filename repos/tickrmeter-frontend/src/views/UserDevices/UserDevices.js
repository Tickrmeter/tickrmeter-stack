import { useEffect, useState } from "react";

import { useDispatch } from "react-redux";

import DataTable from "@components/datatable";
import { getMyDevices } from "@store/actions/data";
import { GetActionCol } from "@src/utility/datatable-common";
import { columns, GetConfigCol, GetOTAUpdateCol, mobileCols } from "./helper";

import http from "@src/utility/http";
import { ApiEndPoint, API_PATHS } from "@src/redux/api-paths";

import UserDeviceForm from "./UserDeviceForm";
import DeviceFirmwareForm from "./DeviceFirmware";

import ToastContent from "@src/utility/toast-content";
import { Slide, toast } from "react-toastify";
import useIsLargeScreen from "@src/utility/hooks/useIsLargeScreen";

const MyDevices = () => {
  const dispatch = useDispatch();

  //doing this to update the grid, need to come up with some other solution //Redux store didnt worked
  const [refreshGrid, setRefreshGrid] = useState(false);

  const [deviceIdMode, setDeviceIdMode] = useState({ deviceId: null, mode: null });
  const isLargeScreen = useIsLargeScreen();

  // ** Get data on mount
  useEffect(() => {
    dispatch(getMyDevices());
  }, [dispatch, refreshGrid]);

  const removeRegistration = async (id) => {
    const API_URI = `${ApiEndPoint(API_PATHS.REMOVE_DEVICE)}/${id}`;

    const { success, message, type } = await http.put(API_URI, { _id: id });

    if (success) {
      toast.success(<ToastContent type="success" title="Success!" body={"Device removed successfully!"} />, {
        transition: Slide,
        hideProgressBar: true,
        autoClose: 2000,
      });
      setRefreshGrid(!refreshGrid);
    } else {
      toast.error(
        <ToastContent
          type="danger"
          title="Unable to remove!"
          body={type === 1 ? message : "Unable to remove device, please try again later."}
        />,
        { transition: Slide, hideProgressBar: true, autoClose: 4000 }
      );
    }
  };

  const ActionCol = GetActionCol({
    editAction: (deviceId) => setDeviceIdMode({ deviceId, mode: "edit" }),
    deleteAction: removeRegistration,
    width: "100px",
    msgType: "REMOVE_REG",
    nameKey: "name",
    altkey: "macAddress",
  });

  const FirmwareCol = GetOTAUpdateCol({ onClickAction: (deviceId) => setDeviceIdMode({ deviceId, mode: "update" }) });
  const deviceColumns = () => (!isLargeScreen ? [...mobileCols, ActionCol] : [...columns, ActionCol]);

  const closeAndRefresh = (shouldRefresh) => {
    setDeviceIdMode({ deviceId: null, mode: null });
    if (shouldRefresh) setRefreshGrid(!refreshGrid);
  };

  return (
    <>
      {deviceIdMode.deviceId && (
        <>
          {deviceIdMode.mode === "edit" && (
            <UserDeviceForm deviceId={deviceIdMode.deviceId} closeAndRefresh={closeAndRefresh} />
          )}
          {deviceIdMode.mode === "update" && (
            <DeviceFirmwareForm deviceId={deviceIdMode.deviceId} closeAndRefresh={closeAndRefresh} />
          )}
        </>
      )}

      <DataTable title="My Devices" columns={deviceColumns()} storekey="myDevices" search={false}></DataTable>
    </>
  );
};
export default MyDevices;
