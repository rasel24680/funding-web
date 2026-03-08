const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const db = require("../config/db");
const authMiddleware = require("../middleware/auth");

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "../uploads/documents");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Create user-specific folder
    const userDir = path.join(uploadsDir, `user_${req.userId}`);
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    cb(null, userDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${req.body.category || "doc"}-${uniqueSuffix}${ext}`);
  },
});

// File filter for allowed types
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/csv",
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error("Invalid file type. Allowed: PDF, images, Word, Excel, CSV"),
      false,
    );
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
});

/**
 * POST /api/documents/upload
 * Upload a document
 */
router.post(
  "/upload",
  authMiddleware,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const { category } = req.body;
      const validCategories = [
        "bank-statements",
        "financial-accounts",
        "applicant-info",
      ];

      if (!category || !validCategories.includes(category)) {
        // Delete uploaded file if category is invalid
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: "Invalid document category" });
      }

      // Save document info to database
      const [result] = await db.query(
        `INSERT INTO user_documents (user_id, category, original_name, file_name, file_path, file_size, mime_type)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          req.userId,
          category,
          req.file.originalname,
          req.file.filename,
          req.file.path,
          req.file.size,
          req.file.mimetype,
        ],
      );

      res.status(201).json({
        success: true,
        document: {
          id: result.insertId,
          name: req.file.originalname,
          category: category,
          size: req.file.size,
          uploadedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("Document upload error:", error);
      // Clean up uploaded file on error
      if (req.file && req.file.path) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (e) {}
      }
      res.status(500).json({ error: "Failed to upload document" });
    }
  },
);

/**
 * GET /api/documents
 * Get all documents for the logged-in user
 */
router.get("/", authMiddleware, async (req, res) => {
  try {
    const [documents] = await db.query(
      `SELECT id, category, original_name, file_size, mime_type, created_at
       FROM user_documents 
       WHERE user_id = ? 
       ORDER BY category, created_at DESC`,
      [req.userId],
    );

    // Group documents by category
    const grouped = {
      "bank-statements": [],
      "financial-accounts": [],
      "applicant-info": [],
    };

    documents.forEach((doc) => {
      if (grouped[doc.category]) {
        grouped[doc.category].push({
          id: doc.id,
          name: doc.original_name,
          size: doc.file_size,
          type: doc.mime_type,
          date: new Date(doc.created_at).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
        });
      }
    });

    res.json({ documents: grouped });
  } catch (error) {
    console.error("Error fetching documents:", error);
    res.status(500).json({ error: "Failed to fetch documents" });
  }
});

/**
 * GET /api/documents/download/:id
 * Download a specific document
 */
router.get("/download/:id", authMiddleware, async (req, res) => {
  try {
    const [documents] = await db.query(
      `SELECT * FROM user_documents WHERE id = ? AND user_id = ?`,
      [req.params.id, req.userId],
    );

    if (documents.length === 0) {
      return res.status(404).json({ error: "Document not found" });
    }

    const doc = documents[0];

    // Check if file exists
    if (!fs.existsSync(doc.file_path)) {
      return res.status(404).json({ error: "File not found on server" });
    }

    res.download(doc.file_path, doc.original_name);
  } catch (error) {
    console.error("Error downloading document:", error);
    res.status(500).json({ error: "Failed to download document" });
  }
});

/**
 * DELETE /api/documents/:id
 * Delete a document
 */
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const [documents] = await db.query(
      `SELECT * FROM user_documents WHERE id = ? AND user_id = ?`,
      [req.params.id, req.userId],
    );

    if (documents.length === 0) {
      return res.status(404).json({ error: "Document not found" });
    }

    const doc = documents[0];

    // Delete file from disk
    if (fs.existsSync(doc.file_path)) {
      fs.unlinkSync(doc.file_path);
    }

    // Delete from database
    await db.query("DELETE FROM user_documents WHERE id = ?", [req.params.id]);

    res.json({ success: true, message: "Document deleted" });
  } catch (error) {
    console.error("Error deleting document:", error);
    res.status(500).json({ error: "Failed to delete document" });
  }
});

/**
 * GET /api/documents/admin/all
 * Admin: Get all documents from all users
 */
router.get("/admin/all", authMiddleware, async (req, res) => {
  try {
    // Check if user is admin
    const [users] = await db.query("SELECT role FROM users WHERE id = ?", [
      req.userId,
    ]);
    if (users.length === 0 || users[0].role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const [documents] = await db.query(
      `SELECT d.*, u.email as user_email, u.first_name, u.last_name, u.business_name
       FROM user_documents d
       JOIN users u ON d.user_id = u.id
       ORDER BY d.created_at DESC`,
    );

    res.json({ documents });
  } catch (error) {
    console.error("Error fetching admin documents:", error);
    res.status(500).json({ error: "Failed to fetch documents" });
  }
});

/**
 * GET /api/documents/admin/download/:id
 * Admin: Download any document
 */
router.get("/admin/download/:id", authMiddleware, async (req, res) => {
  try {
    // Check if user is admin
    const [users] = await db.query("SELECT role FROM users WHERE id = ?", [
      req.userId,
    ]);
    if (users.length === 0 || users[0].role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const [documents] = await db.query(
      `SELECT * FROM user_documents WHERE id = ?`,
      [req.params.id],
    );

    if (documents.length === 0) {
      return res.status(404).json({ error: "Document not found" });
    }

    const doc = documents[0];

    if (!fs.existsSync(doc.file_path)) {
      return res.status(404).json({ error: "File not found on server" });
    }

    res.download(doc.file_path, doc.original_name);
  } catch (error) {
    console.error("Error downloading document:", error);
    res.status(500).json({ error: "Failed to download document" });
  }
});

module.exports = router;
