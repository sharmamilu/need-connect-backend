const Portfolio = require("../models/portfolio.model");

exports.createPortfolio = async (userId, data) => {
  const existing = await Portfolio.findOne({ user: userId });

  if (existing) {
    throw new Error("Portfolio already exists");
  }

  const portfolio = await Portfolio.create({
    user: userId,
    ...data,
  });

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

  Object.assign(portfolio, data);
  await portfolio.save();

  return portfolio;
};
