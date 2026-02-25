const Preference = require("../models/preference.model");

exports.getUserPreferenceService = async (userId) => {
  let preference = await Preference.findOne({ user: userId });

  if (!preference) {
    // Define reasonable defaults if they don't have a preference yet
    preference = await Preference.create({
      user: userId,
      feedType: "latest",
      locations: [],
      skills: [],
    });
  }

  return preference;
};

exports.updateUserPreferenceService = async (userId, data) => {
  const updateFields = {};

  if (data.feedType) updateFields.feedType = data.feedType;
  if (data.locations) updateFields.locations = data.locations;
  if (data.skills) updateFields.skills = data.skills;

  const preference = await Preference.findOneAndUpdate(
    { user: userId },
    { $set: updateFields },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

  return preference;
};
