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
router.get("/", authMiddleware, getPortfolios);
router.get("/suggestions", authMiddleware, getSuggestions);
router.get("/:id", authMiddleware, getPortfolioById);

module.exports = router;
