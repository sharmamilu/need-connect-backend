const Like = require("../models/like.model");
const Post = require("../models/post.model");

exports.toggleLikeService = async (postId, userId) => {
  try {
    const existingLike = await Like.findOne({ post: postId, user: userId });

    if (existingLike) {
      // Unlike - delete and decrement count
      await Like.deleteOne({ _id: existingLike._id });
      await Post.findByIdAndUpdate(
        postId,
        { $inc: { likesCount: -1 } }
      );

      return { liked: false };
    } else {
      // Like - create and increment count
      await Like.create({ post: postId, user: userId });
      await Post.findByIdAndUpdate(
        postId,
        { $inc: { likesCount: 1 } }
      );

      return { liked: true };
    }
  } catch (error) {
    throw error;
  }
};

exports.getPostLikesService = async (postId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  // fetch likes with user reference (name only)
  const likes = await Like.find({ post: postId })
    .populate('user', 'name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Like.countDocuments({ post: postId });

  // gather portfolio photos for all users in page
  const userIds = likes.map(like => like.user._id);
  let profileMap = {};
  if (userIds.length > 0) {
    const Portfolio = require('../models/portfolio.model');
    const portfolios = await Portfolio.find({ user: { $in: userIds } }).select('user profilePhoto');
    profileMap = portfolios.reduce((acc, p) => {
      acc[p.user.toString()] = p.profilePhoto;
      return acc;
    }, {});
  }

  return {
    likes: likes.map(like => ({
      userId: like.user._id,
      userName: like.user.name,
      profilePhoto: profileMap[like.user._id.toString()] || null,
      likedAt: like.createdAt
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
};