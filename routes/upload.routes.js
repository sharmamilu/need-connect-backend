const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const upload = require("../middlewares/upload.middleware");
const {
  uploadSingleImage,
  uploadMultipleImages,
} = require("../controllers/upload.controller");

const router = express.Router();

// Profile photo
router.post(
  "/profile",
  authMiddleware,
  upload.single("image"),
  uploadSingleImage,
);

// Portfolio gallery
router.post(
  "/gallery",
  authMiddleware,
  upload.array("images", 8),
  uploadMultipleImages,
);

router.post(
  "/post",
  authMiddleware,
  upload.array("images", 8),
  uploadMultipleImages,
);
module.exports = router;
