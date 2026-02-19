const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const {
  createPortfolio,
  getMyPortfolio,
  updatePortfolio,
    getPortfolios,
    getSuggestions,
    getPortfolioById
} = require("../controllers/portfolio.controller");

const router = express.Router();

router.post("/", authMiddleware, createPortfolio);
router.get("/me", authMiddleware, getMyPortfolio);
router.put("/", authMiddleware, updatePortfolio);
router.get("/", getPortfolios);
router.get("/suggestions", getSuggestions);
router.get("/:id", getPortfolioById);

module.exports = router;
