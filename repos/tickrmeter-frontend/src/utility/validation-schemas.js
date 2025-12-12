import * as yup from "yup";

const yString = yup.string();
const pass_error_msg = `Password should contain atleast one uppercase, one lowercase alphabet, one special character and one number.`;

export const LoginSchema = yup.object().shape({
  email: yString.email("Invalid email address").required("Email is required!"),
  password: yString.required("Password is required!"),
});

export const UserSchema = yup.object().shape({
  name: yString.required("User Name is required!"),
  email: yString.email("Invalid email address").required("Email is required!"),
  password: yString
    .required("New Password is required!")
    .min(8, "Password should be of min 8 chars")
    .max(15, "Password should contain max of 15 chars")
    .matches(/^(?=.{8,15}$)(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*\W).*$/, {
      message: pass_error_msg,
    }),
  confirmPassword: yString
    .required("Confirm Password is required!")
    .oneOf([yup.ref("password")], "Password must match"),
});

export const UserEditSchema = yup.object().shape({
  name: yString.required("User Name is required!"),
  email: yString.email("Invalid email address").required("Email is required!"),
});
