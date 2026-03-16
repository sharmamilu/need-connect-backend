const express = require("express");
const {
  getPendingPosts,
  getPendingListings,
  updatePostStatus,
  updateListingStatus,
} = require("../controllers/admin.controller");

const authMiddleware = require("../middlewares/auth.middleware");
const { requireAdmin } = require("../middlewares/admin.middleware");

const router = express.Router();

// All routes require authentication AND admin privileges
router.use(authMiddleware);
router.use(requireAdmin);

// Dashboard listing endpoints
router.get("/posts", getPendingPosts);
router.get("/listings", getPendingListings);

// Approve endpoints
router.patch("/posts/:id/approve", (req, res, next) => {
  req.body = req.body || {};
  req.body.status = "Active"; // Automatically set status for approval
  updatePostStatus(req, res, next);
});

router.patch("/listings/:id/approve", (req, res, next) => {
  req.body = req.body || {};
  req.body.status = "Active";
  updateListingStatus(req, res, next);
});

// Reject endpoints
router.patch("/posts/:id/reject", (req, res, next) => {
  req.body = req.body || {};
  req.body.status = "Rejected"; // Needs rejectionReason in req.body
  updatePostStatus(req, res, next);
});

router.patch("/listings/:id/reject", (req, res, next) => {
  req.body = req.body || {};
  req.body.status = "Rejected"; // Needs rejectionReason in req.body
  updateListingStatus(req, res, next);
});

module.exports = router;
