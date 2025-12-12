import { CONFIRM_USER_URL, RESET_PASS_URL } from "../constants";
import emailBodies from "./emailBodies/auth";
import Emailer, { getAddressObj } from "./emailer";
import { IUser } from "../models/interfaces";

/**
 *
 * @param {object} authObj object containing fullName, email and password
 * @param {string} type Values: new-user, forgot-password
 */
export const sendAuthEmails = (authObj: IUser, type: string) => {
  if (!authObj) return;

  switch (type) {
    case "new-user":
      return newUserEmail(authObj);
    case "forgot-password":
      return forgotPasswordEmail(authObj);
    default:
      break;
  }
};

const newUserEmail = async (userObj: IUser) => {
  console.log("==========NEW LINK==============");
  const emailObj = { ...userObj, linkHref: `${CONFIRM_USER_URL}/${userObj.confirmToken.token}` };
  const emailTo = getAddressObj(userObj);
  const emailCC = "";
  const { emailSubject, emailBody } = await emailBodies.newUser(emailObj, { emailTo, emailCC });

  const emailer = new Emailer(emailTo, emailCC, emailSubject, emailBody);

  emailer.sendEmail();

  return emailBody;
};

const forgotPasswordEmail = async (userObj: IUser) => {
  console.log("==========Forgot Password==============");

  const linkHref = `${RESET_PASS_URL}/${userObj.resetToken.token}`;

  const emailObj = { ...userObj, linkHref };

  const emailTo = getAddressObj(userObj);
  const emailCC = "";
  const { emailSubject, emailBody } = await emailBodies.forgotPassword(emailObj, { emailTo, emailCC });

  const emailer = new Emailer(emailTo, emailCC, emailSubject, emailBody);

  emailer.sendEmail();

  return emailBody;
};
