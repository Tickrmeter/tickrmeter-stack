// ** React Imports
import { Fragment, useEffect } from "react";

// ** Third Party Components
import classnames from "classnames";

// ** Store & Actions
import { useSelector, useDispatch } from "react-redux";
import { handleContentWidth, handleMenuCollapsed, handleMenuHidden } from "@store/actions/layout";

// ** Styles
import "animate.css/animate.css";
import { useFooterType } from "@src/utility/hooks/useFooterType";

const LayoutWrapper = (props) => {
  // ** Props
  const { layout, children, appLayout, wrapperClass, transition, routeMeta } = props;

  // ** Store Vars
  const dispatch = useDispatch();
  const store = useSelector((state) => state);
  const navbarStore = store.navbar;
  const contentWidth = store.layout.contentWidth;
  const footer = store.layout.footer;

  //** Vars
  const Tag = layout === "HorizontalLayout" && !appLayout ? "div" : Fragment;

  // ** Clean Up Function
  const cleanUp = () => {
    if (routeMeta) {
      if (routeMeta.contentWidth) {
        dispatch(handleContentWidth("full"));
      }
      if (routeMeta.menuCollapsed) {
        dispatch(handleMenuCollapsed(!routeMeta.menuCollapsed));
      }
      if (routeMeta.menuHidden) {
        dispatch(handleMenuHidden(!routeMeta.menuHidden));
      }
    }
  };

  // ** ComponentDidMount
  useEffect(() => {
    if (routeMeta) {
      if (routeMeta.contentWidth) {
        dispatch(handleContentWidth(routeMeta.contentWidth));
      }
      if (routeMeta.menuCollapsed) {
        dispatch(handleMenuCollapsed(routeMeta.menuCollapsed));
      }
      if (routeMeta.menuHidden) {
        dispatch(handleMenuHidden(routeMeta.menuHidden));
      }
    }
    return () => cleanUp();
  }, []);

  

  return (
    <div
      className={classnames("app-content content overflow-hidden", {
        "mobile-content": footer === "sticky",
        [wrapperClass]: wrapperClass,
        "show-overlay": navbarStore.query.length,
      })}
    >
      <div className="content-overlay"></div>
      <div className="header-navbar-shadow" />
      <div
        className={classnames({
          "content-wrapper": !appLayout,
          "content-area-wrapper": appLayout,
          "container p-0": contentWidth === "boxed",
        })}
      >
        <Tag
          /*eslint-disable */
          {...(layout === "HorizontalLayout" && !appLayout
            ? { className: classnames({ "content-body": !appLayout }) }
            : {})}
          /*eslint-enable */
        >
          {children}
        </Tag>
      </div>
    </div>
  );
};

export default LayoutWrapper;
