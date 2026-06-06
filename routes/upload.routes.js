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
  "/listing",
  authMiddleware,
  upload.array("images", 10),
  uploadMultipleImages,
);

router.post(
  "/post",
  (req, res, next) => {
    console.log("\n[BACKEND] === INCOMING POST IMAGE UPLOAD ===");
    console.log("[BACKEND] Content-Type:", req.headers["content-type"]);
    console.log("[BACKEND] Content-Length:", req.headers["content-length"]);
    console.log("[BACKEND] Has Authorization:", !!req.headers["authorization"]);
    next();
  },
  authMiddleware,
  (req, res, next) => {
    console.log("[BACKEND] Passed AuthMiddleware, entering Multer upload...");
    next();
  },
  upload.array("images", 10),
  (req, res, next) => {
    console.log("[BACKEND] Multer parsed files. Number of files:", req.files ? req.files.length : 0);
    if (req.files) {
      req.files.forEach((f, idx) => {
        console.log(`[BACKEND]   File #${idx}: originalname=${f.originalname}, mimetype=${f.mimetype}, size=${f.size}`);
      });
    }
    next();
  },
  uploadMultipleImages,
);

module.exports = router;
