const nodemailer = require("nodemailer");

/**
 * Send an email using Nodemailer
 * @param {string} to - The recipient's email address
 * @param {string} subject - The subject of the email
 * @param {string} text - The plain text content of the email
 * @param {string} html - The HTML content of the email
 */
exports.sendEmail = async ({ to, subject, text, html }) => {
  const email = process.env.SMTP_EMAIL;
  const pass = process.env.SMTP_PASSWORD;

  const isPlaceholder =
    !email ||
    email === "your_email@gmail.com" ||
    !pass ||
    pass === "your_email_password";

  if (isPlaceholder) {
    console.log("\n==================================================");
    console.log("⚠️  SMTP is not configured or using placeholders.");
    console.log("✉️  Email logged to console instead:");
    console.log("TO:", to);
    console.log("SUBJECT:", subject);
    console.log("CONTENT:", text);
    console.log("==================================================\n");
    return { mockSent: true, messageId: "mock-id" };
  }

  // Configure the transporter using Gmail SMTP with timeouts to prevent hanging
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: email,
      pass: pass,
    },
    connectionTimeout: 5000, // 5 seconds
    greetingTimeout: 5000,
    socketTimeout: 5000,
  });

  const mailOptions = {
    from: `"P2P Marketplace" <${email}>`,
    to,
    subject,
    text,
    html,
  };

  // Send the email
  const info = await transporter.sendMail(mailOptions);
  return info;
};
