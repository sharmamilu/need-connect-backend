const postService = require("../services/post.service");


exports.createPost = async (req, res, next) => {
  try {
    const post = await postService.createPost(req.user.id, req.body);

    res.status(201).json({
      success: true,
      message: "Post created successfully",
      data: post,
    });
  } catch (error) {
    next(error);
  }
};

exports.getMyPosts = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const data = await postService.getUserPosts(
      req.user.id,
      Number(page),
      Number(limit),
      req.user.id
    );

    res.json({
      success: true,
      ...data,
      count: data.total,
    });
  } catch (error) {
    next(error);
  }
};

exports.getFeed = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const data = await postService.getFeedPosts(
      Number(page),
      Number(limit),
      req.user ? req.user.id : undefined
    );

    res.json({
      success: true,
      ...data,
        count: data.total,
    });
  } catch (error) {
    next(error);
  }
};

exports.deletePost = async (req, res, next) => {
  try {
    const { postId } = req.params;
    await postService.deletePost(req.user.id, postId);

    res.json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

exports.getPostsByUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const data = await postService.getUserPosts(
      userId,
      Number(page),
      Number(limit)
    );

    res.json({
      success: true,
      ...data,
      count: data.total,
    });
  } catch (error) {
    next(error);
  }
};