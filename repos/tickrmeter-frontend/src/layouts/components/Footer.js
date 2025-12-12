import { Home, Menu, Settings, User } from "react-feather";
import { NavLink } from "react-router-dom";

const CustomFooter = (props) => {
  //  console.log("Footer:", props);

  return (
    <div className="mobile-bottom-menu">
      <NavLink className="mobile-bottom-menu-item" to="/my-devices">
        <Home className="icon" />
        Devices
      </NavLink>
      <NavLink className="mobile-bottom-menu-item" to="/my-playlists">
        <Menu className="icon" />
        Playlist
      </NavLink>
      <NavLink className="mobile-bottom-menu-item" to="/user-devices">
        <Settings className="icon" />
        Settings
      </NavLink>
      <NavLink className="mobile-bottom-menu-item" to="/profile">
        <User className="icon" />
        Profile
      </NavLink>
    </div>
  );
};

export default CustomFooter;
