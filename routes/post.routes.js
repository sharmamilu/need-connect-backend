const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const optionalAuth = require("../middlewares/optionalAuth.middleware");
const {
  createPost,
  getMyPosts,
  getFeed,
  deletePost,
  getPostsByUser,
  toggleSavePost,
  getSavedPosts,
  togglePinPost,
} = require("../controllers/post.controller");

const router = express.Router();

// Protected routes
router.post("/", authMiddleware, createPost);
router.get("/me", authMiddleware, getMyPosts);
router.get("/saved", authMiddleware, getSavedPosts); // Should go before /:postId to prevent matching postId
router.delete("/:postId", authMiddleware, deletePost);
router.post("/:postId/save", authMiddleware, toggleSavePost);
router.put("/:postId/pin", authMiddleware, togglePinPost);

// Public endpoints
router.get("/", optionalAuth, getFeed); // allow auth for like flag
router.get("/user/:userId", optionalAuth, getPostsByUser);

module.exports = router;
