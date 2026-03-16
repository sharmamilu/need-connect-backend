const Listing = require("../models/listing.model");
const mongoose = require("mongoose");
const User = require("../models/user.model");
const Portfolio = require("../models/portfolio.model");
const cloudinary = require("../utils/cloudinary");

// @desc    Create a new listing
// @route   POST /api/listings
// @access  Private
exports.createListing = async (req, res, next) => {
  try {
    const {
      title,
      category,
      listingType,
      price,
      description,
      address,
      lat,
      lng,
      contactInfo,
      condition,
      images,
    } = req.body;

    // Additional backend validation to ensure Donate/Free type forces Price to 'Free'
    let finalPrice = price;
    if (listingType === "Donate" || listingType === "Free") {
      finalPrice = "Free";
    }

    // Grab a snapshot of the user's profile and name
    const [portfolio, user] = await Promise.all([
      Portfolio.findOne({ user: req.user._id }, "profilePhoto profession"),
      User.findById(req.user._id, "name"),
    ]);

    // Creating the final formatted Listing object to be saved
    const listingData = {
      author: req.user._id, // Appended by our authMiddleware
      title,
      category,
      listingType,
      price: finalPrice,
      description,
      address,
      contactInfo,
      condition,
      images,
      userImage: portfolio ? portfolio.profilePhoto : undefined,
      userProfession: portfolio ? portfolio.profession : undefined,
      userName: user ? user.name : undefined,
    };

    if (lat && lng) {
      listingData.location = {
        type: "Point",
        coordinates: [parseFloat(lng), parseFloat(lat)],
      };
    }

    const newListing = await Listing.create(listingData);

    res.status(201).json({
      success: true,
      data: newListing,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        success: false,
        error: messages.join(", "),
      });
    }
    next(error);
  }
};

// @desc    Get all active listings (with Pagination & Search Filters)
// @route   GET /api/listings
// @access  Public (or Private depending on your need, making it public here like typical marketplaces)
exports.getListings = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      category,
      lat,
      lng,
      radius,
    } = req.query;

    const query = { status: "Active" }; // We only want ACTIVE ones

    if (search) {
      query.$text = { $search: search }; // Utilizing MongoDB Text Search created in schema
    }

    if (category) {
      query.category = category;
    }

    if (lat && lng && radius) {
      query.location = {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          $maxDistance: parseInt(radius) * 1000,
        },
      };
    }

    const limitNum = parseInt(limit, 10);
    const skip = (parseInt(page, 10) - 1) * limitNum;

    const listings = await Listing.find(query)
      .populate("author", "name _id") // Providing brief seller info
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Listing.countDocuments(query);

    res.status(200).json({
      success: true,
      count: listings.length,
      pagination: {
        total,
        page: parseInt(page, 10),
        pages: Math.ceil(total / limitNum),
      },
      data: listings,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single listing details
// @route   GET /api/listings/:id
// @access  Public
exports.getSingleListing = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid Listing ID" });
    }

    const listing = await Listing.findById(id).populate(
      "author",
      "name email _id", // Detailed author information for single view
    );

    if (!listing) {
      return res
        .status(404)
        .json({ success: false, error: "Listing not found" });
    }

    // Ensure userImage is provided if available, fetching from portfolio if snapshot is missing
    if (!listing.userImage && listing.author) {
      const portfolio = await Portfolio.findOne(
        { user: listing.author._id },
        "profilePhoto",
      );
      if (portfolio) {
        listing.userImage = portfolio.profilePhoto;
      }
    }

    res.status(200).json({
      success: true,
      data: listing,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all active listings of a specific user
// @route   GET /api/listings/user/:userId
// @access  Public (Optional Auth for self-view of pending items)
exports.getUserListings = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, error: "Invalid User ID" });
    }

    const query = { author: userId };

    // If not their own profile, only show Active listings
    const currentUserId = req.user ? req.user._id || req.user.id : null;
    if (!currentUserId || userId.toString() !== currentUserId.toString()) {
      query.status = "Active";
    }

    const limitNum = parseInt(limit, 10);
    const skip = (parseInt(page, 10) - 1) * limitNum;

    const listings = await Listing.find(query)
      .populate("author", "name _id")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Listing.countDocuments(query);

    res.status(200).json({
      success: true,
      count: listings.length,
      pagination: {
        total,
        page: parseInt(page, 10),
        pages: Math.ceil(total / limitNum),
      },
      data: listings,
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to extract Cloudinary public ID from URL
const extractPublicIdFromUrl = (url) => {
  if (!url) return null;
  const match = url.match(/\/([^\/]+)\.[a-z]+$/);
  return match ? match[1] : null;
};

// @desc    Delete a listing and its images
// @route   DELETE /api/listings/:id
// @access  Private
exports.deleteListing = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid Listing ID" });
    }

    const listing = await Listing.findById(id);

    if (!listing) {
      return res
        .status(404)
        .json({ success: false, error: "Listing not found" });
    }

    // Check ownership
    if (listing.author.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to delete this listing",
      });
    }

    // Delete images from cloudinary
    if (listing.images && listing.images.length > 0) {
      for (const imageUrl of listing.images) {
        const publicId = extractPublicIdFromUrl(imageUrl);
        if (publicId) {
          try {
            await cloudinary.uploader.destroy(publicId);
          } catch (err) {
            console.error(
              `Failed to delete Cloudinary image ${publicId}:`,
              err,
            );
          }
        }
      }
    }

    // Delete listing document
    await Listing.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Listing and associated images deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
// @desc    Update listing snapshots for a user (when portfolio changes)
exports.updateListingSnapshot = async (userId, updateData) => {
  const updateFields = {};

  if (updateData.profilePhoto !== undefined) {
    updateFields.userImage = updateData.profilePhoto;
  }
  if (updateData.profession !== undefined) {
    updateFields.userProfession = updateData.profession;
  }
  if (updateData.name !== undefined) {
    updateFields.userName = updateData.name;
  }

  if (Object.keys(updateFields).length > 0) {
    await Listing.updateMany({ author: userId }, { $set: updateFields });
  }
};
