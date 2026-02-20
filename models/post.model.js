const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },

    images: {
      type: [String],
      default: [],
    },

    tags: [
      {
        type: String,
        trim: true,
      },
    ],

    likesCount: {
      type: Number,
      default: 0,
    },

    commentsCount: {
      type: Number,
      default: 0,
    },

    backgroundStyle: {
      type: String,
    },

    // snapshot of posting user at creation time
    userImage: {
      type: String,
    },
    userProfession: {
      type: String,
    },

    userName: {
      type: String,
    },
  },
  { timestamps: true }
);

// Indexing for feed & search
postSchema.index({ createdAt: -1 });
postSchema.index({ tags: 1 });

module.exports = mongoose.model("Post", postSchema);