const mongoose = require("mongoose");

const listingSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Listing title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: {
        values: [
          "Electronics",
          "Furniture",
          "Clothing",
          "Books",
          "Vehicles",
          "Services",
          "Other",
        ],
        message: "{VALUE} is not a supported category",
      },
    },
    listingType: {
      type: String,
      required: [true, "Listing type is required"],
      enum: {
        values: ["Sell", "Donate", "Free"],
        message: "{VALUE} is not a supported listing type",
      },
    },
    userImage: {
      type: String,
    },
    userProfession: {
      type: String,
    },
    userName: {
      type: String,
      required: [true, "User name is required"],
      trim: true,
    },
    price: {
      type: String,
      required: [true, "Price is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
    },
    contactInfo: {
      type: String,
      required: [true, "Contact information is required"],
      trim: true,
    },
    condition: {
      type: String,
      required: [true, "Item condition is required"],
      enum: {
        values: ["New", "Like New", "Used"],
        message: "{VALUE} is not a supported item condition",
      },
    },
    images: [
      {
        type: String,
        required: [true, "At least one image URL is required"],
        match: [/^https?:\/\/.+/, "Please provide a valid image URL"],
      },
    ],
    status: {
      type: String,
      enum: ["Pending", "Active", "Sold", "Archived", "Rejected"],
      default: "Pending",
    },
    rejectionReason: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

// Optional: Indexing for faster search queries (if search functionality is needed on title/description)
listingSchema.index({ title: "text", description: "text", category: 1 });

module.exports = mongoose.model("Listing", listingSchema);
