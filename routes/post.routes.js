const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const { createPost, getMyPosts, getFeed } = require("../controllers/post.controller");

const router = express.Router();

// Protected routes
router.post("/", authMiddleware, createPost);
router.get("/me", authMiddleware, getMyPosts);

// Public feed
router.get("/", getFeed);

module.exports = router;