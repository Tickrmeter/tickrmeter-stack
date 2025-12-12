// var nodemailer = require("nodemailer");
import nodemailer from "nodemailer";
import conf from "../conf";
import { IUser } from "../models/interfaces";

const { smtp } = conf;

export default class Emailer {
  authDetails = {
    host: smtp.smtp_host,
    port: smtp.port,
    auth: {
      user: smtp.username,
      pass: smtp.password,
    },
  };

  emailFrom = smtp.username;
  emailTo = "";
  emailCC = "";
  subject = "";
  emailBody = "";

  /**
   *
   * @param {string} emailTo
   * @param {string} subject
   * @param {string} emailBody
   */
  constructor(emailTo, emailCC, subject, emailBody) {
    if (smtp.isDebug) emailTo = smtp.debugEmailAdd;

    if (!emailTo || !subject || !emailBody) {
      // throw new Error("No email details");
    }

    this.emailTo = emailTo;
    // this.emailCC = `${emailCC}; ${smtp.isDebug ? "" : smtp.debugEmailAdd}`;
    this.subject = subject;
    this.emailBody = emailBody;
  }

  sendEmail() {
    const transporter = nodemailer.createTransport(this.authDetails);
    const mailOptions = {
      from: `TickrMeter <${this.emailFrom}>`, // sender address
      to: this.emailTo, // list of receivers
      replyTo: smtp.replyTo,
      cc: this.emailCC,
      subject: this.subject, // Subject line
      html: this.emailBody,
    };
    console.log("===>sending Mail<===", {
      from: this.emailFrom, // sender address
      to: this.emailTo, // list of receivers
      cc: this.emailCC,
      subject: this.subject,
    });

    transporter.sendMail(mailOptions, (err, info) => {
      console.log("===>in send mail function<===");
      if (!err) console.log("===>mail send<===");
      else console.error("Error sending email", err, info);
    });
  }
}

export const getAddressObj = (user: IUser) => `${user.name}<${user.email}>`;
