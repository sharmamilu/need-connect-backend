const asyncHandler = require("express-async-handler");
const {
  createCommentService,
  getPostCommentsService,
  toggleCommentLikeService,
  deleteCommentService,
} = require("../services/comment.service");

exports.createComment = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { text, parentCommentId } = req.body;

  if (!postId) {
    return res.status(400).json({ success: false, message: "postId is required in URL" });
  }

  const comment = await createCommentService({
    postId,
    userId: req.user.id,
    text,
    parentCommentId,
  });

  res.status(201).json({
    success: true,
    data: comment,
  });
});

exports.getPostComments = asyncHandler(async (req, res) => {
  const { postId } = req.params;

  const comments = await getPostCommentsService(postId, req.user ? req.user.id : null);

  res.status(200).json({
    success: true,
    data: comments,
  });
});

exports.toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!commentId) {
    return res.status(400).json({ success: false, message: "commentId is required in URL" });
  }

  const result = await toggleCommentLikeService(commentId, req.user.id);

  res.status(200).json({
    success: true,
    liked: result.liked,
  });
});

exports.deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!commentId) {
    return res.status(400).json({ success: false, message: "commentId is required in URL" });
  }

  const result = await deleteCommentService(commentId, req.user.id);

  res.status(200).json({
    success: true,
    message: "Comment deleted successfully",
    deletedCount: result.deletedCount,
  });
});