// ** Core JWT Import
import useJwt from "@src/@core/auth/jwt/useJwt";
import { ApiEndPoint, API_PATHS } from "@src/redux/api-paths";

const jwtConfig = {
  loginEndpoint: ApiEndPoint(API_PATHS.login),
  registerEndpoint: ApiEndPoint(API_PATHS.register),
  confirmEndpoint: ApiEndPoint(API_PATHS.confirm),
  forgotPasswordEndpoint: ApiEndPoint(API_PATHS.forgotPassword),
  resetPasswordEndpoint: ApiEndPoint(API_PATHS.resetPassword),
  validateTokenEndpoint: ApiEndPoint(API_PATHS.validateToken),
  refreshEndpoint: ApiEndPoint(API_PATHS.refreshToken),
  logoutEndpoint: ApiEndPoint(API_PATHS.logout),

  // // ** This will be prefixed in authorization header with token
  // // ? e.g. Authorization: Bearer <token>
  //tokenType: "Bearer",

  // ** Value of this property will be used as key to store JWT token in storage
  storageTokenKeyName: "accessToken",
  storageRefreshTokenKeyName: "refreshToken",
};

const { jwt } = useJwt(jwtConfig);

export default jwt;
