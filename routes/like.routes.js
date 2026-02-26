const express = require("express");
const { toggleLike, getPostLikes } = require("../controllers/like.controller");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

// Get all users who liked a post (public endpoint)
router.get("/:postId", getPostLikes);

// Toggle like on a post (protected)
router.post("/:postId", authMiddleware, toggleLike);

module.exports = router;