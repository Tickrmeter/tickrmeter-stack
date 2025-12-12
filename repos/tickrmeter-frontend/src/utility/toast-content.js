import Avatar from "@src/@core/components/avatar";
import { Coffee, AlertTriangle } from "react-feather";
import { Slide, toast } from "react-toastify";

const ToastContent = ({ icon, type, title, body }) => {
  const IconTag = type === "danger" ? <AlertTriangle size={20} /> : <Coffee size={12} />;
  return (
    <>
      <div className="toastify-header">
        <div className="title-wrapper">
          <Avatar size="sm" color={type} icon={IconTag} />

          <h6 className="toast-title font-weight-bold">{title}</h6>
        </div>
      </div>
      <div className="toastify-body">
        <span>{body}</span>
      </div>
    </>
  );
};

export default ToastContent;

export const showToast = (type, title, body) => {
  const toastBody = <ToastContent type={type} title={title} body={body} />;
  const toastOpt = { transition: Slide, position: "top-right", autoClose: 3000 };

  return type === "success" ? toast.success(toastBody, toastOpt) : toast.error(toastBody, toastOpt);
};