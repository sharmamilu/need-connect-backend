const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // templateType is a frontend-driven identifier (e.g. invoice, receipt,
    // payslip, nda, coverletter, ...). Kept as a free string so new templates
    // can be added in the app without a backend migration.
    templateType: {
      type: String,
      required: true,
      trim: true,
    },
    designStyle: {
      type: String,
      enum: ["classic", "creative", "dark", "elegant"],
      default: "classic",
    },

    // A mixed object to catch all the dynamic frontend fields
    // (e.g. { title, amount, dueDate, experience, education, personalDetails, etc. })
    formData: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Document", documentSchema);
