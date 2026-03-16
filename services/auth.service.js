const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("../models/user.model");
const { generateToken } = require("../utils/jwt");
const { sendEmail } = require("./email.service");
exports.login = async ({ email, password }) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new Error("Invalid email or password");
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new Error("Invalid email or password");
  }

  const token = generateToken({ id: user._id });

  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      countryCode: user.countryCode,
      dateOfBirth: user.dateOfBirth,
    },
  };
};

exports.register = async (data) => {
  const { name, phone, email, password, countryCode, dateOfBirth } = data;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error("Email already registered");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    phone,
    email,
    countryCode,
    dateOfBirth,
    password: hashedPassword,
  });

  return {
    id: user._id,
    name: user.name,
    phone: user.phone,
    email: user.email,
    countryCode: user.countryCode,
    dateOfBirth: user.dateOfBirth,
  };
};

exports.forgotPassword = async (email) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new Error("No user found with that email address");
  }

  // Generate a random 6-digit code
  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

  // Hash the code before saving to DB
  const hashedCode = crypto
    .createHash("sha256")
    .update(resetCode)
    .digest("hex");

  // Set the token and its expiration (15 minutes from now)
  user.resetPasswordToken = hashedCode;
  user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
  await user.save();

  // Send the email
  const message = `
    You are receiving this email because you (or someone else) have requested the reset of a password.
    Your password reset code is: 
    
    ${resetCode}
    
    This code will expire in 15 minutes.
    If you did not request this, please ignore this email and your password will remain unchanged.
  `;

  try {
    await sendEmail({
      to: user.email,
      subject: "Password Reset Code",
      text: message,
    });
  } catch (err) {
    console.error("Email Sending Error: ", err);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    throw new Error("Email could not be sent");
  }

  return { message: "Reset code sent to your email successfully" };
};

exports.verifyResetCode = async (email, code) => {
  // Hash the incoming code to compare it with the one in the database
  const hashedCode = crypto.createHash("sha256").update(code).digest("hex");

  // Find user by email and token and ensure token has not expired
  const user = await User.findOne({
    email,
    resetPasswordToken: hashedCode,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    throw new Error("Reset code is invalid or has expired");
  }

  return { message: "Code is valid" };
};

exports.resetPassword = async (email, code, newPassword) => {
  // Hash the incoming token to compare it with the one in the database
  const hashedCode = crypto.createHash("sha256").update(code).digest("hex");

  // Find user by email and token and ensure token has not expired
  const user = await User.findOne({
    email,
    resetPasswordToken: hashedCode,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    throw new Error("Reset code is invalid or has expired");
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Update user's password and clear the reset fields
  user.password = hashedPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  return { message: "Password updated successfully" };
};
