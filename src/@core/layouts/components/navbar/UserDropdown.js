// ** React Imports
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

// ** Custom Components
import Avatar from "@components/avatar";

// ** Utils
import { isUserLoggedIn } from "@utils";

// ** Store & Actions
import { useDispatch, useSelector } from "react-redux";
import { handleLogout } from "@store/actions/auth";
import { useNavigate } from "react-router";

// ** Third Party Components
import { UncontrolledDropdown, DropdownMenu, DropdownToggle, DropdownItem } from "reactstrap";
import { User, Power, Cpu } from "react-feather";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import PopoverSetup from "@components/popover-setup";

import meta from "@src/metadata.json";
// ** Default Avatar Image

const UserDropdown = () => {
  const navigate = useNavigate();

  // ** Store Vars
  const dispatch = useDispatch();
  const store = useSelector((state) => state.auth.userData);

  // ** State
  const [userData, setUserData] = useState(null);

  //** ComponentDidMount
  useEffect(() => {
    if (isUserLoggedIn() !== null) {
      setUserData(store);
    }
  }, [store]);

  //** Vars

  return (
    <UncontrolledDropdown id={"dropdown-user"} tag="li" className="dropdown-user nav-item">
      <DropdownToggle href="/" tag="a" className="nav-link dropdown-user-link" onClick={(e) => e.preventDefault()}>
        <div className="user-nav d-sm-flex d-none">
          <span className="user-name font-weight-bold">{userData?.name || "John Doe"}</span>
          <span className="user-status">{userData?.isAdmin ? "Admin " : ""}</span>
        </div>
        <Avatar initials={true} content={userData?.name || ""} size="lg" color="light-primary" />
      </DropdownToggle>
      <DropdownMenu right>
        <DropdownItem tag={Link} to="/user-devices">
          <Cpu size={14} className="mr-75" />
          <span className="align-middle">User Devices</span>
        </DropdownItem>

        <DropdownItem tag={Link} to="/profile">
          <User size={14} className="mr-75" />
          <span className="align-middle">Profile</span>
        </DropdownItem>

        <DropdownItem tag={Link} to="/login" onClick={() => dispatch(handleLogout())}>
          <Power size={14} className="mr-75" />
          <span className="align-middle">Logout</span>
        </DropdownItem>

        {userData?.isAdmin && (
          <>
            <DropdownItem divider />
            <DropdownItem tag="div">{meta?.version || ""}</DropdownItem>
          </>
        )}
      </DropdownMenu>
      <PopoverSetup
        placement="bottom"
        target="dropdown-user"
        triggeringCookie={"ShowLast"}
        body={"Get notified by the LED light when the price is higher or lower than a custom value."}
        title={"See your other devices"}
        confirmButtonTitle={"Okay"}
        icon={<FontAwesomeIcon icon={faCheck} />}
        nextCookieValue={"none"}
      ></PopoverSetup>
    </UncontrolledDropdown>
  );
};

export default UserDropdown;
