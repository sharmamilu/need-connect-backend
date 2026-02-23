const { toggleLikeService, getPostLikesService } = require("../services/like.service");

exports.toggleLike = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    const result = await toggleLikeService(postId, userId);

    res.status(200).json({
      success: true,
      liked: result.liked,
    });
  } catch (error) {
    next(error);
  }
};

exports.getPostLikes = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const data = await getPostLikesService(
      postId,
      Number(page),
      Number(limit)
    );

    res.status(200).json({
      success: true,
      ...data,
      count: data.total,
    });
  } catch (error) {
    next(error);
  }
};