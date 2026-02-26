const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const {
  createPortfolio,
  getMyPortfolio,
  updatePortfolio,
  getPortfolios,
  getSuggestions,
  getPortfolioById,
  toggleSavePortfolio,
  getSavedPortfolios,
} = require("../controllers/portfolio.controller");

const router = express.Router();

router.post("/", authMiddleware, createPortfolio);
router.get("/me", authMiddleware, getMyPortfolio);
router.put("/", authMiddleware, updatePortfolio);

// Saved portfolios route MUST be above /:id to prevent matching as an ID
router.get("/saved", authMiddleware, getSavedPortfolios);

router.get("/", authMiddleware, getPortfolios);
router.get("/suggestions", authMiddleware, getSuggestions);
router.get("/:id", authMiddleware, getPortfolioById);

// Save/Unsave specific portfolio
router.post("/:id/save", authMiddleware, toggleSavePortfolio);

module.exports = router;
