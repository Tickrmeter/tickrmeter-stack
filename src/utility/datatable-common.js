import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import ModalComponent from "@src/@core/components/modal";
import { Button } from "reactstrap";

const createDeleteMsg = (row, key, suffix) => (
  <>
    Are you sure to delete <strong> {row[key]} </strong>
    {suffix}?
  </>
);

const getDeleteMsg = (row, key, suffix, altKey, msgType = "") => {
  switch (msgType) {
    case "REMOVE_REG":
      return (
        <>
          Are you sure to remove <strong>{row[key] || row[altKey]}</strong> device from your account?
        </>
      );
    default:
      return (
        <>
          Are you sure, you want to delete <strong>{row[key] || row[altKey]}</strong> {suffix}?
        </>
      );
  }
};

export const GetActionCol = ({
  editAction,
  deleteAction,
  nameKey,
  msgSuffix,
  width = "160px",
  altkey = null,
  msgType = null,
}) => ({
  name: "Actions",
  sortable: false,
  center: true,
  width,
  cell: (row) => {
    return (
      <div style={{ display: "flex", justifyContent: "space-around", width: "100%" }}>
        {editAction && <EditAction onClick={() => editAction(row._id)} />}

        {deleteAction && (
          <>
            {row?.userRole !== 1 ? (
              <DeleteAction
                onDelete={() => deleteAction(row._id)}
                message={getDeleteMsg(row, nameKey, msgSuffix, altkey, msgType)}
              />
            ) : (
              <div style={{ width: "53.5312px" }}></div>
            )}
          </>
        )}
      </div>
    );
  },
});

export const EditAction = ({ onClick }) => {
  return (
    <Button className="btn-icon" color="flat-secondary" onClick={onClick}>
      <FontAwesomeIcon icon={["far", "edit"]} size="2x" />
    </Button>
  );
};

export const DeleteAction = ({ message, onDelete }) => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <Button className="btn-icon" color="flat-secondary" onClick={() => setShowModal(!showModal)}>
        <FontAwesomeIcon icon={["far", "trash-alt"]} size="2x" />
      </Button>
      <ModalComponent
        body={message}
        title="Delete"
        headerClass="modal-danger"
        showModal={showModal}
        setShowModal={setShowModal}
        onClickConfirm={onDelete}
      ></ModalComponent>
    </>
  );
};
