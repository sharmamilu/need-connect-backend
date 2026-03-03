const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    templateType: {
      type: String,
      required: true,
      enum: ["invoice", "quotation", "proposal", "contract", "resume"],
    },
    designStyle: {
      type: String,
      enum: ["classic", "creative", "dark", "elegant"],
      default: "classic",
    },

    // A mixed object to catch all the dynamic frontend fields
    // (e.g. { title, amount, dueDate, experience, education, timeline, etc. })
    formData: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Document", documentSchema);
