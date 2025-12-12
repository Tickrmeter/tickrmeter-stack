import { useState, useEffect } from "react";
import { useNavigate } from "react-router";

import { getTimeZones } from "@vvo/tzdb";

import ModalComponent from "@src/@core/components/modal";
import "react-slidedown/lib/slidedown.css";

import { AlertTriangle, AlertCircle, LogOut, Delete, Save } from "react-feather";

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

import { Card, CardHeader, Form, FormGroup, Button, CardBody, CardTitle, Row, Col, Alert, Spinner } from "reactstrap";

//import { CheckBoxField, InputField, SelectField } from "@src/utility/input-fields";
import { CheckBoxField } from "@src/utility/input-fields-new";
import { CheckBoxFieldControl, InputField } from "@components/fields/input-fields-new";
import { SelectField, SelectFieldControl } from "@components/fields/SelectField";

import http from "@src/utility/http";
import { ApiEndPoint, API_PATHS } from "@src/redux/api-paths";

import { toast, Slide } from "react-toastify";
import ToastContent from "@src/utility/toast-content";

import { ProfileSchema, profileDefaults } from "./helper";

import { useDispatch } from "react-redux";
import { handleLogin, handleLogout } from "@src/redux/actions/auth";

import { countries_list, labelClassName } from "../auth/helper";

