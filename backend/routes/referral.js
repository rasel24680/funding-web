const express = require("express");
const router = express.Router();
const db = require("../config/db");
const authMiddleware = require("../middleware/auth");
const crypto = require("crypto");

// =============================================
// Helper Functions
// =============================================

/**
 * Generate a unique referral code
 * Format: 6-character alphanumeric code
 */
function generateReferralCode() {
  return crypto.randomBytes(4).toString("hex").toUpperCase().substring(0, 6);
}

/**
 * Get or create referral code for a user
 */
async function getOrCreateReferralCode(userId) {
  // Check if user already has a referral code
  const [users] = await db.query(
    "SELECT referral_code FROM users WHERE id = ?",
    [userId],
  );

  if (users.length === 0) {
    throw new Error("User not found");
  }

  if (users[0].referral_code) {
    return users[0].referral_code;
  }

  // Generate a unique referral code
  let referralCode;
  let isUnique = false;
  let attempts = 0;

  while (!isUnique && attempts < 10) {
    referralCode = generateReferralCode();
    const [existing] = await db.query(
      "SELECT id FROM users WHERE referral_code = ?",
      [referralCode],
    );
    if (existing.length === 0) {
      isUnique = true;
    }
    attempts++;
  }

  if (!isUnique) {
    // Fallback: use user ID + random chars
    referralCode = `U${userId}${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
  }

  // Save the referral code
  await db.query("UPDATE users SET referral_code = ? WHERE id = ?", [
    referralCode,
    userId,
  ]);

  return referralCode;
}

// =============================================
// User Referral Routes
// =============================================

/**
 * GET /api/referral/my-code
 * Get the current user's referral code and link
 */
router.get("/my-code", authMiddleware, async (req, res) => {
  try {
    const referralCode = await getOrCreateReferralCode(req.userId);
    const baseUrl = process.env.FRONTEND_URL || "https://funding.pellopay.io";
    const referralLink = `${baseUrl}/login.html?ref=${referralCode}`;

    res.json({
      success: true,
      referralCode,
      referralLink,
    });
  } catch (error) {
    console.error("Get referral code error:", error);
    res.status(500).json({ error: "Failed to get referral code" });
  }
});

/**
 * GET /api/referral/stats
 * Get the current user's referral statistics
 */
router.get("/stats", authMiddleware, async (req, res) => {
  try {
    // Get total referrals
    const [totalResult] = await db.query(
      "SELECT COUNT(*) as total FROM referrals WHERE referrer_id = ?",
      [req.userId],
    );

    // Get referrals by status
    const [statusResult] = await db.query(
      `SELECT status, COUNT(*) as count 
       FROM referrals 
       WHERE referrer_id = ? 
       GROUP BY status`,
      [req.userId],
    );

    // Get total rewards earned
    const [rewardsResult] = await db.query(
      `SELECT SUM(reward_amount) as total_rewards 
       FROM referrals 
       WHERE referrer_id = ? AND status = 'rewarded'`,
      [req.userId],
    );

    // Get pending rewards
    const [pendingResult] = await db.query(
      `SELECT SUM(reward_amount) as pending_rewards 
       FROM referrals 
       WHERE referrer_id = ? AND status = 'qualified'`,
      [req.userId],
    );

    const statusCounts = {
      pending: 0,
      qualified: 0,
      rewarded: 0,
      expired: 0,
    };

    statusResult.forEach((row) => {
      statusCounts[row.status] = row.count;
    });

    res.json({
      success: true,
      stats: {
        totalReferrals: totalResult[0].total || 0,
        pendingReferrals: statusCounts.pending,
        qualifiedReferrals: statusCounts.qualified,
        rewardedReferrals: statusCounts.rewarded,
        expiredReferrals: statusCounts.expired,
        totalRewardsEarned: parseFloat(rewardsResult[0].total_rewards) || 0,
        pendingRewards: parseFloat(pendingResult[0].pending_rewards) || 0,
      },
    });
  } catch (error) {
    console.error("Get referral stats error:", error);
    res.status(500).json({ error: "Failed to get referral stats" });
  }
});

/**
 * GET /api/referral/list
 * Get list of user's referrals
 */
router.get("/list", authMiddleware, async (req, res) => {
  try {
    const [referrals] = await db.query(
      `SELECT 
        r.id,
        r.status,
        r.reward_amount,
        r.reward_type,
        r.qualification_type,
        r.qualified_at,
        r.rewarded_at,
        r.created_at,
        u.first_name,
        u.last_name,
        u.email,
        u.business_name,
        u.phone_verified
       FROM referrals r
       JOIN users u ON r.referred_id = u.id
       WHERE r.referrer_id = ?
       ORDER BY r.created_at DESC`,
      [req.userId],
    );

    // Mask email for privacy
    const maskedReferrals = referrals.map((ref) => ({
      id: ref.id,
      status: ref.status,
      rewardAmount: ref.reward_amount,
      rewardType: ref.reward_type,
      qualificationType: ref.qualification_type,
      qualifiedAt: ref.qualified_at,
      rewardedAt: ref.rewarded_at,
      createdAt: ref.created_at,
      referredUser: {
        name: `${ref.first_name} ${ref.last_name.charAt(0)}.`,
        email: ref.email.replace(/(.{2})(.*)(?=@)/, "$1***"),
        businessName: ref.business_name,
        phoneVerified: ref.phone_verified,
      },
    }));

    res.json({
      success: true,
      referrals: maskedReferrals,
    });
  } catch (error) {
    console.error("Get referral list error:", error);
    res.status(500).json({ error: "Failed to get referral list" });
  }
});

/**
 * GET /api/referral/validate/:code
 * Validate a referral code (public endpoint for signup)
 */
router.get("/validate/:code", async (req, res) => {
  try {
    const { code } = req.params;

    const [users] = await db.query(
      `SELECT id, first_name, business_name FROM users WHERE referral_code = ?`,
      [code.toUpperCase()],
    );

    if (users.length === 0) {
      return res.status(404).json({
        valid: false,
        error: "Invalid referral code",
      });
    }

    res.json({
      valid: true,
      referrer: {
        name: users[0].first_name,
        businessName: users[0].business_name,
      },
    });
  } catch (error) {
    console.error("Validate referral code error:", error);
    res.status(500).json({ error: "Failed to validate referral code" });
  }
});

// =============================================
// Admin Referral Routes
// =============================================

/**
 * Middleware to check if user is admin
 */
async function adminMiddleware(req, res, next) {
  try {
    const [users] = await db.query("SELECT role FROM users WHERE id = ?", [
      req.userId,
    ]);

    if (users.length === 0 || users[0].role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: "Authorization check failed" });
  }
}

/**
 * GET /api/referral/admin/all
 * Get all referrals (admin only)
 */
router.get("/admin/all", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = "";
    const params = [];

    if (status && status !== "all") {
      whereClause = "WHERE r.status = ?";
      params.push(status);
    }

    // Get total count
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM referrals r ${whereClause}`,
      params,
    );

    // Get referrals with user info
    const [referrals] = await db.query(
      `SELECT 
        r.id,
        r.referral_code,
        r.status,
        r.reward_amount,
        r.reward_type,
        r.qualification_type,
        r.qualified_at,
        r.rewarded_at,
        r.notes,
        r.created_at,
        referrer.id as referrer_id,
        referrer.first_name as referrer_first_name,
        referrer.last_name as referrer_last_name,
        referrer.email as referrer_email,
        referrer.business_name as referrer_business,
        referred.id as referred_id,
        referred.first_name as referred_first_name,
        referred.last_name as referred_last_name,
        referred.email as referred_email,
        referred.business_name as referred_business,
        referred.phone_verified as referred_phone_verified
       FROM referrals r
       JOIN users referrer ON r.referrer_id = referrer.id
       JOIN users referred ON r.referred_id = referred.id
       ${whereClause}
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)],
    );

    res.json({
      success: true,
      referrals: referrals.map((r) => ({
        id: r.id,
        referralCode: r.referral_code,
        status: r.status,
        rewardAmount: r.reward_amount,
        rewardType: r.reward_type,
        qualificationType: r.qualification_type,
        qualifiedAt: r.qualified_at,
        rewardedAt: r.rewarded_at,
        notes: r.notes,
        createdAt: r.created_at,
        referrer: {
          id: r.referrer_id,
          name: `${r.referrer_first_name} ${r.referrer_last_name}`,
          email: r.referrer_email,
          businessName: r.referrer_business,
        },
        referred: {
          id: r.referred_id,
          name: `${r.referred_first_name} ${r.referred_last_name}`,
          email: r.referred_email,
          businessName: r.referred_business,
          phoneVerified: r.referred_phone_verified,
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
    console.error("Get all referrals error:", error);
    res.status(500).json({ error: "Failed to get referrals" });
  }
});

/**
 * GET /api/referral/admin/stats
 * Get overall referral statistics (admin only)
 */
router.get(
  "/admin/stats",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      // Overall stats
      const [totalStats] = await db.query(`
      SELECT 
        COUNT(*) as total_referrals,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'qualified' THEN 1 ELSE 0 END) as qualified,
        SUM(CASE WHEN status = 'rewarded' THEN 1 ELSE 0 END) as rewarded,
        SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) as expired,
        SUM(CASE WHEN status = 'rewarded' THEN reward_amount ELSE 0 END) as total_paid,
        SUM(CASE WHEN status = 'qualified' THEN reward_amount ELSE 0 END) as pending_payout
      FROM referrals
    `);

      // Top referrers
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

      // Monthly stats (last 6 months)
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

      res.json({
        success: true,
        stats: {
          total: totalStats[0].total_referrals || 0,
          pending: totalStats[0].pending || 0,
          qualified: totalStats[0].qualified || 0,
          rewarded: totalStats[0].rewarded || 0,
          expired: totalStats[0].expired || 0,
          totalPaid: parseFloat(totalStats[0].total_paid) || 0,
          pendingPayout: parseFloat(totalStats[0].pending_payout) || 0,
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
      console.error("Get admin stats error:", error);
      res.status(500).json({ error: "Failed to get stats" });
    }
  },
);

/**
 * POST /api/referral/admin/qualify/:id
 * Mark a referral as qualified (admin only)
 */
router.post(
  "/admin/qualify/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { notes } = req.body;

      // Check if referral exists and is pending
      const [referrals] = await db.query(
        "SELECT * FROM referrals WHERE id = ?",
        [id],
      );

      if (referrals.length === 0) {
        return res.status(404).json({ error: "Referral not found" });
      }

      if (referrals[0].status !== "pending") {
        return res.status(400).json({
          error: `Cannot qualify referral with status: ${referrals[0].status}`,
        });
      }

      // Update to qualified
      await db.query(
        `UPDATE referrals SET status = 'qualified', qualified_at = NOW(), notes = ? WHERE id = ?`,
        [notes || null, id],
      );

      res.json({
        success: true,
        message: "Referral marked as qualified",
      });
    } catch (error) {
      console.error("Qualify referral error:", error);
      res.status(500).json({ error: "Failed to qualify referral" });
    }
  },
);

/**
 * POST /api/referral/admin/reward/:id
 * Process reward for a qualified referral (admin only)
 */
router.post(
  "/admin/reward/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { voucherCode, notes } = req.body;

      // Check if referral exists and is qualified
      const [referrals] = await db.query(
        "SELECT * FROM referrals WHERE id = ?",
        [id],
      );

      if (referrals.length === 0) {
        return res.status(404).json({ error: "Referral not found" });
      }

      if (referrals[0].status !== "qualified") {
        return res.status(400).json({
          error: `Cannot reward referral with status: ${referrals[0].status}`,
        });
      }

      const referral = referrals[0];

      // Create reward record
      await db.query(
        `INSERT INTO referral_rewards 
         (referral_id, user_id, reward_type, reward_amount, voucher_code, status, sent_at, expires_at)
         VALUES (?, ?, ?, ?, ?, 'sent', NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR))`,
        [
          id,
          referral.referrer_id,
          referral.reward_type,
          referral.reward_amount,
          voucherCode || null,
        ],
      );

      // Update referral status
      await db.query(
        `UPDATE referrals SET status = 'rewarded', rewarded_at = NOW(), notes = CONCAT(IFNULL(notes, ''), ?) WHERE id = ?`,
        [notes ? `\nReward: ${notes}` : "", id],
      );

      res.json({
        success: true,
        message: "Reward processed successfully",
      });
    } catch (error) {
      console.error("Process reward error:", error);
      res.status(500).json({ error: "Failed to process reward" });
    }
  },
);

/**
 * POST /api/referral/admin/expire/:id
 * Mark a referral as expired (admin only)
 */
router.post(
  "/admin/expire/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { notes } = req.body;

      const [referrals] = await db.query(
        "SELECT * FROM referrals WHERE id = ?",
        [id],
      );

      if (referrals.length === 0) {
        return res.status(404).json({ error: "Referral not found" });
      }

      if (referrals[0].status === "rewarded") {
        return res.status(400).json({
          error: "Cannot expire an already rewarded referral",
        });
      }

      await db.query(
        `UPDATE referrals SET status = 'expired', notes = CONCAT(IFNULL(notes, ''), ?) WHERE id = ?`,
        [notes ? `\nExpired: ${notes}` : "", id],
      );

      res.json({
        success: true,
        message: "Referral marked as expired",
      });
    } catch (error) {
      console.error("Expire referral error:", error);
      res.status(500).json({ error: "Failed to expire referral" });
    }
  },
);

/**
 * GET /api/referral/admin/export
 * Export referrals as CSV (admin only)
 */
router.get(
  "/admin/export",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
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
        r.id,
        r.referral_code,
        r.status,
        r.reward_amount,
        r.reward_type,
        r.qualification_type,
        r.qualified_at,
        r.rewarded_at,
        r.created_at,
        referrer.first_name as referrer_first_name,
        referrer.last_name as referrer_last_name,
        referrer.email as referrer_email,
        referrer.business_name as referrer_business,
        referred.first_name as referred_first_name,
        referred.last_name as referred_last_name,
        referred.email as referred_email,
        referred.business_name as referred_business,
        referred.phone_verified as referred_phone_verified
       FROM referrals r
       JOIN users referrer ON r.referrer_id = referrer.id
       JOIN users referred ON r.referred_id = referred.id
       ${whereClause}
       ORDER BY r.created_at DESC`,
        params,
      );

      // Generate CSV
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
        "Created At",
        "Qualified At",
        "Rewarded At",
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
        r.created_at ? new Date(r.created_at).toISOString() : "",
        r.qualified_at ? new Date(r.qualified_at).toISOString() : "",
        r.rewarded_at ? new Date(r.rewarded_at).toISOString() : "",
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
  },
);

module.exports = router;
