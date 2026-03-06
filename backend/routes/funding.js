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
 * POST /api/funding/preview-options
 * Preview available funding options without requiring account
 * Returns matched lenders based on application criteria (no actual submission)
 */
router.post("/preview-options", async (req, res) => {
  try {
    const {
      fundingAmount,
      fundingPurpose,
      annualTurnover,
      tradingYears,
      tradingMonths,
      homeowner,
    } = req.body;

    const LenderManager = require("../services/lenders/LenderManager");

    // Get all enabled lenders
    const enabledLenders = LenderManager.getEnabledLenders();

    // Calculate trading months for eligibility
    let totalTradingMonths = 0;
    if (tradingYears === "Yes") {
      totalTradingMonths = 36; // 3+ years
    } else if (tradingMonths) {
      totalTradingMonths = parseInt(tradingMonths);
    }

    // Build funding options based on application criteria
    const fundingOptions = enabledLenders.map(({ name, displayName }) => {
      // Basic eligibility scoring (can be expanded per lender)
      let eligibilityScore = 100;
      let eligibilityNotes = [];

      // Amount check (most lenders: £5k - £500k typical)
      const amount = parseFloat(fundingAmount) || 0;
      if (amount < 5000) {
        eligibilityScore -= 20;
        eligibilityNotes.push("Amount below typical minimum");
      } else if (amount > 500000) {
        eligibilityNotes.push(
          "Higher amounts may require additional documentation",
        );
      }

      // Trading history check (most lenders: 6+ months minimum)
      if (totalTradingMonths < 6) {
        eligibilityScore -= 30;
        eligibilityNotes.push("Most lenders require 6+ months trading");
      } else if (totalTradingMonths >= 24) {
        eligibilityScore += 10;
        eligibilityNotes.push("Strong trading history");
      }

      // Turnover check
      const turnover = parseFloat(annualTurnover) || 0;
      if (turnover < 50000) {
        eligibilityScore -= 15;
        eligibilityNotes.push("Low turnover may limit options");
      } else if (turnover >= 100000) {
        eligibilityScore += 10;
      }

      // Homeowner bonus
      if (homeowner === "Yes") {
        eligibilityScore += 5;
        eligibilityNotes.push("Homeowner status may improve terms");
      }

      // Cap score
      eligibilityScore = Math.min(100, Math.max(0, eligibilityScore));

      return {
        lender: name,
        displayName,
        eligibilityScore,
        eligibilityLevel:
          eligibilityScore >= 70
            ? "High"
            : eligibilityScore >= 40
              ? "Medium"
              : "Low",
        notes: eligibilityNotes,
        estimatedRates: {
          min: "0.9%",
          max: "3.5%",
          type: "monthly",
        },
        typicalTerms: {
          minTerm: "3 months",
          maxTerm: "24 months",
        },
        features: [
          "Fast approval (24-48 hours)",
          "No early repayment fees",
          "Flexible repayment options",
        ],
      };
    });

    // Sort by eligibility score
    fundingOptions.sort((a, b) => b.eligibilityScore - a.eligibilityScore);

    res.json({
      success: true,
      requiresAccount: true,
      message: "Create an account to submit your application to lenders",
      fundingOptions,
      applicationSummary: {
        fundingAmount,
        fundingPurpose,
        annualTurnover,
        tradingMonths: totalTradingMonths,
        homeowner,
      },
    });
  } catch (error) {
    console.error("Preview options error:", error);
    res.status(500).json({ error: "Failed to preview funding options" });
  }
});

/**
 * POST /api/funding/soft-inquiry
 * Submit a soft inquiry to lenders and get real responses
 * This creates actual leads with lenders but provides immediate feedback
 *
 * WARNING: This creates real leads in lender systems - use sparingly
 */
