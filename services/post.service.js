const Post = require("../models/post.model");
const Portfolio = require("../models/portfolio.model");
const User = require("../models/user.model");
const Preference = require("../models/preference.model");
const cloudinary = require("../utils/cloudinary");

exports.createPost = async (userId, data) => {
  // Accept `images` array or single `image` string (backwards compatible)
  const imagesInput = Array.isArray(data.images)
    ? data.images
    : data.images
      ? [data.images]
      : [];
  if (data.image) imagesInput.push(data.image);

  // Normalize and filter out falsy values
  const images = imagesInput
    .map(String)
    .map((s) => s.trim())
    .filter((s) => s);

  // grab a snapshot of the user's profile that we need on the frontend
  const [portfolio, user] = await Promise.all([
    Portfolio.findOne({ user: userId }, "profilePhoto profession"),
    User.findById(userId, "name"),
  ]);

  return await Post.create({
    user: userId,
    description: data.description,
    images,
    tags: data.tags || [],
    userImage: portfolio ? portfolio.profilePhoto : undefined,
    userProfession: portfolio ? portfolio.profession : undefined,
    userName: user ? user.name : undefined,
    backgroundStyle: data.backgroundStyle,
  });
};

const Like = require("../models/like.model");
const SavedPost = require("../models/savedPost.model");

// helper to flag array of posts with like and save status for a given user
async function annotatePostStatus(posts, userId) {
  if (!userId || posts.length === 0) return posts;
  const postIds = posts.map((p) => p._id);

  const [likes, saves] = await Promise.all([
    Like.find({ post: { $in: postIds }, user: userId }).select("post"),
    SavedPost.find({ post: { $in: postIds }, user: userId }).select("post"),
  ]);

  const likedSet = new Set(likes.map((l) => l.post.toString()));
  const savedSet = new Set(saves.map((s) => s.post.toString()));

  return posts.map((p) => {
    const obj = p.toObject ? p.toObject() : p;
    obj.liked = likedSet.has(p._id.toString());
    obj.saved = savedSet.has(p._id.toString());
    return obj;
  });
}

