const authService = require("../services/auth.service");

exports.login = async (req, res, next) => {
  try {
    const data = await authService.login(req.body);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data,
    });
  } catch (err) {
    next(err);
  }
};

exports.register = async (req, res, next) => {
  try {
    const user = await authService.register(req.body);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const response = await authService.forgotPassword(email);

    res.status(200).json({
      success: true,
      message: response.message,
    });
  } catch (err) {
    next(err);
  }
};

exports.verifyResetCode = async (req, res, next) => {
  try {
    const { email, code } = req.body;

    const response = await authService.verifyResetCode(email, code);

    res.status(200).json({
      success: true,
      message: response.message,
    });
  } catch (err) {
    next(err);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { email, code, newPassword } = req.body;

    const response = await authService.resetPassword(email, code, newPassword);

    res.status(200).json({
      success: true,
      message: response.message,
    });
  } catch (err) {
    next(err);
  }
};
