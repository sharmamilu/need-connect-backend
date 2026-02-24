const express = require("express");
const {
  createReview,
  getUserReviews,
  getUserRatingStats,
} = require("../controllers/review.controller");
const protect = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/", protect, createReview);
router.get("/:userId", getUserReviews);
router.get("/:userId/stats", getUserRatingStats);

module.exports = router;
