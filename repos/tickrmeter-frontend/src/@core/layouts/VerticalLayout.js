// ** React Imports
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

// ** Store & Actions
import { useSelector, useDispatch } from "react-redux";
import { handleMenuCollapsed, handleContentWidth, handleMenuHidden, handleFooterType } from "@store/actions/layout";

// ** Third Party Components
import classnames from "classnames";
import { ArrowUp } from "react-feather";
import ScrollToTop from "react-scroll-up";
import { Navbar, Button } from "reactstrap";

// ** Configs
import themeConfig from "@configs/themeConfig";

// ** Custom Components
import Customizer from "@components/customizer";
import FooterComponent from "./components/footer";
import NavbarComponent from "./components/navbar";
import SidebarComponent from "./components/menu/vertical-menu";

// ** Custom Hooks
import { useRTL } from "@ui-hooks/useRTL";
import { useSkin } from "@ui-hooks/useSkin";
import { useNavbarType } from "@ui-hooks/useNavbarType";
import { useFooterType } from "@ui-hooks/useFooterType";
import { useNavbarColor } from "@ui-hooks/useNavbarColor";

// ** Styles
import "@styles/base/core/menu/menu-types/vertical-menu.scss";
import "@styles/base/core/menu/menu-types/vertical-overlay-menu.scss";
import { useCookies } from "react-cookie";
import question_image from "@images/icons/question.svg";

import logo from "@src/assets/images/logo/logo_192x192.png";
import tickrmeterLogo from "@images/logo/logot_200x.png";

