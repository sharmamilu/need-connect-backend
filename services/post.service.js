const Post = require("../models/post.model");
const Portfolio = require("../models/portfolio.model");
const User = require("../models/user.model");

exports.createPost = async (userId, data) => {
  // Accept `images` array or single `image` string (backwards compatible)
  const imagesInput = Array.isArray(data.images) ? data.images : data.images ? [data.images] : [];
  if (data.image) imagesInput.push(data.image);

  // Normalize and filter out falsy values
  const images = imagesInput.map(String).map((s) => s.trim()).filter((s) => s);

  // grab a snapshot of the user's profile that we need on the frontend
  const [portfolio, user] = await Promise.all([
    Portfolio.findOne({ user: userId }, "profilePhoto profession"),
    User.findById(userId, "name"),
  ]);

  return await Post.create({
    user: userId,
    description: data.description,
    images,
    tags: data.tags || [],
    userImage: portfolio ? portfolio.profilePhoto : undefined,
    userProfession: portfolio ? portfolio.profession : undefined,
    userName: user ? user.name : undefined,
    backgroundStyle: data.backgroundStyle,
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

  // posts now contain their own snapshot data, population is optional for name only
  const posts = await Post.find()
    // if front-end still needs the user's name, you can populate here
    // .populate("user", "name")
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

exports.updateUserPostsSnapshot = async (userId, updateData) => {
  // When portfolio is updated, sync changes to all posts for this user
  const updateFields = {};

  if (updateData.profilePhoto !== undefined) {
    updateFields.userImage = updateData.profilePhoto;
  }
  if (updateData.profession !== undefined) {
    updateFields.userProfession = updateData.profession;
  }
  if (updateData.backgroundStyle !== undefined) {
    updateFields.backgroundStyle = updateData.backgroundStyle;
  }

  // Only update if there are fields to update
  if (Object.keys(updateFields).length > 0) {
    await Post.updateMany({ user: userId }, { $set: updateFields });
  }
};