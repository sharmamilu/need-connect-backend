const moduleName = require("../models/user.model");

exports.requireAdmin = (req, res, next) => {
  if (req.user && req.user.userRole === "admin") {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: "Access denied. Admin privileges required.",
    });
  }
};
