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

  if (
    !data.services ||
    !Array.isArray(data.services) ||
    data.services.length === 0
  )
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
    "name phone role",
  );
};

exports.updatePortfolio = async (userId, data) => {
  const portfolio = await Portfolio.findOne({ user: userId });

  if (!portfolio) {
    throw new Error("Portfolio not found");
  }

  // Validate fields if they are being updated
  if (data.name === "" || data.name === null)
    throw new Error("Name is required");
  if (data.location === "" || data.location === null)
    throw new Error("Location is required");
  if (data.profession === "" || data.profession === null)
    throw new Error("Profession is required");
  if (data.bio === "" || data.bio === null) throw new Error("Bio is required");

  if (
    data.services &&
    (!Array.isArray(data.services) || data.services.length === 0)
  )
    throw new Error("At least one service is required");

  if (data.skills && (!Array.isArray(data.skills) || data.skills.length === 0))
    throw new Error("At least one skill is required");

  if (data.contact && (!data.contact.countryCode || !data.contact.phone))
    throw new Error("Contact countryCode and phone are required");

  const isPhotoChanged =
    data.profilePhoto && data.profilePhoto !== portfolio.profilePhoto;

  Object.assign(portfolio, data);
  await portfolio.save();

  // sync changes to all user's posts
  await postService.updateUserPostsSnapshot(userId, data);

  // sync changes to all user's reviews ONLY if photo specifically changed
  if (isPhotoChanged) {
    const reviewService = require("./review.service");
    await reviewService.updateReviewerPhotoSnapshot(userId, data.profilePhoto);
  }

  return portfolio;
};

const SavedPortfolio = require("../models/savedPortfolio.model");

exports.annotateSavedStatus = async (portfolios, userId) => {
  if (!userId || portfolios.length === 0) return portfolios;
  const portfolioIds = portfolios.map((p) => p._id);

  const saves = await SavedPortfolio.find({
    portfolio: { $in: portfolioIds },
    user: userId,
  }).select("portfolio");
  const savedSet = new Set(saves.map((s) => s.portfolio.toString()));

  return portfolios.map((p) => {
    // Handling mongoose docs or lean plain objects seamlessly
    const obj = p.toObject ? p.toObject() : p;
    obj.saved = savedSet.has(obj._id.toString());
    return obj;
  });
};

exports.toggleSavePortfolioService = async (portfolioId, userId) => {
  const existingSave = await SavedPortfolio.findOne({
    portfolio: portfolioId,
    user: userId,
  });
  if (existingSave) {
    await SavedPortfolio.deleteOne({ _id: existingSave._id });
    return { saved: false };
  } else {
    await SavedPortfolio.create({ portfolio: portfolioId, user: userId });
    return { saved: true };
  }
};

exports.getSavedPortfoliosService = async (userId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const savedDocs = await SavedPortfolio.find({ user: userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("portfolio");

  const total = await SavedPortfolio.countDocuments({ user: userId });

  // Extract portfolios and filter out any dissolved (deleted) documents
  let portfolios = savedDocs.map((doc) => doc.portfolio).filter(Boolean);

  // Tag them all as saved since they came directly from the saves table
  portfolios = portfolios.map((p) => {
    const obj = p.toObject ? p.toObject() : p;
    obj.saved = true;
    return obj;
  });

  return {
    portfolios,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
};
