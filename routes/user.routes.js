const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const {
  getPreferences,
  updatePreferences,
} = require("../controllers/preference.controller");

const router = express.Router();

// Preferences
router.get("/preferences", authMiddleware, getPreferences);
router.post("/preferences", authMiddleware, updatePreferences);
router.put("/preferences", authMiddleware, updatePreferences); // Supporting both for client convenience

router.get("/me", authMiddleware, (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});

module.exports = router;
