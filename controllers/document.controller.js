const Document = require("../models/document.model");

exports.createDocument = async (req, res, next) => {
  try {
    const { templateType, designStyle, ...formData } = req.body;
    const userId = req.user.id; // from auth middleware

    if (!templateType) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide templateType" });
    }

    // Save in Database
    const newDoc = await Document.create({
      user: userId,
      templateType,
      designStyle: designStyle || "classic",
      formData,
    });

    res.status(201).json({
      success: true,
      data: newDoc,
    });
  } catch (error) {
    next(error);
  }
};

exports.getDocuments = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const documents = await Document.find({ user: userId }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: documents.length,
      data: documents,
    });
  } catch (error) {
    next(error);
  }
};

exports.getDocumentById = async (req, res, next) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!document) {
      return res
        .status(404)
        .json({ success: false, message: "Document not found" });
    }

    res.status(200).json({
      success: true,
      data: document,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteDocument = async (req, res, next) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!document) {
      return res
        .status(404)
        .json({ success: false, message: "Document not found" });
    }

    await document.deleteOne();

    res.status(200).json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
