
// ** React Imports
import { NavLink } from "react-router-dom";

// ** Third Party Components
import classnames from "classnames";

// ** Reactstrap Imports
import { Badge } from "reactstrap";

import RFIcon from "@src/utility/react-feather-icon";

const VerticalNavMenuLink = ({ item, activeItem }) => {
  // ** Conditional Link Tag, if item has newTab or externalLink props use <a> tag else use NavLink
  const LinkTag = item.externalLink ? "a" : NavLink;

  // ** Hooks

  return (
    <li
      className={classnames({
        "nav-item": !item.children,
        disabled: item.disabled,
        active: item.navLink === activeItem,
      })}
    >
      <LinkTag
        className="d-flex align-items-center"
        target={item.newTab ? "_blank" : undefined}
        /*eslint-disable */
        {...(item.externalLink === true
          ? {
              href: item.navLink || "/",
            }
          : {
              to: item.navLink || "/",
              className: ({ isActive }) => {
                if (isActive && !item.disabled) {
                  return "d-flex align-items-center active";
                }
              },
            })}
        onClick={(e) => {
          if (item.navLink.length === 0 || item.navLink === "#" || item.disabled === true) {
            e.preventDefault();
          }
        }}
      >
        {item.iconType === "svg" ? (
          <img src={require(`@images/icons/${item.icon}.svg`)} width="20px" style={{ marginRight: "1.1rem" }} />
        ) : item.iconType === "rf" ? (
          <RFIcon icon={item.icon} size="20" />
        ) : (
          "" //no icon handling
        )}
        <span className="menu-item text-truncate">{item.title}</span>

        {item.badge && item.badgeText ? (
          <Badge className="ms-auto me-1" color={item.badge} pill>
            {item.badgeText}
          </Badge>
        ) : null}
      </LinkTag>
    </li>
  );
};

export default VerticalNavMenuLink;