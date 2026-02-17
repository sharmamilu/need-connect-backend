const bcrypt = require("bcryptjs");
const User = require("../models/user.model");
const { generateToken } = require("../utils/jwt");

exports.login = async ({ phone, password }) => {
  const user = await User.findOne({ phone });

  if (!user) {
    throw new Error("Invalid phone or password");
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new Error("Invalid phone or password");
  }

  const token = generateToken({id: user._id});

  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      phone: user.phone,
      email: user.email,
    },
  };
};

exports.register = async (data) => {
  const { name, phone, email, password } = data;

  const existingUser = await User.findOne({ phone });
  if (existingUser) {
    throw new Error("Phone number already registered");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    phone,
    email,
    password: hashedPassword,
  });

  return {
    id: user._id,
    name: user.name,
    phone: user.phone,
    email: user.email,
  };
};
