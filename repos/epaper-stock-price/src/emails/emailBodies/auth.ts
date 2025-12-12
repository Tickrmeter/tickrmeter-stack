import path from "path";
import ejs from "ejs";
import conf from "../../conf";

const newUser = async (authObj, testObj) => {
  const { name, linkHref } = authObj;

  const templatePath = path.resolve(conf?.app?.emailTemplatePath + "/welcome.ejs");

  const emailSubject = `Your TickrMeter account has successfully been created.`;

  const emailBody = await ejs.renderFile(templatePath, {
    linkHref,
    username: name || "",
  });

  return { emailBody, emailSubject };
};

const forgotPassword = async (authObj, testObj) => {
  const { linkHref } = authObj;

  const templatePath = path.resolve(conf?.app?.emailTemplatePath + "/forgot-password.ejs");

  const emailSubject = `Your TickrMeter reset password`;

  const emailBody = await ejs.renderFile(templatePath, {
    linkHref,
  });

  return { emailBody, emailSubject };
};

export default {
  newUser,
  forgotPassword,
};
