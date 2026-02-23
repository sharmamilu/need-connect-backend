const express = require("express");
const {
  createComment,
  getPostComments,
  toggleCommentLike,
} = require("../controllers/comment.controller");
const protect = require("../middlewares/auth.middleware");
const optionalAuth = require("../middlewares/optionalAuth.middleware");

const router = express.Router();

router.get("/:postId", optionalAuth, getPostComments);
router.post("/:postId", protect, createComment);

// Toggle comment like
router.post("/:commentId/like", protect, toggleCommentLike);

module.exports = router;