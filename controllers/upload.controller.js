exports.uploadSingleImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    res.status(200).json({
      success: true,
      url: req.file.path,
    });
  } catch (err) {
    next(err);
  }
};

exports.uploadMultipleImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No images uploaded or wrong field name used",
      });
    }

    const urls = req.files.map((file) => file.path);

    res.status(200).json({
      success: true,
      urls,
    });
  } catch (err) {
    next(err);
  }
};
