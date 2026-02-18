const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const {
  createPortfolio,
  getMyPortfolio,
  updatePortfolio,
} = require("../controllers/portfolio.controller");

const router = express.Router();

router.post("/", authMiddleware, createPortfolio);
router.get("/me", authMiddleware, getMyPortfolio);
router.put("/", authMiddleware, updatePortfolio);

module.exports = router;