const Profile = () => {
  // ** Component States
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  const [timeZones, setTimeZones] = useState([]);
  const [serverError, setServerError] = useState(null);

  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loading2, setLoading2] = useState(false);

  // ** React Hook form
  const { register, formState, control, handleSubmit, reset, watch } = useForm({
    mode: "onChange",
    resolver: yupResolver(ProfileSchema),
    defaultValues: { ...profileDefaults },
  });

  const { errors } = formState;

  useEffect(() => {
    getProfile();
    const simplifiedTz = getTimeZones().map((tz) => ({
      _id: tz.name,
      name: `${tz.name} (GMT${tz.currentTimeFormat.substring(0, 6)})`,
    }));
    setTimeZones(simplifiedTz);
  }, []);

  //** Edit User */
  const getProfile = async () => {
    try {
      setLoading2(true);
      const { success, data: user, message, type } = await http.get(`${ApiEndPoint(API_PATHS.PROFILE)}`);

      if (success) {
        const formVals = {
          ...user,
          timeZone: user.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
          country: user?.meta?.country || "",
        };

        //console.log({ formVals });

        setUserDetails({ ...formVals });
        reset({ ...formVals });
        setLoading2(false);
      } else {
        if (type === 1) setServerError(message);
        else setServerError("There is an error processing your request, Please try again later.");
      }
    } catch (error) {
      setServerError("There is an error processing your request, Please try again later.");
    }
  };

  // ** Form Events

  const onSubmit = async (formData) => {
    //if (formState.isValid) {
    const meta = { ...userDetails.meta, country: formData.country };
    const { success, message, data, type } = await http.put(`${ApiEndPoint(API_PATHS.PROFILE)}`, {
      ...formData,
      meta,
      _id: userDetails._id,
    });

    if (success) {
      showToast();
      const userData = { ...data.userData, accessToken: data.token, menuItems: data.menuItems };
      //reset({ ...profileDefaults });
      setServerError(null);
      dispatch(handleLogin(userData));
      navigate("/my-devices");
    } else {
      if (type === 1) setServerError(message);
      else setServerError("There is an error processing your request, Please try again later.");
    }
  };

  const showToast = () => {
    toast.success(<ToastContent type="success" title="Success!" body={`Profile updated successfully!`} />, {
      transition: Slide,
      hideProgressBar: true,
      autoClose: 2000,
    });
  };

  const onDeleteConfirm = async () => {
    try {
      setLoading(true);

      const { success } = await http.post(`${ApiEndPoint(API_PATHS.DELETE_ACCOUNT)}`, {
        //email: userDetails.email,
        //password: deletePassword,
      });

      if (!success) {
        setDeleteError("Invalid Password, please try again.");
        return;
      }

      setShowModal(false);
      localStorage.removeItem("userData");
      localStorage.removeItem("menuItems");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      window.location.href = "/login";
    } catch (error) {
      setDeleteError("There is an error processing your request, Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const onModalClose = () => {
    setDeletePassword("");
    setDeleteError(null);
    setShowModal(false);
  };

  const logoutUser = () => {
    dispatch(handleLogout());
    navigate("/login");
  };

  const enableFRWatch = watch("enableFastRefresh");

  // ** Render form, in a function to clear the render function
  const renderForm = () => (
    <Form className="pt-1" onSubmit={handleSubmit(onSubmit)}>
      <Row>
        <Col sm="12">
          <InputField
            name="name"
            labelProps={{ label: "Full Name" }}
            placeholder="John"
            register={register}
            error={errors?.name}
          />
        </Col>
        <Col sm="12">
          <InputField
            name="email"
            labelProps={{ label: "Email" }}
            //readOnly={userDetails?._id}
            //disabled={userDetails?._id}
            placeholder="john@example.com"
            register={register}
            error={errors?.email}
          />
        </Col>
        <Col sm="12">
          <SelectFieldControl
            name="country"
            control={control}
            labelProps={{ label: "Country" }}
            placeholder={`Select your country...`}
            options={countries_list}
            error={errors?.country}
          />
        </Col>
        <Col sm="12">
          <SelectFieldControl
            name="timeZone"
            labelProps={{ label: "Timezone" }}
            control={control}
            options={timeZones}
            error={errors?.timeZone}
          />
        </Col>

        <Col sm="12">
          <SelectFieldControl
            name="timeFormat"
            labelProps={{ label: "Time Format" }}
            control={control}
            options={[
              { _id: "12h", name: "12 Hours" },
              { _id: "24h", name: "24 Hours" },
            ]}
            error={errors?.timeFormat}
          />
        </Col>
        <Col sm="12">
          <InputField
            type="password"
            labelProps={{ label: "Password" }}
            name="password"
            placeholder="********"
            register={register}
            error={errors?.password}
          />
        </Col>
        <Col sm="12">
          <InputField
            type="password"
            labelProps={{ label: "Confirm Password" }}
            name="confirmPassword"
            placeholder="********"
            register={register}
            error={errors?.confirmPassword}
          />
        </Col>
        <Col sm="12">
          <CheckBoxFieldControl
            control={control}
            name="enableFastRefresh"
            labelProps={{ label: "Enable experimental fast refresh mode?", labelType: "component" }}
          />
          {enableFRWatch && (
            <div className="m-2">
              We recommend keeping the refresh rate to minimum 1m for longer normal usage as faster refresh rates can
              wear on the display at prolonged usage.{" "}
            </div>
          )}
        </Col>
        <Col sm="12">
          <FormGroup className="d-flex mb-0">
            <Button.Ripple className="mr-1 mt-1" color="primary" type="submit">
              <Save size="20" /> Save
            </Button.Ripple>
          </FormGroup>
        </Col>
        <Col sm="12" className="d-flex justify-content-end">
          <FormGroup className="d-flex mb-0">
            <Button.Ripple className="mt-5" color="danger" type="button" onClick={() => setShowModal(true)}>
              <Delete size="20" /> Delete Account
            </Button.Ripple>
          </FormGroup>
        </Col>
      </Row>
      <ModalComponent
        body={
          <ModalBody deletePassword={deletePassword} setDeletePassword={setDeletePassword} deleteError={deleteError} />
        }
        title={
          <div className="text-white">
            <AlertTriangle size={28} /> Delete your account?
          </div>
        }
        headerClass2="bg-danger text-white"
        headerClass="modal-danger"
        isCloseOnConfirm={false}
        showModal={showModal}
        setShowModal={onModalClose}
        onClickConfirm={onDeleteConfirm}
        confirmButtonTitle={
          loading ? (
            <>
              <Spinner size="sm" color="white" />
            </>
          ) : (
            "Yes, Delete my account!"
          )
        }
      ></ModalComponent>
    </Form>
  );

  return (
    <Row className="justify-content-center">
      <Col sm="6">
        <Card>
          <CardHeader className="border-bottom w-full">
            <CardTitle className="d-flex justify-content-between w-full">
              <h4> My Profile</h4>
            </CardTitle>
            <Button.Ripple onClick={() => logoutUser()} color="link" size="sm" className="secondary-link">
              <LogOut size="22" /> Logout
            </Button.Ripple>
          </CardHeader>

          <CardBody>
            {serverError && (
              <Alert color="danger" isOpen={serverError !== null} fade={true}>
                <div className="alert-body">
                  <AlertCircle size={15} />
                  <span className="ml-1">{serverError}</span>
                </div>
              </Alert>
            )}
            {loading2 ? (
              <Row>
                <Col sm="12" className="d-flex mt-1 w-100 align-items-center justify-content-between">
                  Loading ... <Spinner color="primary" />
                </Col>
              </Row>
            ) : (
              renderForm()
            )}
          </CardBody>
        </Card>
      </Col>
    </Row>
  );
};

export default Profile;

const ModalBody = ({ deletePassword, setDeletePassword, deleteError }) => {
  return (
    <>
      <p>Are you sure you want to delete your account? This action cannot be undone.</p>
      <p>This will also delete all playlists and devices associated with this account.</p>

      <InputField
        type="password"
        label="Confirm Password"
        name="password"
        placeholder="********"
        onChange={(e) => setDeletePassword(e.target.value)}
        value={deletePassword}
        error={deleteError ? { message: deleteError } : null}
      />
    </>
  );
};
