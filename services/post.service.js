const Post = require("../models/post.model");

exports.createPost = async (userId, data) => {
  // Accept `images` array or single `image` string (backwards compatible)
  const imagesInput = Array.isArray(data.images) ? data.images : data.images ? [data.images] : [];
  if (data.image) imagesInput.push(data.image);

  // Normalize and filter out falsy values
  const images = imagesInput.map(String).map((s) => s.trim()).filter((s) => s);

  return await Post.create({
    user: userId,
    description: data.description,
    images,
    tags: data.tags || [],
  });
};

exports.getUserPosts = async (userId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const posts = await Post.find({ user: userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Post.countDocuments({ user: userId });

  return {
    posts,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
};

exports.getFeedPosts = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const posts = await Post.find()
    .populate("user", "name profilePhoto")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Post.countDocuments();

  return {
    posts,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
};