const VerticalLayout = (props) => {
  const [cookies, setCookie] = useCookies(["setupGuide"]);
  // ** Props
  const { children, navbar, footer, menu, routerProps, currentActiveItem } = props;

  // ** Hooks
  const [skin, setSkin] = useSkin();
  const [isRtl, setIsRtl] = useRTL();
  const [navbarType, setNavbarType] = useNavbarType();
  const [footerType, setFooterType] = useFooterType();
  const [navbarColor, setNavbarColor] = useNavbarColor();

  // ** States
  const [isMounted, setIsMounted] = useState(false);
  const [menuVisibility, setMenuVisibility] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const [showMobileHeader, setShowMobileHeader] = useState(false);

  // ** Store Vars
  const dispatch = useDispatch();
  const layoutStore = useSelector((state) => state.layout);

  // ** Update Window Width
  const handleWindowWidth = () => {
    setWindowWidth(window.innerWidth);
  };

  // ** Vars
  const location = useLocation();
  const contentWidth = layoutStore.contentWidth;
  const menuCollapsed = layoutStore.menuCollapsed;
  const isHidden = layoutStore.menuHidden;

  // ** Toggles Menu Collapsed
  const setMenuCollapsed = (val) => dispatch(handleMenuCollapsed(val));

  // ** Handles Content Width
  const setContentWidth = (val) => dispatch(handleContentWidth(val));

  // ** Handles Content Width
  const setIsHidden = (val) => dispatch(handleMenuHidden(val));

  

  //** This function will detect the Route Change and will hide the menu on menu item click
  useEffect(() => {
    if (menuVisibility && windowWidth < 1200) {
      setMenuVisibility(false);
    }
  }, [location]);

  //** Sets Window Size & Layout Props
  useEffect(() => {
    if (window !== undefined) {
      window.addEventListener("resize", handleWindowWidth);
    }
    //if windowwidth is less than 815 set footer type to sticky
    if (windowWidth <= 815) {
      setFooterType("sticky");
      setShowMobileHeader(true);
      setNavbarType("hidden");

    } else {
      setFooterType("hidden");
      setShowMobileHeader(false);
      setNavbarType("floating");
    }
  }, [windowWidth]);

  //** ComponentDidMount
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // ** Vars
  const footerClasses = {
    static: "footer-static",
    sticky: "footer-fixed",
    hidden: "footer-hidden",
  };

  const navbarWrapperClasses = {
    floating: "navbar-floating",
    sticky: "navbar-sticky",
    static: "navbar-static",
    hidden: "navbar-hidden",
  };

  const navbarClasses = {
    floating: "floating-nav",
    sticky: "fixed-top",
    static: "navbar-static-top",
    hidden: "d-none",
  };

  const bgColorCondition = navbarColor !== "" && navbarColor !== "light" && navbarColor !== "white";

  if (!isMounted) {
    return null;
  }

  const helpGuide = () => {
    setCookie("setupGuide", "Popover1", { path: "/" });
    window.location.href = "/register";
  };
  return (
    <div
      className={classnames(
        `wrapper vertical-layout ${navbarWrapperClasses[navbarType] || "navbar-floating"} ${
          footerClasses[footerType] || "footer-static"
        }`,
        {
          // Modern Menu
          "vertical-menu-modern": windowWidth >= 1200,
          "menu-collapsed": menuCollapsed && windowWidth >= 1200,
          "menu-expanded": !menuCollapsed && windowWidth > 1200,

          // Overlay Menu
          "vertical-overlay-menu": windowWidth < 1200,
          "menu-hide": !menuVisibility && windowWidth < 1200,
          "menu-open": menuVisibility && windowWidth < 1200,
        }
      )}
      {...(isHidden ? { "data-col": "1-column" } : {})}
    >
      {!isHidden ? (
        <SidebarComponent
          skin={skin}
          menu={menu}
          menuCollapsed={menuCollapsed}
          menuVisibility={menuVisibility}
          setMenuCollapsed={setMenuCollapsed}
          setMenuVisibility={setMenuVisibility}
          routerProps={routerProps}
          currentActiveItem={currentActiveItem}
        />
      ) : null}

      {!showMobileHeader && (
        <Navbar
          expand="lg"
          light={skin !== "dark"}
          dark={skin === "dark" || bgColorCondition}
          color={bgColorCondition ? navbarColor : undefined}
          className={classnames(
            `header-navbar navbar align-items-center ${navbarClasses[navbarType] || "floating-nav"} navbar-shadow`
          )}
        >
          <div className="navbar-container d-flex content">
            {navbar ? (
              navbar({ setMenuVisibility, skin, setSkin })
            ) : (
              <NavbarComponent
                setMenuVisibility={setMenuVisibility}
                skin={skin}
                setSkin={setSkin}
                showMobileHeader={showMobileHeader}
              />
            )}
          </div>
        </Navbar>
      )}
      {/* {showMobileHeader && (
        <div className="mobile-app-title">
          <img src={tickrmeterLogo} alt="Tickrmeter Logo" />
        </div>
      )} */}
      {children}

      {/* Vertical Nav Menu Overlay */}
      <div
        className={classnames("sidenav-overlay", {
          show: menuVisibility,
        })}
        onClick={() => setMenuVisibility(false)}
      ></div>
      {/* Vertical Nav Menu Overlay */}

      {/* {themeConfig.layout.customizer === true ? (
        <Customizer
          skin={skin}
          setSkin={setSkin}
          footerType={footerType}
          setFooterType={setFooterType}
          navbarType={navbarType}
          setNavbarType={setNavbarType}
          navbarColor={navbarColor}
          setNavbarColor={setNavbarColor}
          isRtl={isRtl}
          setIsRtl={setIsRtl}
          layout={props.layout}
          setLayout={props.setLayout}
          isHidden={isHidden}
          setIsHidden={setIsHidden}
          contentWidth={contentWidth}
          setContentWidth={setContentWidth}
          menuCollapsed={menuCollapsed}
          setMenuCollapsed={setMenuCollapsed}
          transition={props.transition}
          setTransition={props.setTransition}
          themeConfig={themeConfig}
        />
      ) : null} */}
      {/* <footer
        className={classnames(`footer footer-light ${footerClasses[footerType] || "footer-static"}`, {
          "d-none": footerType === "hidden",
        })}
      >
        {footer ? (
          footer({ footerType, footerClasses })
        ) : (
          <FooterComponent footerType={footerType} footerClasses={footerClasses} />
        )}
      </footer> */}

      <footer
        className={classnames(`footer footer-light ${footerClasses[footerType] || "footer-static"}`, {
          "d-none": footerType === "hidden",
        })}
      >
        {footer ? (
          footer({ footerType, footerClasses })
        ) : (
          <FooterComponent footerType={footerType} footerClasses={footerClasses} />
        )}
      </footer>
      {themeConfig.layout.scrollTop === true ? (
        <div className="scroll-to-top">
          <ScrollToTop showUnder={300} style={{ bottom: "5%" }}>
            <Button className="btn-icon" color="primary">
              <ArrowUp size={14} />
            </Button>
          </ScrollToTop>
        </div>
      ) : null}
      <div className={"help-button"}>
        <button onClick={() => helpGuide()} id={"setup-guide"}>
          <img className="q-icon" src={question_image} alt="Tickrmeter" />
        </button>
      </div>
    </div>
  );
};

export default VerticalLayout;
