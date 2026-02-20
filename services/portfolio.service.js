const Portfolio = require("../models/portfolio.model");
const postService = require("./post.service");

exports.createPortfolio = async (userId, data) => {
  const existing = await Portfolio.findOne({ user: userId });

  if (existing) {
    throw new Error("Portfolio already exists");
  }

  // Basic validation to provide clearer errors before mongoose validation
  if (!data.name) throw new Error("Name is required");
  if (!data.location) throw new Error("Location is required");
  if (!data.profession) throw new Error("Profession is required");
  if (!data.bio) throw new Error("Bio is required");

  if (!data.services || !Array.isArray(data.services) || data.services.length === 0)
    throw new Error("At least one service is required");

  if (!data.skills || !Array.isArray(data.skills) || data.skills.length === 0)
    throw new Error("At least one skill is required");

  if (!data.contact || !data.contact.countryCode || !data.contact.phone)
    throw new Error("Contact countryCode and phone are required");

  const portfolio = await Portfolio.create({ user: userId, ...data });

  return portfolio;
};

exports.getMyPortfolio = async (userId) => {
  return Portfolio.findOne({ user: userId }).populate(
    "user",
    "name phone role"
  );
};

exports.updatePortfolio = async (userId, data) => {
  const portfolio = await Portfolio.findOne({ user: userId });

  if (!portfolio) {
    throw new Error("Portfolio not found");
  }

  // Validate fields if they are being updated
  if (data.name === "" || data.name === null) throw new Error("Name is required");
  if (data.location === "" || data.location === null) throw new Error("Location is required");
  if (data.profession === "" || data.profession === null) throw new Error("Profession is required");
  if (data.bio === "" || data.bio === null) throw new Error("Bio is required");

  if (data.services && (!Array.isArray(data.services) || data.services.length === 0))
    throw new Error("At least one service is required");

  if (data.skills && (!Array.isArray(data.skills) || data.skills.length === 0))
    throw new Error("At least one skill is required");

  if (data.contact && (!data.contact.countryCode || !data.contact.phone))
    throw new Error("Contact countryCode and phone are required");

  Object.assign(portfolio, data);
  await portfolio.save();

  // sync changes to all user's posts
  await postService.updateUserPostsSnapshot(userId, data);

  return portfolio;
};
