import { Mail, Home, Users, Cpu } from "react-feather";

export default [
  {
    id: "home",
    title: "Home",
    icon: <Home size={20} />,
    navLink: "/home",
  },
  {
    id: "my-devices",
    title: "My Devices",
    icon: <Mail size={20} />,
    navLink: "/my-devices",
  },
  {
    id: "users",
    title: "Users",
    icon: <Users size={20} />,
    navLink: "/admin/users",
  },
  {
    id: "Devices",
    title: "Devices",
    icon: <Users size={20} />,
    navLink: "/admin/devices",
  },
  {
    id: "Playlists",
    title: "Play Lists",
    icon: <Users size={20} />,
    navLink: "/admin/devices",
  },
];
