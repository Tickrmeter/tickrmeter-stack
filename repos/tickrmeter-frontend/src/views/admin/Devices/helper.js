import * as yup from "yup";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

// ***************** VALIDATION SCHEMAS ***************//

const yString = yup.string();

export const DeviceSchema = yup.object().shape({
  name: yString.required("Device Name is required!").max(30, "Name must be at most 30 charachters."),
  macAddress: yString
    .required("Mac Address is required!")
    .test("len", "Must be exactly 12 characters", (val) => val.length === 12),
});

export const deviceDefaults = {
  name: "",
  email: "",
  isActive: true,
};

export const columns = [
  {
    name: "Name",
    selector: (row) => row.name,
    sortable: true,
    minWidth: "225px",
  },
  {
    name: "Mac Address",
    selector: (row) => row.macAddress,
    sortable: true,
    minWidth: "250px",
  },
  {
    name: "Assigned To",
    selector: (row) => row.name,
    sortable: true,
    minWidth: "200px",
  },
  {
    name: "Symbol",
    selector: (row) => row.symbol,
    sortable: true,
    minWidth: "150px",
  },
  {
    name: "Interval",
    selector: (row) => row.interval,
    sortable: true,
    minWidth: "150px",
  },
  {
    name: "Created On",
    selector: (row) => row.createdAt,
    sortable: true,
    minWidth: "250px",
    sortField: "createdAt",
  },
  {
    name: "Active",
    selector: "isActive",
    sortable: true,
    center: true,
    width: "150px",
    cell: (row) =>
      row.isActive ? (
        <FontAwesomeIcon icon={["far", "check-circle"]} size="2x" style={{ color: "green" }} />
      ) : (
        <FontAwesomeIcon icon={["far", "times-circle"]} size="2x" style={{ color: "maroon" }} />
      ),
  },
  // {
  //   name: "Actions",
  //   sortable: false,
  //   center: true,
  //   width: "180px",
  //   cell: (row) => {
  //     return (
  //       <>
  //         <EditAction link="/admin/users" />
  //         <DeleteAction
  //           id={row.id}
  //           message={
  //             <p>
  //               Are you sure to delete <strong>{row.name}</strong> Device?
  //             </p>
  //           }
  //         />
  //       </>
  //     );
  //   },
  // },
  // ** Action cols are added in the component file as we need to customize the edit and delete actions
];

export const myDevices = columns.filter((c) => c.name !== "Assigned To");
