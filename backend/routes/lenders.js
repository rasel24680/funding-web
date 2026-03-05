const express = require("express");
const router = express.Router();
const LenderManager = require("../services/lenders/LenderManager");
const authenticate = require("../middleware/auth");

/**
 * GET /api/lenders/test-bizcap
 * Test Bizcap API connection (for debugging - no auth required)
 * Returns first page of leads from Bizcap to verify API connection
 */
router.get("/test-bizcap", async (req, res) => {
  try {
    console.log("\n\x1b[35m%s\x1b[0m", "═".repeat(60));
    console.log("\x1b[35m%s\x1b[0m", "🔧 TESTING BIZCAP API CONNECTION");
    console.log("\x1b[35m%s\x1b[0m", "═".repeat(60) + "\n");

    const result = await LenderManager.getLeadsFromLender("bizcap", 1, 5);
    res.json({
      success: true,
      message: "Bizcap API connected successfully",
      data: result,
    });
  } catch (error) {
    console.error("\x1b[31m[BIZCAP TEST ERROR]\x1b[0m", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/lenders
 * Get all available lenders
 */
router.get("/", authenticate, (req, res) => {
  try {
    const lenders = LenderManager.getAllLenders();
    res.json({ success: true, lenders });
  } catch (error) {
    console.error(
      "\x1b[31m[LENDERS ERROR]\x1b[0m",
      new Date().toISOString(),
      error.message,
    );
    res
      .status(500)
      .json({ success: false, error: "Failed to retrieve lenders" });
  }
});

/**
 * GET /api/lenders/enabled
 * Get only enabled lenders
 */
router.get("/enabled", authenticate, (req, res) => {
  try {
    const lenders = LenderManager.getEnabledLenders();
    res.json({ success: true, lenders });
  } catch (error) {
    console.error(
      "\x1b[31m[LENDERS ERROR]\x1b[0m",
      new Date().toISOString(),
      error.message,
    );
    res
      .status(500)
      .json({ success: false, error: "Failed to retrieve enabled lenders" });
  }
});

/**
 * POST /api/lenders/:lenderName/leads
 * Submit a lead to a specific lender
 */
router.post("/:lenderName/leads", authenticate, async (req, res) => {
  try {
    const { lenderName } = req.params;
    const applicationData = req.body;

    const result = await LenderManager.submitToLender(
      lenderName,
      applicationData,
    );
    res.json({ success: true, data: result });
  } catch (error) {
    console.error(
      "\x1b[31m[LENDERS ERROR]\x1b[0m",
      new Date().toISOString(),
      `Submit to ${req.params.lenderName}:`,
      error.message,
    );
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/lenders/submit-all
 * Submit a lead to all enabled lenders
 */
router.post("/submit-all", authenticate, async (req, res) => {
  try {
    const applicationData = req.body;
    const results = await LenderManager.submitToAllLenders(applicationData);
    res.json({ success: true, results });
  } catch (error) {
    console.error(
      "\x1b[31m[LENDERS ERROR]\x1b[0m",
      new Date().toISOString(),
      "Submit to all lenders:",
      error.message,
    );
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/lenders/:lenderName/leads
 * Get leads from a specific lender
 */
router.get("/:lenderName/leads", authenticate, async (req, res) => {
  try {
    const { lenderName } = req.params;
    const { page = 1, pageSize = 100 } = req.query;

    const result = await LenderManager.getLeadsFromLender(
      lenderName,
      parseInt(page),
      parseInt(pageSize),
    );
    res.json({ success: true, data: result });
  } catch (error) {
    console.error(
      "\x1b[31m[LENDERS ERROR]\x1b[0m",
      new Date().toISOString(),
      `Get leads from ${req.params.lenderName}:`,
      error.message,
    );
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/lenders/:lenderName/leads/:leadId
 * Get a specific lead from a lender
 */
router.get("/:lenderName/leads/:leadId", authenticate, async (req, res) => {
  try {
    const { lenderName, leadId } = req.params;
    const result = await LenderManager.getLeadFromLender(lenderName, leadId);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error(
      "\x1b[31m[LENDERS ERROR]\x1b[0m",
      new Date().toISOString(),
      `Get lead ${req.params.leadId} from ${req.params.lenderName}:`,
      error.message,
    );
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PATCH /api/lenders/:lenderName/leads/:leadId
 * Update a lead with a specific lender
 */
router.patch("/:lenderName/leads/:leadId", authenticate, async (req, res) => {
  try {
    const { lenderName, leadId } = req.params;
    const updateData = req.body;

    const result = await LenderManager.updateLeadWithLender(
      lenderName,
      leadId,
      updateData,
    );
    res.json({ success: true, data: result });
  } catch (error) {
    console.error(
      "\x1b[31m[LENDERS ERROR]\x1b[0m",
      new Date().toISOString(),
      `Update lead ${req.params.leadId} with ${req.params.lenderName}:`,
      error.message,
    );
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/lenders/:lenderName/deals
 * Get deals from a specific lender
 */
router.get("/:lenderName/deals", authenticate, async (req, res) => {
  try {
    const { lenderName } = req.params;
    const { page = 1, pageSize = 100 } = req.query;

    const result = await LenderManager.getDealsFromLender(
      lenderName,
      parseInt(page),
      parseInt(pageSize),
    );
    res.json({ success: true, data: result });
  } catch (error) {
    console.error(
      "\x1b[31m[LENDERS ERROR]\x1b[0m",
      new Date().toISOString(),
      `Get deals from ${req.params.lenderName}:`,
      error.message,
    );
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/lenders/:lenderName/deals/:dealId
 * Get a specific deal from a lender
 */
router.get("/:lenderName/deals/:dealId", authenticate, async (req, res) => {
  try {
    const { lenderName, dealId } = req.params;
    const result = await LenderManager.getDealFromLender(lenderName, dealId);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error(
      "\x1b[31m[LENDERS ERROR]\x1b[0m",
      new Date().toISOString(),
      `Get deal ${req.params.dealId} from ${req.params.lenderName}:`,
      error.message,
    );
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/lenders/deals
 * Get deals from all enabled lenders
 */
router.get("/deals", authenticate, async (req, res) => {
  try {
    const { page = 1, pageSize = 100 } = req.query;
    const results = await LenderManager.getDealsFromAllLenders(
      parseInt(page),
      parseInt(pageSize),
    );
    res.json({ success: true, results });
  } catch (error) {
    console.error(
      "\x1b[31m[LENDERS ERROR]\x1b[0m",
      new Date().toISOString(),
      "Get deals from all lenders:",
      error.message,
    );
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/lenders/:lenderName/leads/:leadId/files
 * Upload files to a lead with a specific lender
 */
router.post(
  "/:lenderName/leads/:leadId/files",
  authenticate,
  async (req, res) => {
    try {
      const { lenderName, leadId } = req.params;
      const files = req.body.files; // Array of { name, type, fileContentBase64 }

      const result = await LenderManager.uploadFilesToLender(
        lenderName,
        leadId,
        files,
      );
      res.json({ success: true, data: result });
    } catch (error) {
      console.error(
        "\x1b[31m[LENDERS ERROR]\x1b[0m",
        new Date().toISOString(),
        `Upload files to ${req.params.lenderName}:`,
        error.message,
      );
      res.status(500).json({ success: false, error: error.message });
    }
  },
);

module.exports = router;
