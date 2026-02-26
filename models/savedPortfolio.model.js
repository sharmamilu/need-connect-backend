const mongoose = require("mongoose");

const savedPortfolioSchema = new mongoose.Schema(
  {
    portfolio: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Portfolio",
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

// Prevent duplicate saves from same user
savedPortfolioSchema.index({ portfolio: 1, user: 1 }, { unique: true });

module.exports = mongoose.model("SavedPortfolio", savedPortfolioSchema);
