const mongoose = require("mongoose");

const portfolioSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // one portfolio per user
    },

    profilePhoto: {
      type: String,
    },

    name: {
      type: String,
      required: true,
    },

    location: {
      type: String,
      required: true,
    },

    profession: {
      type: String,
      required: true,
    },

    bio: {
      type: String,
      default: "",
    },

    services: {
      type: [String],
      default: [],
    },

    skills: {
      type: [String],
      default: [],
    },

    gallery: {
      type: [String],
      default: [],
    },

    links: {
      type: Map,
      of: String,
      default: {},
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Portfolio", portfolioSchema);
