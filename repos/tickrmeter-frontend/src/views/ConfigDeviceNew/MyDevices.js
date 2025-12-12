import React, { useEffect, useState } from "react";

import { useDispatch } from "react-redux";

import DataTable from "@components/datatable";
import { getMyDevices } from "@store/actions/data";

import {
  columns,
  GetConfigCol,
  GetDisableAlertCol,
  GetMobileOnlyCols,
  GetNameAndStatusCol,
  GetNameCol,
  isMobile,
} from "./helper";

import http from "@src/utility/http";
import { ApiEndPoint, API_PATHS } from "@src/redux/api-paths";

import DeviceConfigForm from "./DeviceConfig";

import ToastContent from "@src/utility/toast-content";
import { Slide, toast } from "react-toastify";
import { Row, Col, Button } from "reactstrap";
import { useNavigate, useParams } from "react-router-dom";
import { PlusCircle } from "react-feather";
import moment from "moment";
import ModalComponent from "@components/modal";
import modal_img_1 from "@images/pages/setup/Device_onboarding_1.webp";
import modal_img_2 from "@images/pages/setup/Device_onboarding_2.webp";
import { useCookies } from "react-cookie";
import useIsLargeScreen from "@src/utility/hooks/useIsLargeScreen";

const MyDevices = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const params = useParams();
  const isLargeScreen = useIsLargeScreen(815);
  //doing this to update the grid, need to come up with some other solution //Redux store didnt worked
  const [refreshGrid, setRefreshGrid] = useState(false);

  const [deviceIdMode, setDeviceIdMode] = useState({ deviceId: null, mode: null });

  // ** Get data on mount
  useEffect(() => {
    dispatch(getMyDevices());
  }, [dispatch, refreshGrid]);

  useEffect(() => {
    //check url parmas

    const { id } = params;
    if (id) {
      setTimeout(() => {
        setConfigDevice(id);
      }, 300);
    }
  }, []);

  const disableAlert = async (deviceId) => {
    try {
      const { success, message, type } = await http.post(`${ApiEndPoint(API_PATHS.DISABLE_ALERT)}/${deviceId}`, {
        deviceId,
      });
      //console.log({ success });
      if (success) {
        toast.success(
          <ToastContent
            type="success"
            title="Success!"
            body={"Alert disabled successfully! (if its active on device)"}
          />,
          {
            transition: Slide,
            hideProgressBar: true,
            autoClose: 4000,
          }
        );
      } else {
        toast.error(
          <ToastContent
            type="danger"
            title="Unable to disable alarm!"
            body={type === 1 ? message : "Unable to disable alaram, please try again later."}
          />,
          { transition: Slide, hideProgressBar: true, autoClose: 4000 }
        );
      }
    } catch (error) {
      console.error(error);
      toast.error(
        <ToastContent
          type="danger"
          title="Unable to disable alaram!"
          body={"Unable to disable alaram, please try again later."}
        />,
        { transition: Slide, hideProgressBar: true, autoClose: 4000 }
      );
    }
  };

  const setConfigDevice = (deviceId) => {
    setDeviceIdMode({ deviceId, mode: "config" });
  };

  const ConfigCol = GetConfigCol({ onClickAction: (deviceId) => setConfigDevice(deviceId) });
  const NameAndStatusCol = GetNameAndStatusCol({
    onClickAction: (deviceId) => setConfigDevice(deviceId),
    onFirmwareDownloadClick: (deviceId, firmwareDetails) => showFirmwareDownloadConfirm(deviceId, firmwareDetails),
  });

  const MobileColumn = GetMobileOnlyCols({
    onClickAction: (deviceId) => setConfigDevice(deviceId),
    onFirmwareDownloadClick: (deviceId, firmwareDetails) => showFirmwareDownloadConfirm(deviceId, firmwareDetails),
  });

  const showFirmwareDownloadConfirm = async (deviceId, firmwareDetails) => {
    //console.log("====>", deviceId, firmwareDetails);
    const { id: firmwareId } = firmwareDetails;
    if (!firmwareId || !deviceId) {
      toast.error(
        <ToastContent
          type="danger"
          title="Unable to push!"
          body={type === 1 ? message : "Unable to push firmware, please try again later"}
        />,
        { transition: Slide, hideProgressBar: true, autoClose: 4000 }
      );

      return;
    }
    const API_URI = `${ApiEndPoint(API_PATHS.USER_PUSH_FIRMWARE)}/${firmwareId}`;
    const { success, message, type } = await http.post(API_URI, { _id: firmwareId, deviceId });
    if (success) {
      toast.success(
        <ToastContent
          type="success"
          title="Success!"
          body={"Firmware pushed successfully, it will take few minutes to complete the process!"}
        />,
        {
          transition: Slide,
          hideProgressBar: true,
          autoClose: 4000,
        }
      );
      const fpo = localStorage.getItem("fpd");

      if (fpo) {
        localStorage.setItem("fpd", JSON.stringify({ ...JSON.parse(fpo), [deviceId]: moment() }));
      } else {
        localStorage.setItem("fpd", JSON.stringify({ [deviceId]: moment() }));
      }
      //lcalStorage.setItem("fpd", JSON.stringify({ deviceId, at: moment() }));
    } else {
      toast.error(
        <ToastContent
          type="danger"
          title="Unable to push!"
          body={type === 1 ? message : "Unable to push firmware, please try again later"}
        />,
        { transition: Slide, hideProgressBar: true, autoClose: 4000 }
      );
    }
  };

  const DisableAlertCol = GetDisableAlertCol({ onClickAction: (deviceId) => disableAlert(deviceId) });

  //add NameCol after 1st col

  const deviceColumns = () =>
    !isLargeScreen ? [...MobileColumn] : [...NameAndStatusCol, ...columns, DisableAlertCol, ConfigCol];

  const closeAndRefresh = (shouldRefresh) => {
    setDeviceIdMode({ deviceId: null, mode: null });
    if (shouldRefresh) setRefreshGrid(!refreshGrid);
  };

  const onRowClicked = (row) => {
    if (isMobile()) {
      setConfigDevice(row._id);
    } else {
      //console.log(row);
    }
  };

  // Setup Guide Modals Logic
  const [ShowModalSetup1, setShowModalSetup1] = useState(false);
  const [ShowModalSetup2, setShowModalSetup2] = useState(false);
  const [cookies, setCookie] = useCookies(["setupGuide"]);
  const cookieValue = cookies.setupGuide;
  useEffect(() => {
    if (cookieValue === "On") {
      setShowModalSetup1(!ShowModalSetup1);
      //console.log("yes");
    }
  }, []);

  const onModalOk = () => {
    setShowModalSetup1(false);
    setShowModalSetup2(true);
  };
  const onModalOk2 = () => {
    setShowModalSetup2(false);
    setCookie("setupGuide", "Popover1", { path: "/" });
    navigate("/register-devices");
  };
  return (
    <Row className="justify-content-center">
      <Col md={12} lg={12} xl={10} className="xxlg-screens">
        <ModalComponent
          body={
            <>
              <p className={"setup-modal-heading text-center"}>Get started</p>
              <p className={"setup-modal-body text-center"}>
                Is your TickrMeter connected to your WiFi network? Then you’re ready to connect your device and start
                adding stocks.
              </p>
              <p className={"setup-modal-img text-center"}>
                <img className="img-fluid-6" src={modal_img_1} alt="Tickrmeter" />
              </p>
              <p className={"setup-modal-btn text-center"}>
                <Button color="secondary" onClick={onModalOk}>
                  CONTINUE
                </Button>
              </p>
              <p className={"setup-modal-footer text-center"}></p>
            </>
          }
          headerClass={"setup-modal"}
          setShowModal={setShowModalSetup1}
          showModal={ShowModalSetup1}
        ></ModalComponent>
        <ModalComponent
          body={
            <>
              <p className={"setup-modal-heading text-center"}>Do you see 5 digits on your TickrMeter?</p>
              <p className={"setup-modal-body text-center"}>
                The numbers are your unique code to connect your TickrMeter to your account.
              </p>
              <p className={"setup-modal-img text-center"}>
                <img className="img-fluid-6" src={modal_img_2} alt="Tickrmeter" />
              </p>
              <p className={"setup-modal-btn text-center"}>
                <Button color="secondary" onClick={onModalOk2}>
                  CONNECT DEVICE
                </Button>
              </p>
              <p className={"setup-modal-footer text-center"}>
                The code is valid for 10 minutes. To get a a new code, just turn the device off and on
              </p>
            </>
          }
          headerClass={"setup-modal"}
          setShowModal={setShowModalSetup2}
          showModal={ShowModalSetup2}
        ></ModalComponent>
        {deviceIdMode.deviceId && (
          <>
            {deviceIdMode.mode === "config" && (
              <DeviceConfigForm deviceId={deviceIdMode.deviceId} closeAndRefresh={closeAndRefresh} />
            )}
          </>
        )}

        <DataTable
          title={
            <div className="d-flex justify-content-between">
              <h4>Devices</h4>

              <Button color="primary" size="sm" onClick={() => navigate("/register-devices")}>
                <PlusCircle /> New Device
              </Button>
            </div>
          }
          titleType="component"
          columns={deviceColumns()}
          storekey="myDevices"
          onRowClicked={onRowClicked}
          search={false}
          headerBackground="#0eb663"
        ></DataTable>
      </Col>
    </Row>
  );
};
export default MyDevices;
