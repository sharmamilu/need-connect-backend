const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const { createPost, getMyPosts, getFeed, deletePost, getPostsByUser } = require("../controllers/post.controller");

const router = express.Router();

// Protected routes
router.post("/", authMiddleware, createPost);
router.get("/me", authMiddleware, getMyPosts);
router.delete("/:postId", authMiddleware, deletePost);

// Public endpoints
router.get("/", getFeed);
router.get("/user/:userId", getPostsByUser);

module.exports = router;