const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

// =============================================
// Super Admin Middleware
// =============================================
function superAdminAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ error: "Access denied. No token provided." });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.isSuperAdmin) {
      return res.status(403).json({ error: "Super admin access required." });
    }

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ error: "Session expired. Please login again." });
    }
    return res.status(401).json({ error: "Invalid token." });
  }
}

// =============================================
// POST /api/superadmin/login
// Authenticate with super admin password
// =============================================
router.post("/login", async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: "Password is required" });
    }

    const superAdminHash = process.env.SUPERADMIN_PASSWORD_HASH;

    if (!superAdminHash) {
      return res.status(503).json({ error: "Super admin not configured" });
    }

    const isValid = await bcrypt.compare(password, superAdminHash);

    if (!isValid) {
      return res.status(401).json({ error: "Invalid password" });
    }

    // Generate JWT with superAdmin flag (24h expiry)
    const token = jwt.sign({ isSuperAdmin: true }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    res.json({
      success: true,
      token,
      message: "Super admin authenticated",
    });
  } catch (error) {
    console.error("Super admin login error:", error);
    res.status(500).json({ error: "Authentication failed" });
  }
});

// =============================================
// GET /api/superadmin/stats
// Overall referral statistics
// =============================================
router.get("/stats", superAdminAuth, async (req, res) => {
  try {
    const [totalStats] = await db.query(`
      SELECT 
        COUNT(*) as total_referrals,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'qualified' THEN 1 ELSE 0 END) as qualified,
        SUM(CASE WHEN status = 'rewarded' THEN 1 ELSE 0 END) as rewarded,
        SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) as expired,
        SUM(CASE WHEN status = 'rewarded' THEN reward_amount ELSE 0 END) as total_paid,
        SUM(CASE WHEN status IN ('pending', 'qualified') THEN reward_amount ELSE 0 END) as pending_payout
      FROM referrals
    `);

    const [topReferrers] = await db.query(`
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.business_name,
        COUNT(r.id) as total_referrals,
        SUM(CASE WHEN r.status = 'rewarded' THEN r.reward_amount ELSE 0 END) as total_earned
      FROM users u
      JOIN referrals r ON u.id = r.referrer_id
      GROUP BY u.id
      ORDER BY total_referrals DESC
      LIMIT 10
    `);

    const [monthlyStats] = await db.query(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as count,
        SUM(CASE WHEN status = 'rewarded' THEN reward_amount ELSE 0 END) as rewards_paid
      FROM referrals
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month DESC
    `);

    const [totalUsers] = await db.query(
      `SELECT COUNT(*) as count FROM users WHERE is_active = TRUE`,
    );

    res.json({
      success: true,
      stats: {
        totalReferrals: totalStats[0].total_referrals || 0,
        pending: totalStats[0].pending || 0,
        qualified: totalStats[0].qualified || 0,
        rewarded: totalStats[0].rewarded || 0,
        expired: totalStats[0].expired || 0,
        totalPaid: parseFloat(totalStats[0].total_paid) || 0,
        pendingPayout: parseFloat(totalStats[0].pending_payout) || 0,
        totalUsers: totalUsers[0].count || 0,
      },
      topReferrers: topReferrers.map((r) => ({
        id: r.id,
        name: `${r.first_name} ${r.last_name}`,
        email: r.email,
        businessName: r.business_name,
        totalReferrals: r.total_referrals,
        totalEarned: parseFloat(r.total_earned) || 0,
      })),
      monthlyStats,
    });
  } catch (error) {
    console.error("Super admin stats error:", error);
    res.status(500).json({ error: "Failed to get stats" });
  }
});

// =============================================
// GET /api/superadmin/referrals
// All referrals with full user details
// =============================================
router.get("/referrals", superAdminAuth, async (req, res) => {
  try {
    const { status, search, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = "WHERE 1=1";
    const params = [];

    if (status && status !== "all") {
      whereClause += " AND r.status = ?";
      params.push(status);
    }

    if (search) {
      whereClause += ` AND (
        referrer.email LIKE ? OR referred.email LIKE ? OR
        referrer.first_name LIKE ? OR referred.first_name LIKE ? OR
        referrer.business_name LIKE ? OR referred.business_name LIKE ? OR
        r.referral_code LIKE ?
      )`;
      const searchParam = `%${search}%`;
      params.push(
        searchParam,
        searchParam,
        searchParam,
        searchParam,
        searchParam,
        searchParam,
        searchParam,
      );
    }

    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM referrals r
       JOIN users referrer ON r.referrer_id = referrer.id
       JOIN users referred ON r.referred_id = referred.id
       ${whereClause}`,
      params,
    );

    const [referrals] = await db.query(
      `SELECT 
        r.id,
        r.referral_code,
        r.status,
        r.reward_amount,
        r.reward_type,
        r.qualification_type,
        r.paypal_email,
        r.qualified_at,
        r.rewarded_at,
        r.notes,
        r.created_at,
        r.updated_at,
        referrer.id as referrer_id,
        referrer.first_name as referrer_first_name,
        referrer.last_name as referrer_last_name,
        referrer.email as referrer_email,
        referrer.business_name as referrer_business,
        referrer.phone as referrer_phone,
        referrer.created_at as referrer_joined,
        referred.id as referred_id,
        referred.first_name as referred_first_name,
        referred.last_name as referred_last_name,
        referred.email as referred_email,
        referred.business_name as referred_business,
        referred.phone as referred_phone,
        referred.phone_verified as referred_phone_verified,
        referred.created_at as referred_joined,
        (SELECT COUNT(*) FROM funding_applications fa WHERE fa.user_id = referred.id) as referred_applications,
        (SELECT COUNT(*) FROM funding_applications fa WHERE fa.user_id = referrer.id) as referrer_applications
       FROM referrals r
       JOIN users referrer ON r.referrer_id = referrer.id
       JOIN users referred ON r.referred_id = referred.id
       ${whereClause}
       ORDER BY 
         CASE r.status 
           WHEN 'pending' THEN 1 
           WHEN 'qualified' THEN 2 
           WHEN 'rewarded' THEN 3 
           WHEN 'expired' THEN 4 
         END,
         r.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)],
    );

    res.json({
      success: true,
      referrals: referrals.map((r) => ({
        id: r.id,
        referralCode: r.referral_code,
        status: r.status,
        rewardAmount: parseFloat(r.reward_amount) || 0,
        rewardType: r.reward_type,
        qualificationType: r.qualification_type,
        paypalEmail: r.paypal_email || null,
        qualifiedAt: r.qualified_at,
        rewardedAt: r.rewarded_at,
        notes: r.notes,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        referrer: {
          id: r.referrer_id,
          name: `${r.referrer_first_name} ${r.referrer_last_name}`,
          email: r.referrer_email,
          businessName: r.referrer_business,
          phone: r.referrer_phone,
          joinedAt: r.referrer_joined,
          applicationCount: r.referrer_applications,
        },
        referred: {
          id: r.referred_id,
          name: `${r.referred_first_name} ${r.referred_last_name}`,
          email: r.referred_email,
          businessName: r.referred_business,
          phone: r.referred_phone,
          phoneVerified: !!r.referred_phone_verified,
          joinedAt: r.referred_joined,
          applicationCount: r.referred_applications,
        },
      })),
      pagination: {
        total: countResult[0].total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(countResult[0].total / limit),
      },
    });
  } catch (error) {
    console.error("Get superadmin referrals error:", error);
    res.status(500).json({ error: "Failed to get referrals" });
  }
});

// =============================================
// GET /api/superadmin/referral/:id
// Get single referral detail
// =============================================
router.get("/referral/:id", superAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const [referrals] = await db.query(
      `SELECT 
        r.*,
        referrer.first_name as referrer_first_name,
        referrer.last_name as referrer_last_name,
        referrer.email as referrer_email,
        referrer.business_name as referrer_business,
        referrer.phone as referrer_phone,
        referrer.created_at as referrer_joined,
        referred.first_name as referred_first_name,
        referred.last_name as referred_last_name,
        referred.email as referred_email,
        referred.business_name as referred_business,
        referred.phone as referred_phone,
        referred.phone_verified as referred_phone_verified,
        referred.created_at as referred_joined
       FROM referrals r
       JOIN users referrer ON r.referrer_id = referrer.id
       JOIN users referred ON r.referred_id = referred.id
       WHERE r.id = ?`,
      [id],
    );

    if (referrals.length === 0) {
      return res.status(404).json({ error: "Referral not found" });
    }

    const r = referrals[0];

    // Get reward records for this referral
    const [rewards] = await db.query(
      `SELECT * FROM referral_rewards WHERE referral_id = ? ORDER BY created_at DESC`,
      [id],
    );

    // Get referred user's applications
    const [applications] = await db.query(
      `SELECT id, funding_amount, funding_purpose, status, created_at 
       FROM funding_applications 
       WHERE user_id = ? 
       ORDER BY created_at DESC`,
      [r.referred_id],
    );

    // Get referred user's bank statements
    const [bankStatements] = await db.query(
      `SELECT id, original_name, file_size, mime_type, created_at
       FROM user_documents
       WHERE user_id = ? AND category = 'bank-statements'
       ORDER BY created_at DESC`,
      [r.referred_id],
    );

    res.json({
      success: true,
      referral: {
        id: r.id,
        referralCode: r.referral_code,
        status: r.status,
        rewardAmount: parseFloat(r.reward_amount) || 0,
        rewardType: r.reward_type,
        qualificationType: r.qualification_type,
        paypalEmail: r.paypal_email || null,
        qualifiedAt: r.qualified_at,
        rewardedAt: r.rewarded_at,
        notes: r.notes,
        createdAt: r.created_at,
        referrer: {
          name: `${r.referrer_first_name} ${r.referrer_last_name}`,
          email: r.referrer_email,
          businessName: r.referrer_business,
          phone: r.referrer_phone,
          joinedAt: r.referrer_joined,
        },
        referred: {
          name: `${r.referred_first_name} ${r.referred_last_name}`,
          email: r.referred_email,
          businessName: r.referred_business,
          phone: r.referred_phone,
          phoneVerified: !!r.referred_phone_verified,
          joinedAt: r.referred_joined,
          applications,
          bankStatements: bankStatements.map((bs) => ({
            id: bs.id,
            name: bs.original_name,
            size: bs.file_size,
            type: bs.mime_type,
            uploadedAt: bs.created_at,
          })),
        },
        rewards,
      },
    });
  } catch (error) {
    console.error("Get referral detail error:", error);
    res.status(500).json({ error: "Failed to get referral details" });
  }
});

// =============================================
// POST /api/superadmin/qualify/:id
// Mark referral as qualified
// =============================================
router.post("/qualify/:id", superAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const [referrals] = await db.query("SELECT * FROM referrals WHERE id = ?", [
      id,
    ]);

    if (referrals.length === 0) {
      return res.status(404).json({ error: "Referral not found" });
    }

    if (referrals[0].status !== "pending") {
      return res.status(400).json({
        error: `Cannot qualify referral with status: ${referrals[0].status}`,
      });
    }

    await db.query(
      `UPDATE referrals SET status = 'qualified', qualified_at = NOW(), notes = CONCAT(IFNULL(notes, ''), ?) WHERE id = ?`,
      [notes ? `\nQualified: ${notes}` : "\nQualified by super admin", id],
    );

    res.json({ success: true, message: "Referral marked as qualified" });
  } catch (error) {
    console.error("Qualify referral error:", error);
    res.status(500).json({ error: "Failed to qualify referral" });
  }
});

// =============================================
// POST /api/superadmin/reward/:id
// Process reward for qualified referral
// =============================================
router.post("/reward/:id", superAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { voucherCode, rewardType, rewardAmount, notes } = req.body;

    const [referrals] = await db.query("SELECT * FROM referrals WHERE id = ?", [
      id,
    ]);

    if (referrals.length === 0) {
      return res.status(404).json({ error: "Referral not found" });
    }

    if (referrals[0].status !== "qualified") {
      return res.status(400).json({
        error: `Cannot reward referral with status: ${referrals[0].status}`,
      });
    }

    const referral = referrals[0];
    const finalRewardType = rewardType || referral.reward_type;
    const finalRewardAmount = rewardAmount || referral.reward_amount;

    // Update reward amount/type if changed
    if (rewardType || rewardAmount) {
      await db.query(
        `UPDATE referrals SET reward_type = ?, reward_amount = ? WHERE id = ?`,
        [finalRewardType, finalRewardAmount, id],
      );
    }

    // Create reward record
    await db.query(
      `INSERT INTO referral_rewards 
       (referral_id, user_id, reward_type, reward_amount, voucher_code, status, sent_at, expires_at)
       VALUES (?, ?, ?, ?, ?, 'sent', NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR))`,
      [
        id,
        referral.referrer_id,
        finalRewardType,
        finalRewardAmount,
        voucherCode || null,
      ],
    );

    // Update referral status
    await db.query(
      `UPDATE referrals SET status = 'rewarded', rewarded_at = NOW(), notes = CONCAT(IFNULL(notes, ''), ?) WHERE id = ?`,
      [notes ? `\nRewarded: ${notes}` : "\nRewarded by super admin", id],
    );

    res.json({ success: true, message: "Reward processed successfully" });
  } catch (error) {
    console.error("Process reward error:", error);
    res.status(500).json({ error: "Failed to process reward" });
  }
});

// =============================================
// POST /api/superadmin/expire/:id
// Expire a referral
// =============================================
router.post("/expire/:id", superAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const [referrals] = await db.query("SELECT * FROM referrals WHERE id = ?", [
      id,
    ]);

    if (referrals.length === 0) {
      return res.status(404).json({ error: "Referral not found" });
    }

    if (referrals[0].status === "rewarded") {
      return res
        .status(400)
        .json({ error: "Cannot expire an already rewarded referral" });
    }

    await db.query(
      `UPDATE referrals SET status = 'expired', notes = CONCAT(IFNULL(notes, ''), ?) WHERE id = ?`,
      [notes ? `\nExpired: ${notes}` : "\nExpired by super admin", id],
    );

    res.json({ success: true, message: "Referral marked as expired" });
  } catch (error) {
    console.error("Expire referral error:", error);
    res.status(500).json({ error: "Failed to expire referral" });
  }
});

// =============================================
// GET /api/superadmin/export
// Export referrals as CSV
// =============================================
router.get("/export", superAdminAuth, async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;

    let whereClause = "WHERE 1=1";
    const params = [];

    if (status && status !== "all") {
      whereClause += " AND r.status = ?";
      params.push(status);
    }

    if (startDate) {
      whereClause += " AND r.created_at >= ?";
      params.push(startDate);
    }

    if (endDate) {
      whereClause += " AND r.created_at <= ?";
      params.push(endDate + " 23:59:59");
    }

    const [referrals] = await db.query(
      `SELECT 
        r.id, r.referral_code, r.status, r.reward_amount, r.reward_type,
        r.qualification_type, r.paypal_email, r.qualified_at, r.rewarded_at, r.created_at, r.notes,
        referrer.first_name as referrer_first_name, referrer.last_name as referrer_last_name,
        referrer.email as referrer_email, referrer.business_name as referrer_business,
        referred.first_name as referred_first_name, referred.last_name as referred_last_name,
        referred.email as referred_email, referred.business_name as referred_business,
        referred.phone_verified as referred_phone_verified
       FROM referrals r
       JOIN users referrer ON r.referrer_id = referrer.id
       JOIN users referred ON r.referred_id = referred.id
       ${whereClause}
       ORDER BY r.created_at DESC`,
      params,
    );

    const csvHeaders = [
      "ID",
      "Referral Code",
      "Status",
      "Reward Amount",
      "Reward Type",
      "Qualification Type",
      "Referrer Name",
      "Referrer Email",
      "Referrer Business",
      "Referred Name",
      "Referred Email",
      "Referred Business",
      "Phone Verified",
      "PayPal Email",
      "Created At",
      "Qualified At",
      "Rewarded At",
      "Notes",
    ];

    const csvRows = referrals.map((r) => [
      r.id,
      r.referral_code,
      r.status,
      r.reward_amount,
      r.reward_type,
      r.qualification_type,
      `${r.referrer_first_name} ${r.referrer_last_name}`,
      r.referrer_email,
      r.referrer_business || "",
      `${r.referred_first_name} ${r.referred_last_name}`,
      r.referred_email,
      r.referred_business || "",
      r.referred_phone_verified ? "Yes" : "No",
      r.paypal_email || "",
      r.created_at ? new Date(r.created_at).toISOString() : "",
      r.qualified_at ? new Date(r.qualified_at).toISOString() : "",
      r.rewarded_at ? new Date(r.rewarded_at).toISOString() : "",
      (r.notes || "").replace(/\n/g, " "),
    ]);

    const csvContent = [
      csvHeaders.join(","),
      ...csvRows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
      ),
    ].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=referrals_export_${new Date().toISOString().split("T")[0]}.csv`,
    );
    res.send(csvContent);
  } catch (error) {
    console.error("Export referrals error:", error);
    res.status(500).json({ error: "Failed to export referrals" });
  }
});

// =============================================
// GET /api/superadmin/document/:id
// Download a user document (bank statement)
// =============================================
const path = require("path");
const fs = require("fs");

router.get("/document/:id", superAdminAuth, async (req, res) => {
  try {
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
    console.error("Super admin document download error:", error);
    res.status(500).json({ error: "Failed to download document" });
  }
});

module.exports = router;
