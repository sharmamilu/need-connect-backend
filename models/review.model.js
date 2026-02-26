const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
    },
    answer: {
      type: String,
      required: true,
      maxlength: 500,
    },
  },
  { _id: false },
);

const reviewSchema = new mongoose.Schema(
  {
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    reviewedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    relation: {
      type: String,
      enum: ["worked_with", "work_done_for"],
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    referToOthers: {
      type: Boolean,
      default: false,
    },
    questions: [questionSchema],
  },
  { timestamps: true },
);

// Prevent duplicate review by same reviewer
reviewSchema.index({ reviewer: 1, reviewedUser: 1 }, { unique: true });

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
