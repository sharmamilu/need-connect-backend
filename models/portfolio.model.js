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

    contact: {
        countryCode: { type: String, required: true },
        phone: { type: String, required: true },
    },
    email: {
      type: String,
    },
    profession: {
      type: String,
      required: true,
    },

    bio: {
      type: String,
      required: true,
    },

    services: {
      type: [String],
      default: [],
      validate: {
        validator: function (arr) {
          return Array.isArray(arr) && arr.length > 0;
        },
        message: "At least one service is required",
      },
    },

    skills: {
      type: [String],
      default: [],
      validate: {
        validator: function (arr) {
          return Array.isArray(arr) && arr.length > 0;
        },
        message: "At least one skill is required",
      },
    },

    gallery: {
      type: [String],
      default: [],
    },

    experience: [
      {
        id: String,
        role: String,
        company: String,
        startDate: String,
        endDate: String,
        description: String,
        currentlyWorking: Boolean,
      },
    ],

    links: {
      type: Map,
      of: String,
      default: {},
    },

    backgroundStyle: {
      type: String,
    },
  },
  { timestamps: true },
);


portfolioSchema.index({ location: 1 });
portfolioSchema.index({ profession: 1 });
portfolioSchema.index({ skills: 1 });
portfolioSchema.index({ services: 1 });
portfolioSchema.index({ name: 1 });

// Optional text index for advanced search
portfolioSchema.index({
  name: "text",
  profession: "text",
  skills: "text",
  services: "text",
});


module.exports = mongoose.model("Portfolio", portfolioSchema);
