const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    email: { type: String },
    dateOfBirth: { type: String },
    countryCode: { type: String, default: "+1" },
    password: { type: String, required: true },
    averageRating: {
      type: Number,
      default: 0,
    },

    totalReviews: {
      type: Number,
      default: 0,
    },
    userRole: {
      type: String,
      default: "user",
      enum: ["user", "admin"], // Defining generic roles
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
