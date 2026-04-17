const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const db = require("../config/db");
const authMiddleware = require("../middleware/auth");

// Validation rules
const registerValidation = [
  body("firstName").trim().notEmpty().withMessage("First name is required"),
  body("lastName").trim().notEmpty().withMessage("Last name is required"),
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Password must contain uppercase, lowercase, and number"),
  body("businessName")
    .trim()
    .notEmpty()
    .withMessage("Business name is required"),
  body("businessType")
    .optional()
    .isIn([
      "Limited company",
      "Limited partnership",
      "Partnership",
      "Sole trader",
      "Other",
    ]),
  body("phone").optional().trim(),
];

const loginValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required"),
  body("password").notEmpty().withMessage("Password is required"),
];

const updateProfileValidation = [
  body("firstName").optional().trim().notEmpty(),
  body("lastName").optional().trim().notEmpty(),
  body("businessName").optional().trim(),
  body("businessType")
    .optional()
    .isIn([
      "Limited company",
      "Limited partnership",
      "Partnership",
      "Sole trader",
      "Other",
    ]),
  body("phone").optional().trim(),
];

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post("/register", registerValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      firstName,
      lastName,
      email,
      password,
      businessName,
      businessType,
      phone,
      referralCode,
    } = req.body;

    // Check if user already exists
    const [existingUsers] = await db.query(
      "SELECT id FROM users WHERE email = ?",
      [email],
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Check referral code if provided
    let referrerId = null;
    let validReferralCode = null;
    if (referralCode) {
      const [referrers] = await db.query(
        "SELECT id, referral_code FROM users WHERE referral_code = ?",
        [referralCode.toUpperCase()],
      );
      if (referrers.length > 0) {
        referrerId = referrers[0].id;
        validReferralCode = referrers[0].referral_code;
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert new user with referred_by if applicable
    const [result] = await db.query(
      `INSERT INTO users (first_name, last_name, email, password, business_name, business_type, phone, referred_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        firstName,
        lastName,
        email,
        hashedPassword,
        businessName,
        businessType || null,
        phone || null,
        referrerId,
      ],
    );

    // Create referral record if user was referred
    if (referrerId && validReferralCode) {
      await db.query(
        `INSERT INTO referrals (referrer_id, referred_id, referral_code, status, qualification_type)
         VALUES (?, ?, ?, 'pending', 'bank_statement_upload')`,
        [referrerId, result.insertId, validReferralCode],
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: result.insertId, email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    // Link any pending funding applications to this user
    const sessionId = req.body.sessionId;
    if (sessionId) {
      await db.query(
        "UPDATE funding_applications SET user_id = ? WHERE session_id = ? AND user_id IS NULL",
        [result.insertId, sessionId],
      );
    }

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      token,
      user: {
        id: result.insertId,
        firstName,
        lastName,
        email,
        businessName,
        businessType,
        phone,
        phoneVerified: false,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ error: "Server error during registration" });
  }
});

/**
 * POST /api/auth/login
 * Authenticate user and return token
 */
router.post("/login", loginValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user by email
    const [users] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    if (users.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = users[0];

    // Check if user is active
    if (!user.is_active) {
      return res.status(401).json({ error: "Account is deactivated" });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    // Update last login
    await db.query("UPDATE users SET last_login = NOW() WHERE id = ?", [
      user.id,
    ]);

    // Link any pending funding applications to this user
    const sessionId = req.body.sessionId;
    if (sessionId) {
      await db.query(
        "UPDATE funding_applications SET user_id = ? WHERE session_id = ? AND user_id IS NULL",
        [user.id, sessionId],
      );
    }

    // Check if user has any funding applications
    const [applications] = await db.query(
      "SELECT COUNT(*) as count FROM funding_applications WHERE user_id = ?",
      [user.id],
    );
    const hasApplications = applications[0].count > 0;

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        businessName: user.business_name,
        businessType: user.business_type,
        phone: user.phone,
        phoneVerified: user.phone_verified,
        hasApplications: hasApplications,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Server error during login" });
  }
});

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const [users] = await db.query(
      `SELECT id, first_name, last_name, email, business_name, business_type, 
              phone, phone_verified, created_at, last_login 
       FROM users WHERE id = ?`,
      [req.userId],
    );

    if (users.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = users[0];
    res.json({
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      businessName: user.business_name,
      businessType: user.business_type,
      phone: user.phone,
      phoneVerified: user.phone_verified,
      createdAt: user.created_at,
      lastLogin: user.last_login,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * PUT /api/auth/profile
 * Update user profile
 */
router.put(
  "/profile",
  authMiddleware,
  updateProfileValidation,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { firstName, lastName, businessName, businessType, phone } =
        req.body;
      const updates = [];
      const values = [];

      if (firstName) {
        updates.push("first_name = ?");
        values.push(firstName);
      }
      if (lastName) {
        updates.push("last_name = ?");
        values.push(lastName);
      }
      if (businessName) {
        updates.push("business_name = ?");
        values.push(businessName);
      }
      if (businessType) {
        updates.push("business_type = ?");
        values.push(businessType);
      }
      if (phone !== undefined) {
        updates.push("phone = ?");
        values.push(phone || null);
        // Reset phone verification if phone changed
        updates.push("phone_verified = FALSE");
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: "No fields to update" });
      }

      values.push(req.userId);
      await db.query(
        `UPDATE users SET ${updates.join(", ")} WHERE id = ?`,
        values,
      );

      // Get updated user
      const [users] = await db.query(
        `SELECT id, first_name, last_name, email, business_name, business_type, 
              phone, phone_verified FROM users WHERE id = ?`,
        [req.userId],
      );

      const user = users[0];
      res.json({
        success: true,
        message: "Profile updated successfully",
        user: {
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          businessName: user.business_name,
          businessType: user.business_type,
          phone: user.phone,
          phoneVerified: user.phone_verified,
        },
      });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ error: "Server error" });
    }
  },
);

/**
 * PUT /api/auth/change-password
 * Change user password
 */
router.put(
  "/change-password",
  authMiddleware,
  [
    body("currentPassword")
      .notEmpty()
      .withMessage("Current password is required"),
    body("newPassword")
      .isLength({ min: 8 })
      .withMessage("New password must be at least 8 characters")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage("Password must contain uppercase, lowercase, and number"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { currentPassword, newPassword } = req.body;

      // Get user
      const [users] = await db.query(
        "SELECT password FROM users WHERE id = ?",
        [req.userId],
      );
      if (users.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      // Verify current password
      const isValid = await bcrypt.compare(currentPassword, users[0].password);
      if (!isValid) {
        return res.status(401).json({ error: "Current password is incorrect" });
      }

      // Hash new password
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Update password
      await db.query("UPDATE users SET password = ? WHERE id = ?", [
        hashedPassword,
        req.userId,
      ]);

      res.json({ success: true, message: "Password changed successfully" });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ error: "Server error" });
    }
  },
);

/**
 * POST /api/auth/forgot-password
 * Send password reset email
 */
router.post(
  "/forgot-password",
  body("email").isEmail().normalizeEmail(),
  async (req, res) => {
    try {
      const { email } = req.body;

      // Check if user exists
      const [users] = await db.query("SELECT id FROM users WHERE email = ?", [
        email,
      ]);

      // Always return success to prevent email enumeration
      if (users.length === 0) {
        return res.json({
          success: true,
          message: "If the email exists, a reset link has been sent.",
        });
      }

      // Generate reset token
      const crypto = require("crypto");
      const resetToken = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 3600000); // 1 hour

      // Store in database
      await db.query(
        "INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)",
        [users[0].id, resetToken, expiresAt],
      );

      // In production, send email with reset link
      console.log(`Password reset token for ${email}: ${resetToken}`);

      res.json({
        success: true,
        message: "If the email exists, a reset link has been sent.",
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ error: "Server error" });
    }
  },
);

/**
 * POST /api/auth/reset-password
 * Reset password with token
 */
router.post(
  "/reset-password",
  [
    body("token").notEmpty().withMessage("Reset token is required"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { token, password } = req.body;

      // Find valid token
      const [tokens] = await db.query(
        `SELECT * FROM password_reset_tokens 
       WHERE token = ? AND expires_at > NOW() AND used = FALSE`,
        [token],
      );

      if (tokens.length === 0) {
        return res
          .status(400)
          .json({ error: "Invalid or expired reset token" });
      }

      // Hash new password
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Update password
      await db.query("UPDATE users SET password = ? WHERE id = ?", [
        hashedPassword,
        tokens[0].user_id,
      ]);

      // Mark token as used
      await db.query(
        "UPDATE password_reset_tokens SET used = TRUE WHERE id = ?",
        [tokens[0].id],
      );

      res.json({ success: true, message: "Password reset successfully" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ error: "Server error" });
    }
  },
);

/**
 * POST /api/auth/logout
 * Logout user (for logging purposes)
 */
router.post("/logout", (req, res) => {
  res.json({ success: true, message: "Logged out successfully" });
});

/**
 * DELETE /api/auth/account
 * Delete user account
 */
router.delete("/account", authMiddleware, async (req, res) => {
  try {
    await db.query("UPDATE users SET is_active = FALSE WHERE id = ?", [
      req.userId,
    ]);
    res.json({ success: true, message: "Account deactivated successfully" });
  } catch (error) {
    console.error("Delete account error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
