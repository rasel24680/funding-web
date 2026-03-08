const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const db = require("../config/db");
const authMiddleware = require("../middleware/auth");

/**
 * Generate a 6-digit verification code
 */
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * POST /api/phone/send-code
 * Send verification code to phone number
 *
 * To use Twilio SMS, add to .env:
 * TWILIO_ACCOUNT_SID=your_sid
 * TWILIO_AUTH_TOKEN=your_token
 * TWILIO_PHONE_NUMBER=+1234567890
 */
router.post(
  "/send-code",
  authMiddleware,
  body("phone")
    .matches(/^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/)
    .withMessage("Valid phone number is required"),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { phone } = req.body;
      const userId = req.userId;

      // Generate verification code
      const code = generateVerificationCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Delete any existing codes for this user
      await db.query("DELETE FROM phone_verifications WHERE user_id = ?", [
        userId,
      ]);

      // Store new verification code
      await db.query(
        `INSERT INTO phone_verifications (user_id, phone, code, expires_at) 
         VALUES (?, ?, ?, ?)`,
        [userId, phone, code, expiresAt],
      );

      // Update user's phone number (unverified)
      await db.query(
        "UPDATE users SET phone = ?, phone_verified = FALSE WHERE id = ?",
        [phone, userId],
      );

      // Send SMS via Twilio (if configured)
      let twilioConfigured = false;
      if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
        try {
          const twilio = require("twilio")(
            process.env.TWILIO_ACCOUNT_SID,
            process.env.TWILIO_AUTH_TOKEN,
          );

          await twilio.messages.create({
            body: `Your Pellopay verification code is: ${code}. Valid for 10 minutes.`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: phone,
          });

          twilioConfigured = true;
          console.log(`SMS sent to ${phone}`);
        } catch (smsError) {
          console.error("Twilio SMS error:", smsError);
          // Continue anyway - code is stored
        }
      } else {
        // Development mode - log the code
        console.log(`📱 Verification code for ${phone}: ${code}`);
      }

      res.json({
        success: true,
        message: "Verification code sent",
        // Return code if Twilio is not configured (dev/testing mode)
        ...(!twilioConfigured && { code }),
      });
    } catch (error) {
      console.error("Send code error:", error);
      res.status(500).json({ error: "Failed to send verification code" });
    }
  },
);

/**
 * POST /api/phone/verify
 * Verify the phone number with the code
 */
router.post(
  "/verify",
  authMiddleware,
  body("code")
    .isLength({ min: 6, max: 6 })
    .withMessage("Invalid verification code"),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { code } = req.body;
      const userId = req.userId;

      // Get verification record
      const [records] = await db.query(
        `SELECT * FROM phone_verifications 
         WHERE user_id = ? AND expires_at > NOW()
         ORDER BY created_at DESC LIMIT 1`,
        [userId],
      );

      if (records.length === 0) {
        return res.status(400).json({
          error:
            "No pending verification or code expired. Please request a new code.",
        });
      }

      const verification = records[0];

      // Check attempts
      if (verification.attempts >= 5) {
        return res.status(429).json({
          error: "Too many attempts. Please request a new code.",
        });
      }

      // Increment attempts
      await db.query(
        "UPDATE phone_verifications SET attempts = attempts + 1 WHERE id = ?",
        [verification.id],
      );

      // Verify code
      if (verification.code !== code) {
        return res.status(400).json({
          error: "Invalid verification code",
          attemptsRemaining: 4 - verification.attempts,
        });
      }

      // Mark phone as verified
      await db.query("UPDATE users SET phone_verified = TRUE WHERE id = ?", [
        userId,
      ]);

      // Delete verification record
      await db.query("DELETE FROM phone_verifications WHERE user_id = ?", [
        userId,
      ]);

      res.json({
        success: true,
        message: "Phone number verified successfully",
      });
    } catch (error) {
      console.error("Verify code error:", error);
      res.status(500).json({ error: "Failed to verify code" });
    }
  },
);

/**
 * POST /api/phone/resend
 * Resend verification code
 */
router.post("/resend", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;

    // Get user's phone
    const [users] = await db.query("SELECT phone FROM users WHERE id = ?", [
      userId,
    ]);

    if (!users.length || !users[0].phone) {
      return res.status(400).json({ error: "No phone number on file" });
    }

    // Check rate limit (1 code per minute)
    const [recent] = await db.query(
      `SELECT * FROM phone_verifications 
       WHERE user_id = ? AND created_at > DATE_SUB(NOW(), INTERVAL 1 MINUTE)`,
      [userId],
    );

    if (recent.length > 0) {
      return res.status(429).json({
        error: "Please wait 1 minute before requesting a new code",
      });
    }

    // Generate and store new code
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await db.query("DELETE FROM phone_verifications WHERE user_id = ?", [
      userId,
    ]);
    await db.query(
      `INSERT INTO phone_verifications (user_id, phone, code, expires_at) 
       VALUES (?, ?, ?, ?)`,
      [userId, users[0].phone, code, expiresAt],
    );

    // Send SMS if Twilio configured
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      try {
        const twilio = require("twilio")(
          process.env.TWILIO_ACCOUNT_SID,
          process.env.TWILIO_AUTH_TOKEN,
        );

        await twilio.messages.create({
          body: `Your Pellopay verification code is: ${code}. Valid for 10 minutes.`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: users[0].phone,
        });
      } catch (smsError) {
        console.error("Twilio SMS error:", smsError);
      }
    } else {
      console.log(`📱 Verification code for ${users[0].phone}: ${code}`);
    }

    res.json({
      success: true,
      message: "New verification code sent",
      ...(process.env.NODE_ENV === "development" && { code }),
    });
  } catch (error) {
    console.error("Resend code error:", error);
    res.status(500).json({ error: "Failed to resend code" });
  }
});

/**
 * GET /api/phone/status
 * Check phone verification status
 */
router.get("/status", authMiddleware, async (req, res) => {
  try {
    const [users] = await db.query(
      "SELECT phone, phone_verified FROM users WHERE id = ?",
      [req.userId],
    );

    if (!users.length) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      phone: users[0].phone,
      verified: users[0].phone_verified,
    });
  } catch (error) {
    console.error("Get status error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
