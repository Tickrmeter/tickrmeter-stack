// ** UseJWT import to get config
import useJwt from "@src/auth/jwt/useJwt";

const config = useJwt.jwtConfig;

// ** Handle User Login
export const handleLogin = (data) => {
  return (dispatch) => {
    dispatch({
      type: "LOGIN",
      data,
      config,
      [config.storageTokenKeyName]: data[config.storageTokenKeyName],
      menuItems: data.menuItems,
    });

    // ** Add to user, accessToken & refreshToken to localStorage
    localStorage.setItem("userData", JSON.stringify(data));
    localStorage.setItem(config.storageTokenKeyName, data.accessToken);
    localStorage.setItem("menuItems", JSON.stringify(data.menuItems));
  };
};

// ** Handle User Logout
export const handleLogout = () => {
  return (dispatch) => {
    dispatch({ type: "LOGOUT", [config.storageTokenKeyName]: null });

    // ** Remove user, accessToken & refreshToken from localStorage
    localStorage.removeItem("userData");
    localStorage.removeItem(config.storageTokenKeyName);
  };
};
