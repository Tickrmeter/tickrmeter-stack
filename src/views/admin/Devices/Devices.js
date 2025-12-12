import { useEffect, useState } from "react";
import http from "@src/utility/http";
import { ApiEndPoint, API_PATHS } from "@src/redux/api-paths";

import DataTable from "@components/datatable2";
import { GetActionCol } from "@src/utility/datatable-common";
import { columns } from "./helper";

import { toast, Slide } from "react-toastify";
import ToastContent from "@src/utility/toast-content";

import DeviceForm from "./DeviceForm";
import { Spinner } from "reactstrap";

const Devices = () => {
  const [devices, setDevices] = useState({});

  //doing this to update the grid, need to come up with some other solution //Redux store didnt worked
  const [refreshGrid, setRefreshGrid] = useState(false);

  const [loading, setLoading] = useState(false);
  // ** set edit id here which is passed in ActionCol below for setting up the edit action in grid.
  const [editDeviceId, setEditDeviceId] = useState(null);

  // ** Get data on mount
  useEffect(() => {
    //dispatch(getAllDevices());
    getAllDevices(1, 10, "createdAt:desc");
  }, [refreshGrid]);

  const getAllDevices = async (_page, _pageSize, sortBy, searchText) => {
    try {
      setLoading(true);

      const API_URI = `${ApiEndPoint(API_PATHS.ALL_DEVICES)}?p=${_page}&ps=${_pageSize}&s=${sortBy}${
        searchText ? `&q=${searchText}` : ""
      }`;
      const { success, data, message, type } = await http.get(API_URI);

      if (success) {
        setDevices(data);
      } else {
        toast.error(
          <ToastContent
            type="danger"
            title="Unable to fetch users!"
            body={type === 1 ? message : "Unable to fetch users, please try again later"}
          />,
          { transition: Slide, hideProgressBar: true, autoClose: 4000 }
        );
      }
    } catch (error) {
      toast.error(
        <ToastContent
          type="danger"
          title="Unable to fetch users!"
          body={"Error while fetching users, please try again later"}
        />,
        { transition: Slide, hideProgressBar: true, autoClose: 4000 }
      );
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // ** Delete Device API Call
  const deleteDevice = async (id) => {
    const API_URI = `${ApiEndPoint(API_PATHS.DELETE_DEVICE)}/${id}`;

    const { success, message, type } = await http.delete(API_URI, { _id: id });

    if (success) {
      toast.success(<ToastContent type="success" title="Success!" body={"Device deleted successfully!"} />, {
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
          body={type === 1 ? message : "Unable to delete device, please try again later"}
        />,
        { transition: Slide, hideProgressBar: true, autoClose: 4000 }
      );
    }
  };

  const ActionCol = GetActionCol({
    editAction: setEditDeviceId,
    deleteAction: deleteDevice,
    nameKey: "name",
    msgSuffix: "device",
  });

  const deviceColumns = [...columns, ActionCol];

  const searchDevice = (searchText) => {
    getAllDevices(1, 10, "createdAt:desc", searchText);
  };

  // const title = (
  //   <div className="d-flex justify-content-between align-items-center">
  //     <h4>All Devices</h4>
  //     <div>{loading && <Spinner color="primary" size="md" />}</div>
  //   </div>
  // );

  return (
    <>
      <DeviceForm
        postSubmit={setRefreshGrid}
        refreshGrid={refreshGrid}
        editDeviceId={editDeviceId}
        setEditDeviceId={setEditDeviceId}
      />
      <DataTable
        title={"All Devices"}
        loading={loading}
        titleType="component"
        columns={deviceColumns}
        data={devices}
        getData={getAllDevices}
        sort={"createdAt:desc"}
        search={{
          enabled: true,
          placeholder: "Search by mac address",
          onSearch: (value) => searchDevice(value),
        }}
      />
    </>
  );
};
export default Devices;
