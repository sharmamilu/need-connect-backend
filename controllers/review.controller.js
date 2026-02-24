const asyncHandler = require("express-async-handler");
const {
  createReviewService,
  getUserReviewsService,
  getUserRatingStatsService,
} = require("../services/review.service");

exports.createReview = asyncHandler(async (req, res) => {
  const reviewerId = req.user.id;

  const { reviewedUserId, relation, rating, referToOthers, questions } =
    req.body;

  if (reviewerId === reviewedUserId) {
    return res.status(400).json({
      success: false,
      message: "You cannot review yourself.",
    });
  }

  const review = await createReviewService({
    reviewerId,
    reviewedUserId,
    relation,
    rating,
    referToOthers,
    questions,
  });

  res.status(201).json({
    success: true,
    data: review,
  });
});

exports.getUserReviews = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const data = await getUserReviewsService(userId, Number(page), Number(limit));

  res.status(200).json({
    success: true,
    ...data,
    count: data.total,
  });
});

exports.getUserRatingStats = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const stats = await getUserRatingStatsService(userId);

  res.status(200).json({
    success: true,
    data: stats,
  });
});
