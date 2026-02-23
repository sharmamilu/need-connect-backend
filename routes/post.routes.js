const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const optionalAuth = require("../middlewares/optionalAuth.middleware");
const { createPost, getMyPosts, getFeed, deletePost, getPostsByUser } = require("../controllers/post.controller");

const router = express.Router();

// Protected routes
router.post("/", authMiddleware, createPost);
router.get("/me", authMiddleware, getMyPosts);
router.delete("/:postId", authMiddleware, deletePost);

// Public endpoints
router.get("/", optionalAuth, getFeed); // allow auth for like flag
router.get("/user/:userId", optionalAuth, getPostsByUser);

module.exports = router;