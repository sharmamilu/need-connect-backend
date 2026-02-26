const asyncHandler = require("express-async-handler");
const {
  getUserPreferenceService,
  updateUserPreferenceService,
} = require("../services/preference.service");

exports.getPreferences = asyncHandler(async (req, res) => {
  const preference = await getUserPreferenceService(req.user.id);

  res.status(200).json({
    success: true,
    data: preference,
  });
});

exports.updatePreferences = asyncHandler(async (req, res) => {
  const preference = await updateUserPreferenceService(req.user.id, req.body);

  res.status(200).json({
    success: true,
    message: "Preferences updated successfully",
    data: preference,
  });
});
