const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const {
  createDocument,
  getDocuments,
  getDocumentById,
  deleteDocument,
} = require("../controllers/document.controller");

const router = express.Router();

router.post("/", authMiddleware, createDocument);
router.get("/", authMiddleware, getDocuments);
router.get("/:id", authMiddleware, getDocumentById);
router.delete("/:id", authMiddleware, deleteDocument);

module.exports = router;
