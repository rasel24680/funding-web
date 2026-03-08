require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");

const app = express();

// Trust proxy (Hostinger runs a reverse proxy in front of Node.js)
app.set("trust proxy", 1);

// Security Middleware - relaxed for production
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false,
  }),
);

// Rate limiting - 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Too many requests, please try again later." },
});
app.use("/api/", limiter);

// CORS Configuration - allow Hostinger domain
app.use(
  cors({
    origin: [
      "https://red-cat-211667.hostingersite.com",
      "http://localhost:3000",
    ],
    credentials: true,
  }),
);

// Body Parser
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files from 'public' folder
app.use(express.static(path.join(__dirname, "public")));

// API Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/phone", require("./routes/phone-verification"));
app.use("/api/funding", require("./routes/funding"));
app.use("/api/contact", require("./routes/contact"));
app.use("/api/lenders", require("./routes/lenders"));
app.use("/api/company", require("./routes/company"));
app.use("/api/referral", require("./routes/referral"));
app.use("/api/documents", require("./routes/documents"));

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Serve frontend for all other routes (SPA support)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public/login.html"));
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Error:", err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📁 Frontend served from: ${path.join(__dirname, "public")}`);
  console.log(`🔗 API available at: http://localhost:${PORT}/api`);
});
