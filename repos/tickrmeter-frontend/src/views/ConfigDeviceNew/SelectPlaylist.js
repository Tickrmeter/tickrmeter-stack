import { useState, useEffect } from "react";
import { Alert, Button, Col, FormGroup, Row, Spinner } from "reactstrap";
import { Slide, toast } from "react-toastify";

import { AlertCircle } from "react-feather";

import http from "@src/utility/http";
import { ApiEndPoint, API_PATHS } from "@src/redux/api-paths";
import ToastContent from "@src/utility/toast-content";

import { SelectField } from "@src/utility/input-fields";

import PlaylistForm from "../PlaylistsNew/PlaylistForm";

const SelectPlaylist = ({ deviceId, hideForm, selectedPlaylistSt }) => {
  const [serverError, setServerError] = useState();
  const [loading, isLoading] = useState(false);

  const [myPlaylists, setMyPlaylists] = useState("");
  const [editPlaylistId, setEditPlaylistId] = useState("");

  const { selectedPlaylist, setSelectedPlaylist } = selectedPlaylistSt;

  useEffect(() => {
    getMyPlaylists();
  }, []);

  const getMyPlaylists = async () => {
    try {
      const { success, data: playlists, message, type } = await http.get(`${ApiEndPoint(API_PATHS.MY_PLAYLISTS)}`);

      if (success) {
        const pls = playlists.map((p) => ({ _id: p._id, name: p.name }));

        setMyPlaylists([{ _id: "-1", name: "-- Select Playlist --" }, ...pls]);
      } else {
        if (type === 1) setServerError(message);
        else setServerError("There is an error processing your request, Please try again later.");
      }
    } catch (error) {
      setServerError("There is an error processing your request, Please try again later.");
    }
    window.scrollTo({
      top: 20,
      behavior: "smooth",
    });
  };

  const postSubmit = () => {
    getMyPlaylists();
  };

  const sendPlaylistToTickrmeter = async () => {
    try {
      isLoading(true);
      //console.log(selectedPlaylist);
      const data = {
        deviceId,
        isPlaylist: true,
        playlistId: selectedPlaylist,
      };

      const { success, message, type } = await http.post(`${ApiEndPoint(API_PATHS.QUOTE_PUSH_MARKET)}`, data);

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
          <div className="p-2">
            <Row className="justify-content-center">
              <Col xs="12" lg="8" className="mt-1">
                <SelectField
                  name="playlist"
                  label="Select Playlist"
                  options={myPlaylists || []}
                  value={selectedPlaylist}
                  onChange={(e) => setSelectedPlaylist(e.target.value)}
                  disabled={editPlaylistId === "new"}
                />
              </Col>
            </Row>
          </div>
        </Col>

        <Col sm="12">
          <div className="mx-2">
            <PlaylistForm
              postSubmit={postSubmit}
              editPlaylistId={editPlaylistId}
              setEditPlaylistId={setEditPlaylistId}
            />
          </div>
        </Col>
      </Row>

      {editPlaylistId !== "new" && (
        <Row className="justify-content-center">
          <Col xs="7" className="mt-1 mb-1 text-center">
            {loading ? (
              <Spinner type="grow" color="primary" style={{ width: "3rem", height: "3rem" }} />
            ) : (
              <FormGroup className="d-block mb-0">
                <Button.Ripple
                  className="mr-1"
                  color="primary"
                  disabled={selectedPlaylist === "-1" || selectedPlaylist === ""}
                  onClick={sendPlaylistToTickrmeter}
                >
                  Send to Tickrmeter
                </Button.Ripple>
              </FormGroup>
            )}
          </Col>
        </Row>
      )}
    </>
  );
};

export default SelectPlaylist;
