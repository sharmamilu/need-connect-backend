const express = require("express");
const {
  createListing,
  getListings,
  getSingleListing,
} = require("../controllers/listing.controller");

const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

router.route("/").get(getListings).post(authMiddleware, createListing);

router.route("/:id").get(getSingleListing);

module.exports = router;
