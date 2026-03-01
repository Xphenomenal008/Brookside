/* This JavaScript code snippet is setting up a nodemailer transporter to send OTP (One-Time Password)
verification emails. Here's a breakdown of what each part of the code is doing: */
// const nodemailer = require("nodemailer");

// const transporter = nodemailer.createTransport({
//   host: "smtp.gmail.com",
//   port: 587,         
//   secure: false,
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS
//   },
//   connectionTimeout: 10000,
//   greetingTimeout: 10000,
//   socketTimeout: 10000
// });

// const sendOtpMail = async (email, otp) => {
//   await transporter.verify(); 

//   await transporter.sendMail({
//     from: process.env.EMAIL_USER,
//     to: email,
//     subject: "OTP Verification",
//     text: `Your OTP is ${otp}. It expires in 5 minutes.`
//   });
// };

const SibApiV3Sdk = require("sib-api-v3-sdk");

const client = SibApiV3Sdk.ApiClient.instance;
const apiKey = client.authentications["api-key"];
apiKey.apiKey = process.env.BREVO_API_KEY;

const sendOtpMail = async (email, otp) => {
  const tranEmailApi = new SibApiV3Sdk.TransactionalEmailsApi();

  await tranEmailApi.sendTransacEmail({
    sender: {
      email: process.env.EMAIL_USER, // must be verified in Brevo
      name: "Brookside"
    },
    to: [
      {
        email: email
      }
    ],
    subject: "OTP Verification",
    textContent: `Your OTP is ${otp}. It expires in 5 minutes.`
  });
};

module.exports = sendOtpMail;