exports.getUserPosts = async (userId, page = 1, limit = 10, currentUserId) => {
  const skip = (page - 1) * limit;

  // If the user is viewing their OWN profile, show all posts (Pending, Active, Rejected).
  // If they are viewing someone ELSE'S profile (or not logged in), show only Active posts.
  const query = { user: userId };
  if (!currentUserId || userId.toString() !== currentUserId.toString()) {
    query.status = "Active";
  }

  let posts = await Post.find(query)
    .sort({ isPinned: -1, createdAt: -1 }) // Pinned posts surface to the top of the user profile!
    .skip(skip)
    .limit(limit);

  const total = await Post.countDocuments(query);

  if (currentUserId) {
    posts = await annotatePostStatus(posts, currentUserId);
  }

  return {
    posts,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
};

// ... SAVE & PIN FEATURES ...

exports.toggleSavePostService = async (postId, userId) => {
  const existingSave = await SavedPost.findOne({ post: postId, user: userId });
  if (existingSave) {
    await SavedPost.deleteOne({ _id: existingSave._id });
    return { saved: false };
  } else {
    await SavedPost.create({ post: postId, user: userId });
    return { saved: true };
  }
};

exports.getSavedPostsService = async (userId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const savedDocs = await SavedPost.find({ user: userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("post");

  const total = await SavedPost.countDocuments({ user: userId });

  // Extract posts and filter out any dissolved (deleted) documents
  let posts = savedDocs.map((doc) => doc.post).filter(Boolean);

  posts = await annotatePostStatus(posts, userId);

  return {
    posts,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
};

exports.togglePinPostService = async (postId, userId) => {
  const post = await Post.findById(postId);
  if (!post) throw new Error("Post not found");

  if (post.user.toString() !== userId.toString()) {
    throw new Error("Unauthorized: You can only pin your own posts");
  }

  post.isPinned = !post.isPinned;
  await post.save();

  return { isPinned: post.isPinned };
};

exports.getFeedPosts = async (page = 1, limit = 10, currentUserId) => {
  const skip = (page - 1) * limit;

  let sortCriteria = { createdAt: -1 };
  let matchPipelineStage = { $match: { status: "Active" } }; // Only show actively approved posts

  if (currentUserId) {
    const pref = await Preference.findOne({ user: currentUserId });
    if (pref && pref.feedType === "recommended") {
      const prefTags = [...(pref.skills || []), ...(pref.locations || [])]
        .map((t) => t.trim())
        .filter(Boolean);

      if (prefTags.length > 0) {
        // Create an array of $regexMatch expressions for each preferred tag
        const regexMatches = prefTags.map((tag) => ({
          $regexMatch: { input: "$$postTag", regex: tag, options: "i" },
        }));

        matchPipelineStage = {
          $match: { status: "Active" }, // Retain the basic filter inside the score logic
          $addFields: {
            matchScore: {
              $size: {
                $filter: {
                  input: { $ifNull: ["$tags", []] },
                  as: "postTag",
                  cond: { $or: regexMatches },
                },
              },
            },
          },
        };
        // Sort by matchScore descending first, then newest
        sortCriteria = { matchScore: -1, createdAt: -1 };
      }
    }
  }

  const pipeline = [];

  // Add scoring dynamically if recommended preferences are set
  if (matchPipelineStage) {
    pipeline.push(matchPipelineStage);
  }

  pipeline.push({ $sort: sortCriteria });
  pipeline.push({ $skip: skip });
  pipeline.push({ $limit: limit });

  // Use aggregation to fetch
  let postsObj = await Post.aggregate(pipeline);
  const total = await Post.countDocuments({ status: "Active" });

  // Re-hydrate full mongoose models to keep compatible with your annotate methods
  let posts = postsObj.map((p) => new Post(p));

  if (currentUserId) {
    posts = await annotatePostStatus(posts, currentUserId);
  }

  return {
    posts,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
};

exports.updateUserPostsSnapshot = async (userId, updateData) => {
  // When portfolio is updated, sync changes to all posts for this user
  const updateFields = {};

  if (updateData.profilePhoto !== undefined) {
    updateFields.userImage = updateData.profilePhoto;
  }
  if (updateData.profession !== undefined) {
    updateFields.userProfession = updateData.profession;
  }
  if (updateData.backgroundStyle !== undefined) {
    updateFields.backgroundStyle = updateData.backgroundStyle;
  }

  // Only update if there are fields to update
  if (Object.keys(updateFields).length > 0) {
    await Post.updateMany({ user: userId }, { $set: updateFields });
  }
};

// Helper function to extract Cloudinary public ID from URL
const extractPublicIdFromUrl = (url) => {
  if (!url) return null;
  // Cloudinary URLs look like: https://res.cloudinary.com/cloud_name/image/upload/v123/public_id.extension
  const match = url.match(/\/([^\/]+)\.[a-z]+$/);
  return match ? match[1] : null;
};

exports.deletePost = async (userId, postId) => {
  const post = await Post.findById(postId);

  if (!post) {
    throw new Error("Post not found");
  }

  // Verify post belongs to user
  if (post.user.toString() !== userId) {
    throw new Error("Unauthorized to delete this post");
  }

  // Delete images from Cloudinary
  if (post.images && post.images.length > 0) {
    for (const imageUrl of post.images) {
      const publicId = extractPublicIdFromUrl(imageUrl);
      if (publicId) {
        try {
          await cloudinary.uploader.destroy(publicId);
        } catch (error) {
          console.error(
            `Failed to delete Cloudinary image ${publicId}:`,
            error,
          );
          // Don't throw error, continue with post deletion
        }
      }
    }
  }

  // Delete post from database
  await Post.findByIdAndDelete(postId);
};
