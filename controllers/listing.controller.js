const Listing = require("../models/listing.model");
const mongoose = require("mongoose");

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
      contactInfo,
      condition,
      images,
    } = req.body;

    // Additional backend validation to ensure Donate/Free type forces Price to 'Free'
    let finalPrice = price;
    if (listingType === "Donate" || listingType === "Free") {
      finalPrice = "Free";
    }

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
    };

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
    const { page = 1, limit = 10, search, category } = req.query;

    const query = { status: "Active" }; // We only want ACTIVE ones

    if (search) {
      query.$text = { $search: search }; // Utilizing MongoDB Text Search created in schema
    }

    if (category) {
      query.category = category;
    }

    const limitNum = parseInt(limit, 10);
    const skip = (parseInt(page, 10) - 1) * limitNum;

    const listings = await Listing.find(query)
      .populate("author", "name avatarUrl _id") // Providing brief seller info
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
      "name avatarUrl email _id", // Detailed author information for single view
    );

    if (!listing) {
      return res
        .status(404)
        .json({ success: false, error: "Listing not found" });
    }

    res.status(200).json({
      success: true,
      data: listing,
    });
  } catch (error) {
    next(error);
  }
};
