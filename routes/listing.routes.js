const express = require("express");
const {
  createListing,
  getListings,
  getSingleListing,
  getUserListings,
  deleteListing,
} = require("../controllers/listing.controller");

const authMiddleware = require("../middlewares/auth.middleware");
const optionalAuth = require("../middlewares/optionalAuth.middleware");

const router = express.Router();

router.route("/").get(getListings).post(authMiddleware, createListing);

router
  .route("/:id")
  .get(getSingleListing)
  .delete(authMiddleware, deleteListing);

router.route("/user/:userId").get(optionalAuth, getUserListings);

module.exports = router;
