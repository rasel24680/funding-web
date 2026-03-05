const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const nodemailer = require("nodemailer");
const db = require("../config/db");
const authMiddleware = require("../middleware/auth");

// Validation rules
const contactValidation = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required"),
  body("phone").trim().notEmpty().withMessage("Phone number is required"),
  body("businessName")
    .trim()
    .notEmpty()
    .withMessage("Business name is required"),
  body("subject").trim().notEmpty().withMessage("Subject is required"),
  body("message")
    .trim()
    .isLength({ min: 10 })
    .withMessage("Message must be at least 10 characters"),
];

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 465,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
};

/**
 * POST /api/contact/submit
 * Submit a contact form inquiry
 */
router.post("/submit", contactValidation, async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, phone, businessName, subject, message } = req.body;

    // Save to database
    const [result] = await db.query(
      `INSERT INTO contact_inquiries 
            (name, email, phone, business_name, subject, message) 
            VALUES (?, ?, ?, ?, ?, ?)`,
      [name, email, phone, businessName, subject, message],
    );

    // Send email notification
    try {
      const transporter = createTransporter();

      await transporter.sendMail({
        from: process.env.EMAIL_FROM || "noreply@pellopay.co.uk",
        to: process.env.EMAIL_TO || "funding@pellopay.co.uk",
        subject: `New Contact Inquiry: ${subject}`,
        html: `
                    <h2>New Contact Form Submission</h2>
                    <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
                        <tr style="border-bottom: 1px solid #ddd;">
                            <td style="padding: 12px; font-weight: bold;">Name:</td>
                            <td style="padding: 12px;">${name}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #ddd;">
                            <td style="padding: 12px; font-weight: bold;">Email:</td>
                            <td style="padding: 12px;"><a href="mailto:${email}">${email}</a></td>
                        </tr>
                        <tr style="border-bottom: 1px solid #ddd;">
                            <td style="padding: 12px; font-weight: bold;">Phone:</td>
                            <td style="padding: 12px;"><a href="tel:${phone}">${phone}</a></td>
                        </tr>
                        <tr style="border-bottom: 1px solid #ddd;">
                            <td style="padding: 12px; font-weight: bold;">Business:</td>
                            <td style="padding: 12px;">${businessName}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #ddd;">
                            <td style="padding: 12px; font-weight: bold;">Subject:</td>
                            <td style="padding: 12px;">${subject}</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px; font-weight: bold; vertical-align: top;">Message:</td>
                            <td style="padding: 12px;">${message.replace(/\n/g, "<br>")}</td>
                        </tr>
                    </table>
                    <p style="margin-top: 20px; color: #666;">
                        This inquiry was submitted on ${new Date().toLocaleString("en-GB")}
                    </p>
                `,
      });

      // Send confirmation email to user
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || "noreply@pellopay.co.uk",
        to: email,
        subject: "Thank you for contacting Pellopay",
        html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #1a2b3d;">Thank You for Your Inquiry</h2>
                        <p>Dear ${name},</p>
                        <p>Thank you for reaching out to Pellopay. We have received your message and our team will get back to you within 2 business hours.</p>
                        <p><strong>Your Inquiry Details:</strong></p>
                        <ul>
                            <li><strong>Subject:</strong> ${subject}</li>
                            <li><strong>Business:</strong> ${businessName}</li>
                        </ul>
                        <p>If you need immediate assistance, please don't hesitate to email us at <a href="mailto:funding@pellopay.co.uk">funding@pellopay.co.uk</a></p>
                        <p>Best regards,<br>The Pellopay Team</p>
                    </div>
                `,
      });

      console.log("Contact emails sent successfully");
    } catch (emailError) {
      // Log email error but don't fail the request
      console.error("Email sending error:", emailError);
    }

    res.status(201).json({
      success: true,
      message: "Thank you! Your message has been sent successfully.",
      inquiryId: result.insertId,
    });
  } catch (error) {
    console.error("Contact submit error:", error);
    res.status(500).json({ error: "Server error. Please try again." });
  }
});

/**
 * GET /api/contact/inquiries
 * Get all contact inquiries (admin only - requires authentication and admin role)
 */
router.get("/inquiries", authMiddleware, async (req, res) => {
  try {
    // Check if user has admin role
    const [users] = await db.query(`SELECT role FROM users WHERE id = ?`, [
      req.userId,
    ]);

    if (users.length === 0 || users[0].role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const [inquiries] = await db.query(
      `SELECT * FROM contact_inquiries ORDER BY created_at DESC LIMIT 100`,
    );

    res.json({
      success: true,
      count: inquiries.length,
      inquiries,
    });
  } catch (error) {
    console.error("Get inquiries error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
