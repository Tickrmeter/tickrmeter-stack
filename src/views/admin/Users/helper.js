import * as yup from "yup";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

// ***************** VALIDATION SCHEMAS ***************//

const yString = yup.string();
const pass_error_msg = `Password should contain atleast one uppercase, one lowercase alphabet, one special character and one number.`;

export const UserSchema = yup.object().shape({
  name: yString.required("User Name is required!").max(50, "Name must be at most 50 charachters."),
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
  password: yup.lazy((value) =>
    value === ""
      ? yup.string().notRequired()
      : yString
          .min(8, "Password should be of min 8 chars")
          .max(15, "Password should contain max of 15 chars")
          .matches(/^(?=.{8,15}$)(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*\W).*$/, {
            message: pass_error_msg,
          })
  ),
  confirmPassword: yString.oneOf([yup.ref("password")], "Password must match"),
});

export const userDefaults = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  isActive: true,
  isAdmin: false,
};

export const columns = [
  {
    name: "Name",
    selector: (row) => row.name,
    sortable: true,
    minWidth: "225px",
  },
  {
    name: "Email",
    selector: (row) => row.email,
    sortable: true,
    minWidth: "250px",
  },
  {
    name: "No of Devices",
    selector: (row) => row.noOfDevices,
    center: true,
    sortable: true,
    minWidth: "250px",
  },
  {
    name: "Created On",
    selector: (row) => row.createdAt,
    sortable: true,
    center: true,
    minWidth: "250px",
  },
  {
    name: "Active",
    sortable: true,
    center: true,
    minWidth: "150px",
    cell: (row) =>
      row.isActive ? (
        <FontAwesomeIcon icon={["far", "check-circle"]} size="2x" style={{ color: "green" }} />
      ) : (
        <FontAwesomeIcon icon={["far", "times-circle"]} size="2x" style={{ color: "maroon" }} />
      ),
  },

  // ** Action cols are added in the component file as we need to customize the edit and delete actions
];
