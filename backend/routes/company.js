/**
 * Company Routes - Company lookup and search
 * Uses MyPulse API for CRN lookup and Companies House API for name search
 */
const express = require("express");
const router = express.Router();
const MyPulseLender = require("../services/lenders/MyPulseLender");

// Companies House API key (optional - for name search)
const COMPANIES_HOUSE_API_KEY = process.env.COMPANIES_HOUSE_API_KEY || "";

/**
 * Lookup company by CRN using MyPulse API
 * GET /api/company/lookup/:crn
 */
router.get("/lookup/:crn", async (req, res) => {
  try {
    const { crn } = req.params;

    if (!crn || !/^[A-Za-z0-9]{6,8}$/.test(crn)) {
      return res.status(400).json({
        success: false,
        error: "Invalid CRN format. Should be 6-8 alphanumeric characters.",
      });
    }

    // Check if MyPulse is enabled
    if (!MyPulseLender.isEnabled()) {
      return res.status(503).json({
        success: false,
        error: "Company lookup service is not configured",
      });
    }

    // Lookup company using MyPulse API
    const company = await MyPulseLender.getCompanyDetails(crn.toUpperCase());

    if (!company) {
      return res.status(404).json({
        success: false,
        error: "Company not found",
      });
    }

    res.json({
      success: true,
      company: {
        crn: company.crn,
        name: company.name,
        status: company.status,
        type: company.type,
        incorporationDate: company.incorporationDate,
        address: company.address,
        sicCode: company.sicCode,
        sicDescription: company.sicDescription,
        employees: company.employees,
      },
    });
  } catch (error) {
    console.error("Company lookup error:", error);

    // Handle specific error codes
    if (error.response?.status === 404) {
      return res.status(404).json({
        success: false,
        error: "Company not found with this CRN",
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || "Failed to lookup company",
    });
  }
});

/**
 * Get company officers/directors by CRN
 * GET /api/company/officers/:crn
 */
router.get("/officers/:crn", async (req, res) => {
  try {
    const { crn } = req.params;

    if (!crn || !/^[A-Za-z0-9]{6,8}$/.test(crn)) {
      return res.status(400).json({
        success: false,
        error: "Invalid CRN format",
      });
    }

    if (!MyPulseLender.isEnabled()) {
      return res.status(503).json({
        success: false,
        error: "Company lookup service is not configured",
      });
    }

    const officers = await MyPulseLender.getCompanyOfficers(crn.toUpperCase());

    res.json({
      success: true,
      officers: officers?.data || [],
    });
  } catch (error) {
    console.error("Officers lookup error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to lookup officers",
    });
  }
});

/**
 * Search companies by name using Companies House API
 * GET /api/company/search?q=company+name
 */
router.get("/search", async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        error: "Search query must be at least 2 characters",
      });
    }

    // Check if Companies House API key is configured
    if (!COMPANIES_HOUSE_API_KEY) {
      // Fallback: Return empty with instruction
      return res.json({
        success: true,
        companies: [],
        message:
          "Company name search requires Companies House API key configuration",
      });
    }

    // Search using Companies House API
    const searchUrl = `https://api.company-information.service.gov.uk/search/companies?q=${encodeURIComponent(q)}&items_per_page=${limit}`;

    const response = await fetch(searchUrl, {
      headers: {
        Authorization: `Basic ${Buffer.from(COMPANIES_HOUSE_API_KEY + ":").toString("base64")}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Companies House API error: ${response.status}`);
    }

    const data = await response.json();

    // Map to simplified format
    const companies = (data.items || []).map((item) => ({
      crn: item.company_number,
      name: item.title,
      status: item.company_status,
      type: item.company_type,
      incorporationDate: item.date_of_creation,
      address: item.address_snippet,
    }));

    res.json({
      success: true,
      companies,
      total: data.total_results || companies.length,
    });
  } catch (error) {
    console.error("Company search error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to search companies",
    });
  }
});

/**
 * Combined search - searches by name or CRN
 * POST /api/company/find
 */
router.post("/find", async (req, res) => {
  try {
    const { query, type = "auto" } = req.body;

    if (!query || query.length < 2) {
      return res.status(400).json({
        success: false,
        error: "Query must be at least 2 characters",
      });
    }

    // Determine if query is a CRN (alphanumeric, 6-8 chars) or company name
    const isCRN =
      type === "crn" || (type === "auto" && /^[A-Za-z0-9]{6,8}$/.test(query));

    if (isCRN) {
      // Lookup by CRN using MyPulse
      if (!MyPulseLender.isEnabled()) {
        return res.status(503).json({
          success: false,
          error: "Company lookup service is not configured",
        });
      }

      const company = await MyPulseLender.getCompanyDetails(
        query.toUpperCase(),
      );

      if (!company) {
        return res.status(404).json({
          success: false,
          error: "Company not found",
        });
      }

      return res.json({
        success: true,
        type: "crn",
        companies: [
          {
            crn: company.crn,
            name: company.name,
            status: company.status,
            type: company.type,
            incorporationDate: company.incorporationDate,
            address: company.address?.registered || company.address?.trading,
          },
        ],
      });
    } else {
      // Search by name using Companies House API
      if (!COMPANIES_HOUSE_API_KEY) {
        return res.json({
          success: true,
          type: "name",
          companies: [],
          message: "Company name search requires Companies House API key",
        });
      }

      const searchUrl = `https://api.company-information.service.gov.uk/search/companies?q=${encodeURIComponent(query)}&items_per_page=10`;

      const response = await fetch(searchUrl, {
        headers: {
          Authorization: `Basic ${Buffer.from(COMPANIES_HOUSE_API_KEY + ":").toString("base64")}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const data = await response.json();

      const companies = (data.items || []).map((item) => ({
        crn: item.company_number,
        name: item.title,
        status: item.company_status,
        type: item.company_type,
        incorporationDate: item.date_of_creation,
        address: item.address_snippet,
      }));

      return res.json({
        success: true,
        type: "name",
        companies,
        total: data.total_results || companies.length,
      });
    }
  } catch (error) {
    console.error("Company find error:", error);

    if (error.response?.status === 404) {
      return res.status(404).json({
        success: false,
        error: "Company not found",
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || "Failed to find company",
    });
  }
});

module.exports = router;
