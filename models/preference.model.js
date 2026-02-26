const mongoose = require("mongoose");

const preferenceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    feedType: {
      type: String,
      enum: ["recommended", "latest"],
      default: "latest",
    },
    locations: {
      type: [String],
      default: [],
    },
    skills: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Preference", preferenceSchema);
