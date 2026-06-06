const express = require("express");
const {
  register,
  login,
  forgotPassword,
  verifyResetCode,
  resetPassword,
} = require("../controllers/auth.controller");

const router = express.Router();
const rateLimit = require("express-rate-limit");

// Strict rate limiter for auth endpoints.
// - Returns a JSON body (the mobile client parses every response as JSON).
// - `skipSuccessfulRequests` so a valid user logging in repeatedly is never
//   locked out; only failed attempts count toward the limit (brute-force guard).
const authLimiter = rateLimit({
  max: 50,
  windowMs: 15 * 60 * 1000,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message:
        "Too many attempts. Please wait a few minutes and try again.",
    });
  },
});

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/verify-reset-code", authLimiter, verifyResetCode);
router.post("/reset-password", authLimiter, resetPassword);

module.exports = router;
