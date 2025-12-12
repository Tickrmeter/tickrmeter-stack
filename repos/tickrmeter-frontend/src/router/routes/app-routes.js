import Login from "@src/views/auth/Login";
import { lazy } from "react";
import { Navigate } from "react-router-dom";

const MyDevices = lazy(() => import("./../../views/ConfigDeviceNew/MyDevices"));
const UserDevices = lazy(() => import("@views/UserDevices/UserDevices"));
const CreatePlaylist = lazy(() => import("../../views/DevicePlaylist/CreatePlaylist"));
const Playlists = lazy(() => import("../../views/DevicePlaylist/Playlists"));
const MyPlaylists = lazy(() => import("../../views/PlaylistsNew/MyPlaylists"));
const RegisterDevice = lazy(() => import("../../views/ConfigDeviceNew/RegisterDevice"));
const Profile = lazy(() => import("../../views/Profile/Profile"));
const Users = lazy(() => import("../../views/admin/Users/User"));
const Firmware = lazy(() => import("../../views/admin/Firmware/Firmware"));
const Top10 = lazy(() => import("../../views/admin/Top10/Top10"));
const Devices = lazy(() => import("../../views/admin/Devices/Devices"));
//const Login = lazy(() => import("../../views/auth/Login"));
const Register = lazy(() => import("../../views/auth/Register"));
const Confirm = lazy(() => import("../../views/auth/Confirm"));
const ForgotPassword = lazy(() => import("../../views/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("../../views/auth/ResetPassword"));
const Error = lazy(() => import("../../views/errors/Error"));
const Setup = lazy(() => import("../../views/setup/Setup"));
const ThirdPartyTest = lazy(() => import("../../views/ThirdPartyTest"));

// ** Default Route
const DefaultRoute = "/my-devices";

const Routes = [
  {
    path: "/",
    index: true,
    element: <Navigate replace to={DefaultRoute} />,
  },
  {
    path: "/user-devices",
    element: <UserDevices />,
  },
  {
    path: "/my-devices/:id",
    //component: lazy(() => import("../../views/ConfigDeviceNew/MyDevices")),
    element: <MyDevices />,
  },
  {
    path: "/my-devices",
    //component: lazy(() => import("../../views/ConfigDeviceNew/MyDevices")),
    element: <MyDevices />,
  },
  {
    path: "/my-devices/playlist/create",
    //component: lazy(() => import("../../views/DevicePlaylist/CreatePlaylist")),
    element: <CreatePlaylist />,
  },
  {
    path: "/my-devices/playlist",
    //component: lazy(() => import("../../views/DevicePlaylist/Playlists")),
    element: <Playlists />,
  },
  {
    path: "/my-playlists",
    //component: lazy(() => import("../../views/PlaylistsNew/MyPlaylists")),
    element: <MyPlaylists />,
  },
  {
    path: "/register-devices",
    //component: lazy(() => import("../../views/ConfigDeviceNew/RegisterDevice")),
    element: <RegisterDevice />,
  },
  {
    path: "/profile",
    //component: lazy(() => import("../../views/Profile/Profile")),
    element: <Profile />,
  },
  {
    path: "/admin/users",
    //component: lazy(() => import("../../views/admin/Users/User")),
    element: <Users />,
  },
  {
    path: "/admin/firmware",
    //component: lazy(() => import("../../views/admin/Firmware/Firmware")),
    element: <Firmware />,
  },
  {
    path: "/admin/top10",
    //component: lazy(() => import("../../views/admin/Top10/Top10")),
    element: <Top10 />,
  },
  {
    path: "/admin/devices",
    //component: lazy(() => import("../../views/admin/Devices/Devices")),
    element: <Devices />,
  },

  {
    path: "/login",
    //component: lazy(() => import("../../views/auth/Login")),
    layout: "BlankLayout",
    element: <Login />,
    meta: {
      layout: "blank",
      authRoute: true,
    },
  },
  {
    path: "/register",
    //component: lazy(() => import("../../views/auth/Register")),
    layout: "BlankLayout",
    element: <Register />,
    meta: {
      layout: "blank",
      authRoute: true,
    },
  },
  {
    path: "/jt-arch",
    //component: lazy(() => import("../../views/auth/Register")),
    layout: "BlankLayout",
    element: <Register />,
    meta: {
      layout: "blank",
      authRoute: true,
    },
  },
  {
    path: "/register-fxon",
    layout: "BlankLayout",
    element: <Register />,
    meta: {
      layout: "blank",
      authRoute: true,
    },
  },
  {
    path: "/confirm/:token",
    //component: lazy(() => import("../../views/auth/Confirm")),
    layout: "BlankLayout",
    element: <Confirm />,
    meta: {
      layout: "blank",
      authRoute: true,
    },
  },
  {
    path: "/confirm",
    //component: lazy(() => import("../../views/auth/Confirm")),
    layout: "BlankLayout",
    element: <Confirm />,
    meta: {
      layout: "blank",
      authRoute: true,
    },
  },
  {
    path: "/forgot-password",
    //component: lazy(() => import("../../views/auth/ForgotPassword")),
    layout: "BlankLayout",
    element: <ForgotPassword />,
    meta: {
      layout: "blank",
      authRoute: true,
    },
  },
  {
    path: "/reset-password/:token",
    //component: lazy(() => import("../../views/auth/ResetPassword")),
    layout: "BlankLayout",
    element: <ResetPassword />,
    meta: {
      layout: "blank",
      authRoute: true,
    },
  },
  {
    path: "/reset-password",
    //component: lazy(() => import("../../views/auth/ResetPassword")),
    layout: "BlankLayout",
    element: <ResetPassword />,
    meta: {
      layout: "blank",
      authRoute: true,
    },
  },
  {
    path: "/error",
    //component: lazy(() => import("../../views/errors/Error")),
    element: <Error />,
    layout: "BlankLayout",
  },
  {
    path: "/setup",
    //component: lazy(() => import("../../views/setup/Setup")),
    layout: "BlankLayout",
    element: <Setup />,
    meta: {
      layout: "blank",
      publicRoute: true,
    },
  },
  {
    path: "/third-party",
    //component: lazy(() => import("../../views/ThirdPartyTest")),
    layout: "BlankLayout",
    element: <ThirdPartyTest />,
    meta: {
      layout: "blank",
      authRoute: false,
      publicRoute: true,
    },
  },
];

export { DefaultRoute, Routes };
