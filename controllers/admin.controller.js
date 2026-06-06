const Post = require("../models/post.model");
const Listing = require("../models/listing.model");

// @desc    Get all pending posts
// @route   GET /api/admin/posts
// @access  Private/Admin
exports.getPendingPosts = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const posts = await Post.find({ status: "Pending" })
      .populate("user", "name _id")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Post.countDocuments({ status: "Pending" });

    res.status(200).json({
      success: true,
      count: posts.length,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
      },
      data: posts,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve or Reject a Post
// @route   PATCH /api/admin/posts/:id/approve
// @route   PATCH /api/admin/posts/:id/reject
// @access  Private/Admin
exports.updatePostStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    // Check if it's a valid status update request
    if (!["Active", "Rejected"].includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid status" });
    }

    const post = await Post.findById(id);

    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }

    if (status === "Rejected" && !rejectionReason) {
      return res.status(400).json({
        success: false,
        message: "You must provide a rejection reason when rejecting.",
      });
    }

    post.status = status;
    if (status === "Rejected") {
      post.rejectionReason = rejectionReason;
    }

    await post.save();

    res.status(200).json({
      success: true,
      data: post,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all pending listings
// @route   GET /api/admin/listings
// @access  Private/Admin
exports.getPendingListings = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const listings = await Listing.find({ status: "Pending" })
      .populate("author", "name _id")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Listing.countDocuments({ status: "Pending" });

    res.status(200).json({
      success: true,
      count: listings.length,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
      },
      data: listings,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve or Reject a Listing
// @route   PATCH /api/admin/listings/:id/approve
// @route   PATCH /api/admin/listings/:id/reject
// @access  Private/Admin
exports.updateListingStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    if (!["Active", "Rejected"].includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid status" });
    }

    const listing = await Listing.findById(id);

    if (!listing) {
      return res
        .status(404)
        .json({ success: false, message: "Listing not found" });
    }

    if (status === "Rejected" && !rejectionReason) {
      return res.status(400).json({
        success: false,
        message: "You must provide a rejection reason when rejecting.",
      });
    }

    listing.status = status;
    if (status === "Rejected") {
      listing.rejectionReason = rejectionReason;
    }

    await listing.save();

    res.status(200).json({
      success: true,
      data: listing,
    });
  } catch (error) {
    next(error);
  }
};
