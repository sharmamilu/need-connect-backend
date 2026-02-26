const express = require("express");
const { register, login } = require("../controllers/auth.controller");

const router = express.Router();
const rateLimit = require("express-rate-limit");

// Strict rate limiter for auth (20 requests per 15 mins)
const authLimiter = rateLimit({
  max: 20,
  windowMs: 15 * 60 * 1000,
  message:
    "Too many login/register attempts from this IP, please try again in 15 minutes.",
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);

module.exports = router;