router.post("/soft-inquiry", async (req, res) => {
  try {
    const {
      // Business info
      businessName,
      companyName,
      companyNumber,

      // Contact info
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,

      // Address
      houseNumber,
      houseName,
      street,
      town,
      postcode,

      // Funding request
      fundingAmount,
      fundingPurpose,
      annualTurnover,
      tradingYears,
      tradingMonths,
      homeowner,

      // Optional: specific lender
      lenderKey,
    } = req.body;

    // Validate required fields
    if (!fundingAmount) {
      return res.status(400).json({
        success: false,
        error: "Funding amount is required",
      });
    }

    // Get user ID from auth token if present
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

    const LenderManager = require("../services/lenders/LenderManager");

    // Calculate trading months
    let totalTradingMonths = 0;
    if (tradingYears === "Yes") {
      totalTradingMonths = 36;
    } else if (tradingMonths) {
      totalTradingMonths = parseInt(tradingMonths);
    }

    // Build application data for lenders
    const applicationData = {
      businessName: businessName || companyName || "Not Provided",
      companyNumber: companyNumber || "",
      firstName: firstName || "Not Provided",
      lastName: lastName || "Not Provided",
      email: email,
      phone: phone,
      dateOfBirth: dateOfBirth || "",
      houseNumber: houseNumber || "",
      houseName: houseName || "",
      street: street || "",
      town: town || "",
      postcode: postcode || "",
      fundingAmount: parseFloat(fundingAmount),
      fundingPurpose: fundingPurpose || "Working Capital",
      annualTurnover: parseFloat(annualTurnover) || 0,
      tradingMonths: totalTradingMonths,
      homeowner: homeowner,
    };

    // Create or get funding application for database tracking
    let applicationId = null;
    if (userId) {
      try {
        // Check if user has a recent application (within last 24 hours)
        const [existingApps] = await db.query(
          `SELECT id FROM funding_applications 
           WHERE user_id = ? AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
           ORDER BY created_at DESC LIMIT 1`,
          [userId],
        );

        if (existingApps.length > 0) {
          applicationId = existingApps[0].id;
        } else {
          // Create new application
          const [result] = await db.query(
            `INSERT INTO funding_applications 
              (user_id, funding_amount, funding_purpose, annual_turnover, trading_years, trading_months, homeowner,
               contact_first_name, contact_last_name, contact_email, contact_phone, business_name, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted_to_lenders')`,
            [
              userId,
              fundingAmount,
              fundingPurpose || "Other",
              annualTurnover || null,
              tradingYears || null,
              totalTradingMonths || null,
              homeowner || null,
              firstName,
              lastName,
              email,
              phone,
              businessName || companyName || null,
            ],
          );
          applicationId = result.insertId;
        }
      } catch (dbErr) {
        console.error("Error creating application:", dbErr);
      }
    }

    let results;

    if (lenderKey) {
      // Submit to specific lender
      const result = await LenderManager.softInquiry(
        lenderKey,
        applicationData,
      );
      results = [result];
    } else {
      // Submit to all enabled lenders
      results = await LenderManager.softInquiryAll(applicationData);
    }

    // Save lender submissions to database
    if (applicationId) {
      for (const result of results) {
        try {
          const lenderName = result.lender || lenderKey || "unknown";
          const leadId =
            result.success && result.data ? result.data.leadId || null : null;

          await db.query(
            `INSERT INTO lender_submissions 
              (application_id, lender_name, lender_lead_id, status, response_data, error_message) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              applicationId,
              lenderName,
              leadId,
              result.success ? "submitted" : "error",
              result.success ? JSON.stringify(result.data || {}) : null,
              result.success ? null : result.error,
            ],
          );
        } catch (dbErr) {
          console.error(`Error saving ${result.lender} submission:`, dbErr);
        }
      }
    }

    // Separate successful and failed results
    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);

    // If all submissions failed, return error response
    if (successful.length === 0) {
      const errorMessages = failed.map((r) => r.error || "Unknown error");
      return res.status(400).json({
        success: false,
        error: errorMessages.join("; "),
        message: "Could not submit to any lenders at this time.",
        results: results,
        applicationId: applicationId,
        summary: {
          totalLenders: results.length,
          successful: 0,
          failed: failed.length,
        },
      });
    }

    res.json({
      success: true,
      message: `Submitted to ${successful.length} lender(s). Check your email for next steps.`,
      results: results,
      applicationId: applicationId,
      summary: {
        totalLenders: results.length,
        successful: successful.length,
        failed: failed.length,
      },
      applicationData: {
        fundingAmount,
        fundingPurpose,
        tradingMonths: totalTradingMonths,
      },
    });
  } catch (error) {
    console.error("\x1b[31m[SOFT INQUIRY ERROR]\x1b[0m", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to process soft inquiry",
      message: error.message,
    });
  }
});

/**
 * GET /api/funding/inquiry-status/:lenderKey/:leadId
 * Check the status of a previously submitted soft inquiry
 */
router.get("/inquiry-status/:lenderKey/:leadId", async (req, res) => {
  try {
    const { lenderKey, leadId } = req.params;
    const LenderManager = require("../services/lenders/LenderManager");

    const status = await LenderManager.checkInquiryStatus(lenderKey, leadId);

    res.json({
      success: true,
      ...status,
    });
  } catch (error) {
    console.error("\x1b[31m[INQUIRY STATUS ERROR]\x1b[0m", error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/funding/link-session
 * Link a guest session to the authenticated user
 * Used when user logs in after filling out form as guest
 */
router.post("/link-session", authMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: "Session ID is required" });
    }

    // Link unlinked applications from this session to the user
    const [result] = await db.query(
      `UPDATE funding_applications 
       SET user_id = ? 
       WHERE session_id = ? AND user_id IS NULL`,
      [req.userId, sessionId],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: "No pending applications found for this session",
      });
    }

    res.json({
      success: true,
      message: `Linked ${result.affectedRows} application(s) to your account`,
      linkedCount: result.affectedRows,
    });
  } catch (error) {
    console.error("Link session error:", error);
    res.status(500).json({ error: "Failed to link session" });
  }
});

/**
 * GET /api/funding/session/:sessionId
 * Get funding application by session ID (for guest users only)
 * Security: Only returns unlinked applications (user_id IS NULL)
 * Once linked to a user account, use /application/:id instead
 */
router.get("/session/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Validate session ID format (must be 32 char hex string)
    if (!sessionId || !/^[a-f0-9]{32}$/i.test(sessionId)) {
      return res.status(400).json({ error: "Invalid session ID format" });
    }

    // Only return applications that are NOT yet linked to a user account
    // This prevents accessing other users' data via session ID
    const [applications] = await db.query(
      `SELECT * FROM funding_applications WHERE session_id = ? AND user_id IS NULL ORDER BY created_at DESC LIMIT 1`,
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
 * Get all funding applications for the authenticated user with lender submissions
 */
router.get("/my-applications", authMiddleware, async (req, res) => {
  try {
    const [applications] = await db.query(
      `SELECT * FROM funding_applications WHERE user_id = ? ORDER BY created_at DESC`,
      [req.userId],
    );

    // Get lender submissions for all applications
    const applicationIds = applications.map((app) => app.id);
    let submissions = [];
    if (applicationIds.length > 0) {
      const [subs] = await db.query(
        `SELECT * FROM lender_submissions WHERE application_id IN (?) ORDER BY submitted_at DESC`,
        [applicationIds],
      );
      submissions = subs;
    }

    const formattedApplications = applications.map((app) => {
      const appSubmissions = submissions.filter(
        (s) => s.application_id === app.id,
      );
      return {
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
        lenderSubmissions: appSubmissions.map((s) => ({
          id: s.id,
          lender: s.lender_name,
          leadId: s.lender_lead_id,
          dealId: s.lender_deal_id,
          status: s.status,
          error: s.error_message,
          submittedAt: s.submitted_at,
          updatedAt: s.updated_at,
        })),
      };
    });

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
<<<<<<< HEAD
 * POST /api/funding/:id/submit-to-lenders
 * Submit an existing funding application to all enabled lenders
 * Automatically merges user account data with application data
 */
router.post("/:id/submit-to-lenders", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const LenderManager = require("../services/lenders/LenderManager");

    // 1. Get the funding application
    const [applications] = await db.query(
      `SELECT * FROM funding_applications WHERE id = ? AND user_id = ?`,
      [id, req.userId],
    );

    if (applications.length === 0) {
      return res.status(404).json({ error: "Application not found" });
    }

    const application = applications[0];

    // 2. Get user account data
    const [users] = await db.query(
      `SELECT id, email, first_name, last_name, business_type, business_name, phone 
       FROM users WHERE id = ?`,
      [req.userId],
    );

    if (users.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = users[0];

    // 3. Merge user data with application data (user data takes priority for contact info)
    const mergedData = {
      // Application data
      id: application.id,
      funding_amount: application.funding_amount,
      funding_purpose: application.funding_purpose,
      asset_type: application.asset_type,
      importance: application.importance,
      annual_turnover: application.annual_turnover,
      trading_years: application.trading_years,
      trading_months: application.trading_months,
      homeowner: application.homeowner,

      // User account data (preferred) or fallback to application contact info
      contact_first_name: user.first_name || application.contact_first_name,
      contact_last_name: user.last_name || application.contact_last_name,
      contact_email: user.email || application.contact_email,
      contact_phone: user.phone || application.contact_phone,
      business_name: user.business_name || application.business_name,
      business_type: user.business_type || application.business_type,
    };

    // 4. Submit to all enabled lenders
    const results = await LenderManager.submitToAllLenders(mergedData);

    // 5. Save submission results to database
    for (const [lenderName, result] of Object.entries(results)) {
      try {
        await db.query(
          `INSERT INTO lender_submissions 
            (application_id, lender_name, lender_lead_id, status, response_data, error_message) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            id,
            lenderName,
            result.success && result.data ? result.data.leadId || null : null,
            result.success ? "submitted" : "error",
            result.success ? JSON.stringify(result.data) : null,
            result.success ? null : result.error,
          ],
        );
      } catch (dbError) {
        console.error(
          `\x1b[31m[DB ERROR]\x1b[0m Failed to save ${lenderName} submission:`,
          dbError.message,
        );
      }
    }

    // 6. Update application status
    await db.query(
      `UPDATE funding_applications SET status = 'submitted_to_lenders', updated_at = NOW() WHERE id = ?`,
      [id],
    );

    res.json({
      success: true,
      message: "Application submitted to lenders",
      results,
    });
  } catch (error) {
    console.error("\x1b[31m[FUNDING ERROR]\x1b[0m Submit to lenders:", error);
    res.status(500).json({ error: "Failed to submit to lenders" });
  }
});

/**
 * GET /api/funding/:id/lender-status
 * Get submission status from all lenders for an application
 */
router.get("/:id/lender-status", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // Verify ownership
    const [applications] = await db.query(
      `SELECT * FROM funding_applications WHERE id = ? AND user_id = ?`,
      [id, req.userId],
    );

    if (applications.length === 0) {
      return res.status(404).json({ error: "Application not found" });
    }

    // Get all lender submissions for this application
    const [submissions] = await db.query(
      `SELECT lender_name, lender_lead_id, lender_deal_id, status, error_message, submitted_at, updated_at 
       FROM lender_submissions WHERE application_id = ?`,
      [id],
    );

    res.json({
      success: true,
      applicationId: id,
      applicationStatus: applications[0].status,
      lenderSubmissions: submissions.map((s) => ({
        lender: s.lender_name,
        leadId: s.lender_lead_id,
        dealId: s.lender_deal_id,
        status: s.status,
        error: s.error_message,
        submittedAt: s.submitted_at,
        updatedAt: s.updated_at,
      })),
    });
  } catch (error) {
    console.error("Get lender status error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
