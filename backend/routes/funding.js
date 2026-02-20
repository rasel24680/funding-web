const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const db = require("../config/db");
const authMiddleware = require("../middleware/auth");
const { optionalAuth } = require("../middleware/auth");
const crypto = require("crypto");

// Validation rules for funding application
const fundingValidation = [
  body("fundingAmount")
    .isFloat({ min: 1000, max: 5000000 })
    .withMessage("Funding amount must be between £1,000 and £5,000,000"),
  body("fundingPurpose")
    .isIn(["Growth", "Cashflow", "Refinancing", "Asset Finance", "Other"])
    .withMessage("Invalid funding purpose"),
  body("importance")
    .optional()
    .isIn([
      "Fast approval",
      "Low cost",
      "Personalised support",
      "Low credit options",
    ]),
  body("annualTurnover").optional().isFloat({ min: 0 }),
  body("tradingYears").optional().isIn(["Yes", "No"]),
  body("homeowner").optional().isIn(["Yes", "No"]),
];

/**
 * POST /api/funding/submit
 * Submit a new funding application
 * Can be submitted by guest (sessionId) or authenticated user
 */
router.post("/submit", fundingValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      fundingAmount,
      fundingPurpose,
      assetType,
      importance,
      annualTurnover,
      tradingYears,
      tradingMonths,
      homeowner,
      // Contact info from form
      firstName,
      lastName,
      email,
      phone,
      businessType,
      businessName,
      // Session ID for guest users
      sessionId,
    } = req.body;

    // Check if user is authenticated
    let userId = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const jwt = require("jsonwebtoken");
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.userId;
      } catch (e) {
        // Not authenticated, continue as guest
      }
    }

    // Generate session ID if not provided
    const guestSessionId = sessionId || crypto.randomBytes(16).toString("hex");

    // Insert funding application
    const [result] = await db.query(
      `INSERT INTO funding_applications 
        (user_id, session_id, funding_amount, funding_purpose, asset_type, 
         importance, annual_turnover, trading_years, trading_months, homeowner,
         contact_first_name, contact_last_name, contact_email, contact_phone,
         business_type, business_name, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        userId,
        guestSessionId,
        fundingAmount,
        fundingPurpose,
        assetType || null,
        importance || null,
        annualTurnover || null,
        tradingYears || null,
        tradingMonths || null,
        homeowner || null,
        firstName || null,
        lastName || null,
        email || null,
        phone || null,
        businessType || null,
        businessName || null,
      ],
    );

    res.status(201).json({
      success: true,
      message: "Funding application submitted successfully",
      applicationId: result.insertId,
      sessionId: guestSessionId,
    });
  } catch (error) {
    console.error("Funding submit error:", error);
    res.status(500).json({ error: "Server error during submission" });
  }
});

/**
 * GET /api/funding/session/:sessionId
 * Get funding application by session ID (for guest users)
 */
router.get("/session/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;

    const [applications] = await db.query(
      `SELECT * FROM funding_applications WHERE session_id = ? ORDER BY created_at DESC LIMIT 1`,
      [sessionId],
    );

    if (applications.length === 0) {
      return res.status(404).json({ error: "Application not found" });
    }

    const app = applications[0];
    res.json({
      success: true,
      application: {
        id: app.id,
        fundingAmount: app.funding_amount,
        fundingPurpose: app.funding_purpose,
        assetType: app.asset_type,
        importance: app.importance,
        annualTurnover: app.annual_turnover,
        tradingYears: app.trading_years,
        tradingMonths: app.trading_months,
        homeowner: app.homeowner,
        contactFirstName: app.contact_first_name,
        contactLastName: app.contact_last_name,
        contactEmail: app.contact_email,
        contactPhone: app.contact_phone,
        businessType: app.business_type,
        businessName: app.business_name,
        status: app.status,
        createdAt: app.created_at,
      },
    });
  } catch (error) {
    console.error("Get session application error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * POST /api/funding/link
 * Link a guest application to authenticated user
 */
router.post("/link", authMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: "Session ID required" });
    }

    // Update application to link to user
    const [result] = await db.query(
      `UPDATE funding_applications SET user_id = ? WHERE session_id = ? AND user_id IS NULL`,
      [req.userId, sessionId],
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ error: "No unlinked application found for this session" });
    }

    res.json({
      success: true,
      message: "Application linked to your account",
    });
  } catch (error) {
    console.error("Link application error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * GET /api/funding/my-applications
 * Get all funding applications for the authenticated user
 */
router.get("/my-applications", authMiddleware, async (req, res) => {
  try {
    const [applications] = await db.query(
      `SELECT * FROM funding_applications WHERE user_id = ? ORDER BY created_at DESC`,
      [req.userId],
    );

    const formattedApplications = applications.map((app) => ({
      id: app.id,
      fundingAmount: app.funding_amount,
      fundingPurpose: app.funding_purpose,
      assetType: app.asset_type,
      importance: app.importance,
      annualTurnover: app.annual_turnover,
      tradingYears: app.trading_years,
      tradingMonths: app.trading_months,
      homeowner: app.homeowner,
      businessType: app.business_type,
      businessName: app.business_name,
      status: app.status,
      createdAt: app.created_at,
      updatedAt: app.updated_at,
    }));

    res.json({
      success: true,
      count: formattedApplications.length,
      applications: formattedApplications,
    });
  } catch (error) {
    console.error("Get applications error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * GET /api/funding/application/:id
 * Get a specific funding application
 */
router.get("/application/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const [applications] = await db.query(
      `SELECT * FROM funding_applications WHERE id = ? AND user_id = ?`,
      [id, req.userId],
    );

    if (applications.length === 0) {
      return res.status(404).json({ error: "Application not found" });
    }

    const app = applications[0];
    res.json({
      success: true,
      application: {
        id: app.id,
        fundingAmount: app.funding_amount,
        fundingPurpose: app.funding_purpose,
        assetType: app.asset_type,
        importance: app.importance,
        annualTurnover: app.annual_turnover,
        tradingYears: app.trading_years,
        tradingMonths: app.trading_months,
        homeowner: app.homeowner,
        businessType: app.business_type,
        businessName: app.business_name,
        status: app.status,
        adminNotes: app.admin_notes,
        createdAt: app.created_at,
        updatedAt: app.updated_at,
      },
    });
  } catch (error) {
    console.error("Get application error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * PUT /api/funding/application/:id
 * Update an existing funding application
 */
router.put("/application/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if application belongs to user
    const [existing] = await db.query(
      `SELECT * FROM funding_applications WHERE id = ? AND user_id = ?`,
      [id, req.userId],
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: "Application not found" });
    }

    // Don't allow editing if not pending
    if (existing[0].status !== "pending") {
      return res
        .status(400)
        .json({ error: "Cannot edit application that is being processed" });
    }

    const {
      fundingAmount,
      fundingPurpose,
      assetType,
      importance,
      annualTurnover,
      tradingYears,
      tradingMonths,
      homeowner,
    } = req.body;

    const updates = [];
    const values = [];

    if (fundingAmount !== undefined) {
      updates.push("funding_amount = ?");
      values.push(fundingAmount);
    }
    if (fundingPurpose !== undefined) {
      updates.push("funding_purpose = ?");
      values.push(fundingPurpose);
    }
    if (assetType !== undefined) {
      updates.push("asset_type = ?");
      values.push(assetType);
    }
    if (importance !== undefined) {
      updates.push("importance = ?");
      values.push(importance);
    }
    if (annualTurnover !== undefined) {
      updates.push("annual_turnover = ?");
      values.push(annualTurnover);
    }
    if (tradingYears !== undefined) {
      updates.push("trading_years = ?");
      values.push(tradingYears);
    }
    if (tradingMonths !== undefined) {
      updates.push("trading_months = ?");
      values.push(tradingMonths);
    }
    if (homeowner !== undefined) {
      updates.push("homeowner = ?");
      values.push(homeowner);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    values.push(id);
    await db.query(
      `UPDATE funding_applications SET ${updates.join(", ")} WHERE id = ?`,
      values,
    );

    res.json({
      success: true,
      message: "Application updated successfully",
    });
  } catch (error) {
    console.error("Update application error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * DELETE /api/funding/application/:id
 * Delete a funding application
 */
router.delete("/application/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query(
      `DELETE FROM funding_applications WHERE id = ? AND user_id = ? AND status = 'pending'`,
      [id, req.userId],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: "Application not found or cannot be deleted",
      });
    }

    res.json({
      success: true,
      message: "Application deleted successfully",
    });
  } catch (error) {
    console.error("Delete application error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * POST /api/funding/get-matches
 * Get matching funders based on funding application criteria
 * Can be called by guest (sessionId) or authenticated user
 */
router.post("/get-matches", optionalAuth, async (req, res) => {
  try {
    const {
      fundingAmount,
      fundingPurpose,
      homeowner,
      tradingYears,
      acceptsImpairedCredit,
      sessionId,
      applicationId,
    } = req.body;

    // Validate required fields
    if (!fundingAmount) {
      return res.status(400).json({ error: "Funding amount required" });
    }

    // Build matching criteria
    let query = `SELECT * FROM funders WHERE is_active = TRUE 
                 AND min_amount <= ? AND max_amount >= ?`;
    let params = [fundingAmount, fundingAmount];

    // Apply optional filters
    if (fundingPurpose) {
      query += ` AND JSON_CONTAINS(funding_purposes, JSON_QUOTE(?))`;
      params.push(fundingPurpose);
    }

    if (homeowner === "Yes") {
      // Funders that accept or don't require homeowner are both fine
      // We only filter if homeowner = "No" and they require it
    } else if (homeowner === "No") {
      query += ` AND requires_homeowner = FALSE`;
    }

    if (tradingYears === "No") {
      query += ` AND min_trading_years <= 1`;
    } else if (tradingYears === "Yes") {
      // No filtering - they have 3+ years
    }

    if (acceptsImpairedCredit) {
      query += ` AND accepts_impaired_credit = TRUE`;
    }

    const [funders] = await db.query(query, params);

    // Format response
    const matchedFunders = funders.map((f) => ({
      id: f.id,
      name: f.name,
      logoUrl: f.logo_url,
      baseRate: f.base_rate,
      approvalSpeed: f.approval_speed,
      keyFeature: f.key_feature,
      description: f.description,
      minAmount: f.min_amount,
      maxAmount: f.max_amount,
      acceptsImpairedCredit: f.accepts_impaired_credit,
      contactEmail: f.contact_email,
      website: f.website,
    }));

    res.json({
      success: true,
      count: matchedFunders.length,
      funders: matchedFunders,
    });
  } catch (error) {
    console.error("Get matches error:", error);
    res.status(500).json({ error: "Server error getting matches" });
  }
});

module.exports = router;
