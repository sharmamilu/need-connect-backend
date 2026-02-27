const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../utils/cloudinary");

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    let folderName = "misc";
    if (req.originalUrl.includes("/profile")) {
      folderName = "profiles";
    } else if (req.originalUrl.includes("/gallery")) {
      folderName = "portfolios";
    } else if (req.originalUrl.includes("/post")) {
      folderName = "posts";
    } else if (req.originalUrl.includes("/listing")) {
      folderName = "listings";
    }

    return {
      folder: folderName,
      allowed_formats: ["jpg", "jpeg", "png", "webp"], // added webp as common upload format
      transformation: [{ width: 800, crop: "limit" }],
    };
  },
});

const upload = multer({ storage });

module.exports = upload;
