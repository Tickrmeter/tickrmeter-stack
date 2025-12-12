import React, { useState } from "react";
import { Button, Modal, ModalHeader, ModalBody, ModalFooter, Alert } from "reactstrap";

const ModalComponent = ({
  showModal,
  setShowModal,
  headerClass: modalClassName,
  body,
  title,
  onClickConfirm,
  headerClass2 = "",
  confirmButtonTitle = "Yes!",
  showConfirmBtn = true,
  isCloseOnConfirm = true,
}) => {
  // const [isOpen, setIsOpen] = useState(showModal);

  const onClickOk = () => {
    onClickConfirm();
    if (isCloseOnConfirm) setShowModal(false);
  };

  return (
    <Modal isOpen={showModal} className="modal-dialog-centered" modalClassName={modalClassName}>
      <ModalHeader className={headerClass2} toggle={() => setShowModal(!showModal)}>
        {title}
      </ModalHeader>
      <ModalBody>{body}</ModalBody>
      <ModalFooter>
        <Button color="secondary" onClick={() => setShowModal(!showModal)}>
          Cancel
        </Button>
        {showConfirmBtn && (
          <Button color="danger" onClick={onClickOk}>
            {confirmButtonTitle}
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
};
export default ModalComponent;
