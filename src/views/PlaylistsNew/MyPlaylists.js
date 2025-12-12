import { useEffect, useState } from "react";

import { useDispatch } from "react-redux";

import DataTable from "@components/datatable";
import { getMyDevices, getMyPlaylists } from "@store/actions/data";

import { columns, GetConfigCol, GetDisableAlertCol, GetNameAndStatusCol, GetNameCol, mobileColums } from "./helper";

import http from "@src/utility/http";
import { ApiEndPoint, API_PATHS } from "@src/redux/api-paths";

import ToastContent from "@src/utility/toast-content";
import { Slide, toast } from "react-toastify";
import { Row, Col, Button } from "reactstrap";

import PlaylistForm from "./PlaylistForm";
import { GetActionCol } from "@src/utility/datatable-common";
import useIsLargeScreen from "@src/utility/hooks/useIsLargeScreen";
import { isMobile } from "../ConfigDeviceNew/helper";

const MyPlaylists = () => {
  const dispatch = useDispatch();

  //doing this to update the grid, need to come up with some other solution //Redux store didnt worked
  const [refreshGrid, setRefreshGrid] = useState(false);
  const [editPlaylistId, setEditPlaylistId] = useState(null);
  const isLargeScreen = useIsLargeScreen(815);

  // ** Get data on mount
  useEffect(() => {
    dispatch(getMyPlaylists());
  }, [dispatch, refreshGrid]);

  //const Edit = GetConfigCol({ onClickAction: (deviceId) => setConfigDevice(deviceId) });
  // const NameAndStatusCol = GetNameAndStatusCol({
  //   onClickAction: (deviceId) => setConfigDevice(deviceId),
  // });

  //add NameCol after 1st col

  const closeAndRefresh = (shouldRefresh) => {
    setEditPlaylistId(null);
    if (shouldRefresh) setRefreshGrid(!refreshGrid);
  };


  const onRowClicked = (row) => {
    if (isMobile()) {
      setEditPlaylistId(row._id);
    } else {
      //console.log(row);
    }
  };

  // ** Delete Device API Call
  const deletePlaylist = async (id) => {
    const API_URI = `${ApiEndPoint(API_PATHS.DELETE_PLAYLIST)}/${id}`;

    const { success, message, type } = await http.delete(API_URI, { _id: id });

    if (success) {
      toast.success(<ToastContent type="success" title="Success!" body={"Playlist deleted successfully!"} />, {
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
    editAction: setEditPlaylistId,
    deleteAction: deletePlaylist,
    nameKey: "name",
    msgSuffix: "playlist",
  });
  const playlistColumns = !isLargeScreen ? [...mobileColums, ActionCol] : [...columns, ActionCol];
  return (
    <Row className="justify-content-center">
      <Col md={12} lg={12} xl={10} className="xxlg-screens">
        <PlaylistForm
          postSubmit={setRefreshGrid}
          refreshGrid={refreshGrid}
          editPlaylistId={editPlaylistId}
          setEditPlaylistId={setEditPlaylistId}
        />
        <DataTable
          title={
            <div className="d-flex justify-content-between">
              <h4>Playlists</h4>
            </div>
          }
          titleType="component"
          columns={playlistColumns}
          storekey="myPlaylists"
          onRowClicked={onRowClicked}
        ></DataTable>
      </Col>
    </Row>
  );
};
export default MyPlaylists;
