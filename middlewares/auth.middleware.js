const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const { generateToken } = require("../utils/jwt");

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authorization token missing",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    // Attach user to request
    req.user = user;

    // Extend session automatically on active requests (sliding window)
    const newToken = generateToken({ id: user._id });
    res.setHeader("x-new-token", newToken);
    res.setHeader("Access-Control-Expose-Headers", "x-new-token");

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};
