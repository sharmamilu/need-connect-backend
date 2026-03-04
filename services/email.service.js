const nodemailer = require("nodemailer");

/**
 * Send an email using Nodemailer
 * @param {string} to - The recipient's email address
 * @param {string} subject - The subject of the email
 * @param {string} text - The plain text content of the email
 * @param {string} html - The HTML content of the email
 */
exports.sendEmail = async ({ to, subject, text, html }) => {
  // Configure the transporter using Gmail SMTP
  // You will need to set SMTP_EMAIL and SMTP_PASSWORD in your .env file
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  const mailOptions = {
    from: `"P2P Marketplace" <${process.env.SMTP_EMAIL}>`,
    to,
    subject,
    text,
    html,
  };

  // Send the email
  const info = await transporter.sendMail(mailOptions);
  return info;
};
