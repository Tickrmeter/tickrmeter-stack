import React, { Suspense, lazy } from "react";
import * as Icon from "react-feather";

const RFIcon = ({ icon, size }) => {
  const IconTag = Icon[icon];

  return (
    <Suspense fallback={<div style={{ width: "20px" }} />}>
      <IconTag size={size || 20} />
    </Suspense>
  );
};

export default RFIcon;
