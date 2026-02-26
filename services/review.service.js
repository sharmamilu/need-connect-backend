const mongoose = require("mongoose");
const Review = require("../models/review.model");
const User = require("../models/user.model");

exports.createReviewService = async ({
  reviewerId,
  reviewedUserId,
  relation,
  rating,
  referToOthers,
  questions,
}) => {
  // instantiate Document and save, avoiding Mongoose implicit transactions for standalone DB
  const review = new Review({
    reviewer: reviewerId,
    reviewedUser: reviewedUserId,
    relation,
    rating,
    referToOthers,
    questions,
  });

  await review.save();

  const user = await User.findById(reviewedUserId);
  if (!user) throw new Error("User not found");

  const totalReviews = user.totalReviews || 0;
  const averageRating = user.averageRating || 0;

  const newTotalReviews = totalReviews + 1;
  const newAverage = (averageRating * totalReviews + rating) / newTotalReviews;

  user.totalReviews = newTotalReviews;
  user.averageRating = Number(newAverage.toFixed(2)); // Round to 2 decimal places

  await user.save();

  // Populate reviewer name
  await review.populate("reviewer", "name");

  // Fetch reviewer portfolio photo
  const Portfolio = require("../models/portfolio.model");
  const portfolio = await Portfolio.findOne({ user: reviewerId }).select(
    "profilePhoto",
  );

  const rObj = review.toObject();
  return {
    ...rObj,
    reviewerName: review.reviewer?.name || "Unknown User",
    reviewerPhoto: portfolio?.profilePhoto || null,
  };
};

exports.getUserReviewsService = async (userId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const [reviews, totalDocuments, user] = await Promise.all([
    Review.find({ reviewedUser: userId })
      .populate("reviewer", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Review.countDocuments({ reviewedUser: userId }),
    User.findById(userId, "averageRating totalReviews"),
  ]);

  if (!reviews.length) {
    return {
      reviews: [],
      total: totalDocuments,
      page,
      totalPages: Math.ceil(totalDocuments / limit),
      stats: {
        averageRating: user?.averageRating || 0,
        totalReviews: user?.totalReviews || 0,
      },
    };
  }

  // Fetch portfolio photos for all reviewers
  const reviewerIds = reviews.map((r) => r.reviewer._id);
  const Portfolio = require("../models/portfolio.model");
  const portfolios = await Portfolio.find({
    user: { $in: reviewerIds },
  }).select("user profilePhoto");

  const profileMap = portfolios.reduce((acc, p) => {
    acc[p.user.toString()] = p.profilePhoto;
    return acc;
  }, {});

  const formattedReviews = reviews.map((review) => {
    const rObj = review.toObject();
    return {
      ...rObj,
      reviewerName: review.reviewer?.name || "Unknown User",
      reviewerPhoto: profileMap[review.reviewer._id.toString()] || null,
    };
  });

  return {
    reviews: formattedReviews,
    total: totalDocuments,
    page,
    totalPages: Math.ceil(totalDocuments / limit),
    stats: {
      averageRating: user?.averageRating || 0,
      totalReviews: user?.totalReviews || 0,
    },
  };
};

exports.getUserRatingStatsService = async (userId) => {
  const [user, portfolio] = await Promise.all([
    User.findById(userId, "averageRating totalReviews"),
    require("../models/portfolio.model")
      .findOne({ user: userId })
      .select("profilePhoto"),
  ]);

  if (!user) throw new Error("User not found");

  return {
    averageRating: user.averageRating || 0,
    totalReviews: user.totalReviews || 0,
    profilePhoto: portfolio?.profilePhoto || null,
  };
};

exports.updateReviewerPhotoSnapshot = async (userId, profilePhotoUrl) => {
  // Purposefully blank.
  // Reviews already dynamically fetch the portfolio photo of the reviewer at runtime
  // inside `getUserReviewsService`. This hook exists purely for scalable architectural parity
  // with `post.service.js` if review model caching is implemented in the future.
  return true;
};
