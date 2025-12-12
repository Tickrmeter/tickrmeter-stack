import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import queryString from "query-string";

const ThirdPartyTest = () => {
  const [count, setCount] = useState(3);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = count > 0 && setInterval(() => setCount(count - 1), 1000);
    if (count === 0) {
      const { returnURL } = queryString.parse(location.search);
      window.location.href = returnURL || "/";
    }
    return () => clearInterval(timer);
  }, [count, navigate, location.search]);

  return (
    <>
      <h1>Third party test</h1>
      <h2>
        {count > 0
          ? `Redirecting in to ${queryString.parse(location.search).returnURL} in ${count} ...`
          : "Redirecting..."}
      </h2>
    </>
  );
};

export default ThirdPartyTest;
