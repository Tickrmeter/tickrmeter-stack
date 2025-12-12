import { useState, useEffect } from "react";

const useIsLargeScreen = (screenSize = 599) => {
  const [isLargeScreen, setIsLargeScreen] = useState(window.innerWidth > screenSize);

  useEffect(() => {
    const handleResize = () => {
      setIsLargeScreen(window.innerWidth > screenSize);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [screenSize]);

  return isLargeScreen;
};

export default useIsLargeScreen;
