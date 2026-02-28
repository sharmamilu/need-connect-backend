const mongoose = require("mongoose");
const User = require("../models/user.model");
const Post = require("../models/post.model");
const Listing = require("../models/listing.model");
const Portfolio = require("../models/portfolio.model");
const Preference = require("../models/preference.model");
const cloudinary = require("../utils/cloudinary");

// Helper function to extract Cloudinary public ID from URL
const extractPublicIdFromUrl = (url) => {
  if (!url) return null;
  const match = url.match(/\/([^\/]+)\.[a-z]+$/);
  return match ? match[1] : null;
};

exports.deleteMyAccount = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;

    // 1. Detele All Cloudinary Images Associated with the User's Posts
    const userPosts = await Post.find({ user: userId });
    for (const post of userPosts) {
      if (post.images && post.images.length > 0) {
        for (const imageUrl of post.images) {
          const publicId = extractPublicIdFromUrl(imageUrl);
          if (publicId) {
            try {
              await cloudinary.uploader.destroy(publicId);
            } catch (err) {
              console.error(
                `Failed to delete Cloudinary image (Post) ${publicId}:`,
                err,
              );
            }
          }
        }
      }
    }

    // 2. Delete All Cloudinary Images Associated with the User's Listings
    const userListings = await Listing.find({ author: userId });
    for (const listing of userListings) {
      if (listing.images && listing.images.length > 0) {
        for (const imageUrl of listing.images) {
          const publicId = extractPublicIdFromUrl(imageUrl);
          if (publicId) {
            try {
              await cloudinary.uploader.destroy(publicId);
            } catch (err) {
              console.error(
                `Failed to delete Cloudinary image (Listing) ${publicId}:`,
                err,
              );
            }
          }
        }
      }
    }

    // 3. Delete Profile Photo & Portfolio Images from Cloudinary
    const userPortfolio = await Portfolio.findOne({ user: userId });
    if (userPortfolio) {
      if (userPortfolio.profilePhoto) {
        const publicId = extractPublicIdFromUrl(userPortfolio.profilePhoto);
        if (publicId)
          await cloudinary.uploader.destroy(publicId).catch(console.error);
      }
      if (userPortfolio.gallery && userPortfolio.gallery.length > 0) {
        for (const imageUrl of userPortfolio.gallery) {
          const publicId = extractPublicIdFromUrl(imageUrl);
          if (publicId)
            await cloudinary.uploader.destroy(publicId).catch(console.error);
        }
      }
    }

    // 4. Delete the actual related mongodb documents
    await Promise.all([
      Post.deleteMany({ user: userId }),
      Listing.deleteMany({ author: userId }),
      Portfolio.deleteOne({ user: userId }),
      Preference.deleteOne({ user: userId }),
      /* NOTE: Usually you would also delete likes, comments, etc here using similar code 
         if you have foreign keys that would otherwise be left hanging.
      */
    ]);

    // 5. Finally, delete the User document本身
    await User.findByIdAndDelete(userId);

    res.status(200).json({
      success: true,
      message: "Account and all associated content fully deleted.",
    });
  } catch (error) {
    next(error);
  }
};
