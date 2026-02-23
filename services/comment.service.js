const mongoose = require("mongoose");
const Comment = require("../models/comment.model");
const Post = require("../models/post.model");

exports.createCommentService = async ({
  postId,
  userId,
  text,
  parentCommentId = null,
}) => {
  if (!postId) throw new Error("postId is required");

  // instantiate comment document and save, avoiding Mongoose .create() implicit transactions
  const comment = new Comment({
    post: postId,
    user: userId,
    text,
    parentComment: parentCommentId,
  });

  await comment.save();

  await Post.findByIdAndUpdate(postId, { $inc: { commentsCount: 1 } });

  // Populate user data similar to getPostCommentsService
  await comment.populate("user", "name");

  // Fetch portfolio photo
  const PortfolioModel = require("../models/portfolio.model");
  const portfolio = await PortfolioModel.findOne({ user: userId }).select(
    "profilePhoto"
  );

  const cObj = comment.toObject();
  return {
    ...cObj,
    userName: comment.user?.name || "Unknown User",
    profilePhoto: portfolio?.profilePhoto || null,
    liked: false, // newly created comment hasn't been liked yet
    replies: [], // initialize replies for nested structure
  };
};

const Portfolio = require("../models/portfolio.model");
const CommentLike = require("../models/commentLike.model");

// Fetch comments for a post (top-level and replies if needed)
exports.getPostCommentsService = async (postId, currentUserId = null) => {
  // Return comments sorted by creation date (newest first)
  const comments = await Comment.find({ post: postId })
    .populate("user", "name")
    .sort({ createdAt: -1 }); // Sort descending so recent comments come first

  if (!comments.length) return [];

  // get all user IDs to fetch portfolio images
  const userIds = [...new Set(comments.map((c) => c.user._id.toString()))];

  const portfolios = await Portfolio.find({ user: { $in: userIds } }).select(
    "user profilePhoto"
  );
  const profileMap = portfolios.reduce((acc, p) => {
    acc[p.user.toString()] = p.profilePhoto;
    return acc;
  }, {});

  // Optionally fetch user likes
  let userLikesSet = new Set();
  if (currentUserId) {
    const commentIds = comments.map((c) => c._id);
    const likes = await CommentLike.find({
      comment: { $in: commentIds },
      user: currentUserId,
    }).select("comment");
    userLikesSet = new Set(likes.map((l) => l.comment.toString()));
  }

  // Format comments to include photo, name, and if liked
  const formattedComments = comments.map((comment) => {
    const cObj = comment.toObject();
    return {
      ...cObj,
      userName: comment.user?.name || "Unknown User",
      profilePhoto: profileMap[comment.user?._id.toString()] || null,
      liked: userLikesSet.has(comment._id.toString()),
      replies: [], // initialize replies array for nested structure
    };
  });

  // Build the hierarchical tree structure
  const commentMap = {};
  const rootComments = [];

  formattedComments.forEach((c) => {
    commentMap[c._id.toString()] = c;
  });

  formattedComments.forEach((c) => {
    if (c.parentComment && commentMap[c.parentComment.toString()]) {
      commentMap[c.parentComment.toString()].replies.push(c);
    } else {
      rootComments.push(c);
    }
  });

  return rootComments;
};

exports.toggleCommentLikeService = async (commentId, userId) => {
  const existingLike = await CommentLike.findOne({
    comment: commentId,
    user: userId,
  });

  if (existingLike) {
    await CommentLike.deleteOne({ _id: existingLike._id });
    await Comment.findByIdAndUpdate(commentId, { $inc: { likesCount: -1 } });
    return { liked: false };
  } else {
    await CommentLike.create({ comment: commentId, user: userId });
    await Comment.findByIdAndUpdate(commentId, { $inc: { likesCount: 1 } });
    return { liked: true };
  }
};
