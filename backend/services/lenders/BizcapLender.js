/**
 * BizcapLender - Bizcap API Integration
 * API Documentation: https://docs.bizcap.com.au/
 * Base URL: https://bizmate.fasttask.net/api/v1
 */
const BaseLender = require("./BaseLender");

class BizcapLender extends BaseLender {
  constructor() {
    super({
      name: "bizcap", // Internal identifier (hidden from users)
      displayName:
        process.env.BIZCAP_DISPLAY_NAME || "Business Finance Partner", // User-facing name
      apiBaseUrl: "https://bizmate.fasttask.net/api/v1",
      apiKey: process.env.BIZCAP_API_KEY || "",
      enabled: process.env.BIZCAP_ENABLED !== "false",
      timeout: 30000,
    });

    // Partner credentials
    this.partnerId = process.env.BIZCAP_PARTNER_ID || "";
    this.partnerContactId = process.env.BIZCAP_PARTNER_CONTACT_ID || "";
    this.referralUrl = process.env.BIZCAP_REFERRAL_URL || "";
  }

  /**
   * Make authenticated API request
   */
  async makeRequest(method, endpoint, data = null) {
    const url = `${this.apiBaseUrl}${endpoint}`;

    const options = {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
    };

    if (data && (method === "POST" || method === "PATCH")) {
      options.body = JSON.stringify(data);
    }

    try {
      // Log request details
      console.log("\x1b[36m%s\x1b[0m", "═".repeat(60));
      console.log(
        "\x1b[36m%s\x1b[0m",
        `📤 API REQUEST - ${this.name.toUpperCase()}`,
      );
      console.log("\x1b[36m%s\x1b[0m", "═".repeat(60));
      console.log("\x1b[33m%s\x1b[0m", `🔗 ${method} ${url}`);
      if (data) {
        console.log("\x1b[33m%s\x1b[0m", `📦 Request Body:`);
        console.log(JSON.stringify(data, null, 2));
      }

      const response = await fetch(url, options);
      const responseData = await response.json();

      // Log response details
      console.log("\x1b[32m%s\x1b[0m", "─".repeat(60));
      console.log(
        "\x1b[32m%s\x1b[0m",
        `📥 API RESPONSE - Status: ${response.status}`,
      );
      console.log("\x1b[32m%s\x1b[0m", "─".repeat(60));
      console.log(JSON.stringify(responseData, null, 2));
      console.log("\x1b[36m%s\x1b[0m", "═".repeat(60));

      if (!response.ok) {
        const error = new Error(
          responseData.error || `HTTP ${response.status}`,
        );
        error.response = { status: response.status, data: responseData };
        throw error;
      }

      return responseData;
    } catch (error) {
      // Re-throw with additional context
      if (!error.response) {
        error.response = { status: 0, data: { error: error.message } };
      }
      throw error;
    }
  }

  /**
   * Submit a lead to Bizcap
   * POST /LEAD/new
   */
  async submitLead(applicationData) {
    if (!this.isEnabled()) {
      this.logWarning(
        "submitLead",
        "Bizcap integration is disabled or API key not configured",
      );
      return null;
    }

    const endpoint = "/LEAD/new";
    const mappedData = this.mapApplicationToLenderFormat(applicationData);

    try {
      const response = await this.makeRequest("POST", endpoint, mappedData);
      this.logSuccess("submitLead", "Lead submitted successfully", response);
      return this.mapLenderResponseToInternal(response);
    } catch (error) {
      this.logError("submitLead", error, { endpoint, requestBody: mappedData });
      throw error;
    }
  }

  /**
   * Get a lead by ID
   * GET /LEAD/{leadid}
   */
  async getLead(leadId) {
    if (!this.isEnabled()) {
      this.logWarning("getLead", "Bizcap integration is disabled");
      return null;
    }

    const endpoint = `/LEAD/${leadId}`;

    try {
      const response = await this.makeRequest("GET", endpoint);
      this.logSuccess("getLead", `Retrieved lead ${leadId}`, response);
      return this.mapLeadResponseToInternal(response);
    } catch (error) {
      this.logError("getLead", error, { endpoint });
      throw error;
    }
  }

  /**
   * Get list of leads
   * GET /LEAD?page={page}&pageSize={pageSize}
   */
  async getLeads(page = 1, pageSize = 100) {
    if (!this.isEnabled()) {
      this.logWarning("getLeads", "Bizcap integration is disabled");
      return [];
    }

    const endpoint = `/LEAD?page=${page}&pageSize=${pageSize}`;

    try {
      const response = await this.makeRequest("GET", endpoint);
      this.logSuccess("getLeads", `Retrieved ${response.length || 0} leads`);
      return Array.isArray(response)
        ? response.map((lead) => this.mapLeadResponseToInternal(lead))
        : [];
    } catch (error) {
      this.logError("getLeads", error, { endpoint });
      throw error;
    }
  }

  /**
   * Update a lead
   * PATCH /LEAD/{leadid}
   */
  async updateLead(leadId, updateData) {
    if (!this.isEnabled()) {
      this.logWarning("updateLead", "Bizcap integration is disabled");
      return null;
    }

    const endpoint = `/LEAD/${leadId}`;
    const mappedData = { fields: updateData };

    try {
      const response = await this.makeRequest("PATCH", endpoint, mappedData);
      this.logSuccess("updateLead", `Updated lead ${leadId}`, response);
      return response;
    } catch (error) {
      this.logError("updateLead", error, { endpoint, requestBody: mappedData });
      throw error;
    }
  }

  /**
   * Get a deal by ID
   * GET /DEAL/{dealid}
   */
  async getDeal(dealId) {
    if (!this.isEnabled()) {
      this.logWarning("getDeal", "Bizcap integration is disabled");
      return null;
    }

    const endpoint = `/DEAL/${dealId}`;

    try {
      const response = await this.makeRequest("GET", endpoint);
      this.logSuccess("getDeal", `Retrieved deal ${dealId}`, response);
      return this.mapDealResponseToInternal(response);
    } catch (error) {
      this.logError("getDeal", error, { endpoint });
      throw error;
    }
  }

  /**
   * Get list of deals
   * GET /DEAL?page={page}&pageSize={pageSize}
   */
  async getDeals(page = 1, pageSize = 100) {
    if (!this.isEnabled()) {
      this.logWarning("getDeals", "Bizcap integration is disabled");
      return [];
    }

    const endpoint = `/DEAL?page=${page}&pageSize=${pageSize}`;

    try {
      const response = await this.makeRequest("GET", endpoint);
      this.logSuccess("getDeals", `Retrieved ${response.length || 0} deals`);
      return Array.isArray(response)
        ? response.map((deal) => this.mapDealResponseToInternal(deal))
        : [];
    } catch (error) {
      this.logError("getDeals", error, { endpoint });
      throw error;
    }
  }

  /**
   * Upload files to a lead
   * POST /attachments/new (form-data)
   */
  async uploadFiles(leadId, files) {
    if (!this.isEnabled()) {
      this.logWarning("uploadFiles", "Bizcap integration is disabled");
      return null;
    }

    const url = `${this.apiBaseUrl}/attachments/new`;

    try {
      // Create FormData for file upload
      const FormData = require("form-data");
      const formData = new FormData();

      formData.append("entityType", "LEAD");
      formData.append("entityId", leadId);

      files.forEach((file, index) => {
        formData.append(
          `attachments[${index}][type]`,
          file.type || "Bank Statements",
        );
        formData.append(
          `attachments[${index}][fileName]`,
          file.fileName || file.name,
        );
        formData.append(`attachments[${index}][file]`, file.buffer, file.name);
      });

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          ...formData.getHeaders(),
        },
        body: formData,
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || `HTTP ${response.status}`);
      }

      this.logSuccess(
        "uploadFiles",
        `Uploaded ${files.length} file(s) to lead ${leadId}`,
      );
      return responseData;
    } catch (error) {
      this.logError("uploadFiles", error, {
        endpoint: "/attachments/new",
        leadId,
      });
      throw error;
    }
  }

  /**
   * Map internal application data to Bizcap format
   */
  mapApplicationToLenderFormat(applicationData) {
    // Map funding purpose to Bizcap loan purpose
    const loanPurposeMap = {
      Growth: "Expansion & Growth",
      Cashflow: "Working Capital / Cashflow",
      Refinancing: "Paying off a Business Debt",
      "Asset Finance": "Equipment Purchase",
      Other: "Other",
    };

    // Map business type to homeowner (if available)
    const homeOwnerValue =
      applicationData.homeowner === "Yes"
        ? "Yes"
        : applicationData.homeowner === "No"
          ? "No"
          : undefined;

    // Calculate business start if trading years is available
    let businessStartDate = null;
    if (applicationData.trading_months || applicationData.tradingMonths) {
      const months =
        applicationData.trading_months || applicationData.tradingMonths;
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);
      businessStartDate = startDate.toISOString().split("T")[0];
    }

    return {
      fields: {
        // Required fields
        brokerId: this.partnerId,
        brokerRepId: this.partnerContactId,
        callClientOrBroker: "Call Client",
        companyName:
          applicationData.business_name ||
          applicationData.businessName ||
          "Not Provided",
        firstName:
          applicationData.contact_first_name ||
          applicationData.firstName ||
          "Not Provided",
        lastName:
          applicationData.contact_last_name ||
          applicationData.lastName ||
          "Not Provided",

        // Optional fields
        email:
          applicationData.contact_email || applicationData.email || undefined,
        phone:
          applicationData.contact_phone || applicationData.phone || undefined,
        amountRequested:
          parseFloat(
            applicationData.funding_amount || applicationData.fundingAmount,
          ) || undefined,
        averageMonthlyTurnover: applicationData.annual_turnover
          ? parseFloat(applicationData.annual_turnover) / 12
          : undefined,
        loanPurpose:
          loanPurposeMap[
            applicationData.funding_purpose || applicationData.fundingPurpose
          ] || "Other",
        homeOwner: homeOwnerValue,
        businessStartDate: businessStartDate || undefined,

        // UK specific (CRN - Company Registration Number)
        crn: applicationData.companyNumber || undefined,

        // Date of birth
        dateOfBirth: applicationData.dateOfBirth || undefined,

        // Partner reference - link back to our system
        partnerLeadReferenceId: applicationData.id
          ? String(applicationData.id)
          : undefined,

        // Notes
        notes: `Submitted via Pellopay platform. Funding purpose: ${applicationData.funding_purpose || applicationData.fundingPurpose}. Priority: ${applicationData.importance || "Not specified"}.`,
      },
    };
  }

  /**
   * Map Bizcap lead response to internal format
   */
  mapLeadResponseToInternal(response) {
    if (!response) return null;

    return {
      lender: "bizcap",
      lenderLeadId: response.id,
      createdAt: response.createdAt,
      updatedAt: response.updatedAt,
      status: response.fields?.status || "New",
      subStatus: response.fields?.subStatus,

      // Application links from Bizcap
      bankStatementsLink: response.fields?.bankStatementsUpdateLink,
      applicationLink: response.fields?.applicationLink,

      // Partner reference (our internal ID)
      internalReferenceId: response.fields?.partnerLeadReferenceId,

      // Contact info
      firstName: response.fields?.firstName,
      lastName: response.fields?.lastName,
      companyName: response.fields?.companyName,
      email: response.fields?.email,
      phone: response.fields?.phone,

      // Deal info
      amountRequested: response.fields?.amountRequested,
      loanPurpose: response.fields?.loanPurpose,

      // Raw response for debugging
      _raw: response,
    };
  }

  /**
   * Map Bizcap deal response to internal format
   */
  mapDealResponseToInternal(response) {
    if (!response) return null;

    return {
      lender: "bizcap",
      lenderDealId: response.id,
      createdAt: response.createdAt,
      updatedAt: response.updatedAt,
      status: response.fields?.status || "Unknown",
      subStatus: response.fields?.subStatus,

      // Company info
      name: response.fields?.name,
      customerName: response.fields?.customer?.name,

      // Broker info
      broker: response.fields?.broker?.name,

      // Loan details
      amount: response.fields?.amount,
      loanType: response.fields?.loanType,

      // Links
      bankStatementsLink:
        response.fields?.bankStatementsCreditsSenseLink ||
        response.fields?.bankStatementsUpdateLink,
      applicationLink: response.fields?.applicationLink,

      // Partner reference
      internalReferenceId: response.fields?.partnerLeadReferenceId,

      // Offer details (if approved)
      offerDetails: {
        numberOfPayments: response.fields?.omNumberOfPayments,
        paybackAmount: response.fields?.omPaybackAmount,
        termDays: response.fields?.omTermDays,
        collectionFrequency: response.fields?.omCollectionFrequency,
        principalAmount: response.fields?.omPrincipalAmount,
        advanceId: response.fields?.omAdvanceID,
        dateFunded: response.fields?.omDateFunded,
        advanceType: response.fields?.omAdvanceType,
      },

      // Raw response
      _raw: response,
    };
  }

  /**
   * Alias for mapLeadResponseToInternal (for consistency)
   */
  mapLenderResponseToInternal(response) {
    return this.mapLeadResponseToInternal(response);
  }

  /**
   * Soft Inquiry - Submit lead and retrieve full status
   * This creates a real lead in Bizcap but returns immediate feedback
   *
   * Flow:
   * 1. Submit lead to Bizcap
   * 2. Retrieve lead details for initial status
   * 3. Check if converted to deal (unlikely for immediate response)
   * 4. Return structured response with links and status
   */
  async softInquiry(applicationData) {
    if (!this.isEnabled()) {
      this.logWarning(
        "softInquiry",
        "Bizcap integration is disabled or API key not configured",
      );
      return {
        success: false,
        error: "Lender integration not available",
        lender: this.getDisplayName(),
      };
    }

    console.log("\x1b[35m%s\x1b[0m", "═".repeat(60));
    console.log(
      "\x1b[35m%s\x1b[0m",
      `🔍 SOFT INQUIRY - ${this.getDisplayName()}`,
    );
    console.log("\x1b[35m%s\x1b[0m", "═".repeat(60));

    try {
      // Step 1: Submit the lead
      const endpoint = "/LEAD/new";
      const mappedData = this.mapApplicationToLenderFormat(applicationData);

      console.log("\x1b[33m%s\x1b[0m", "📤 Submitting lead to Bizcap...");
      const submitResponse = await this.makeRequest(
        "POST",
        endpoint,
        mappedData,
      );

      if (!submitResponse || !submitResponse.id) {
        throw new Error("Invalid response from Bizcap - no lead ID returned");
      }

      const leadId = submitResponse.id;
      console.log("\x1b[32m%s\x1b[0m", `✅ Lead created: ${leadId}`);

      // Step 2: Retrieve full lead details
      console.log("\x1b[33m%s\x1b[0m", "📥 Retrieving lead details...");
      const leadDetails = await this.makeRequest("GET", `/LEAD/${leadId}`);

      // Step 3: Check if already converted to deal (rare for immediate)
      let dealDetails = null;
      const convertedDealId = leadDetails?.fields?.convertedDealId;

      if (convertedDealId) {
        console.log(
          "\x1b[32m%s\x1b[0m",
          `🎉 Lead converted to deal: ${convertedDealId}`,
        );
        try {
          dealDetails = await this.makeRequest(
            "GET",
            `/DEAL/${convertedDealId}`,
          );
        } catch (dealError) {
          console.log(
            "\x1b[33m%s\x1b[0m",
            "⚠️ Could not fetch deal details yet",
          );
        }
      }

      // Step 4: Build structured response
      const result = {
        success: true,
        lender: this.getDisplayName(),
        lenderKey: "bizcap",

        // Lead info
        leadId: leadId,
        status: leadDetails?.fields?.status || "New",
        subStatus: leadDetails?.fields?.subStatus || "Received",

        // Application links from Bizcap
        links: {
          application:
            submitResponse.fields?.applicationLink ||
            leadDetails?.fields?.applicationLink,
          bankStatements:
            submitResponse.fields?.bankStatementsUpdateLink ||
            leadDetails?.fields?.bankStatementsUpdateLink,
        },

        // Request details reflected back
        requestDetails: {
          companyName: leadDetails?.fields?.companyName,
          amountRequested: leadDetails?.fields?.amountRequested,
          loanPurpose: leadDetails?.fields?.loanPurpose,
        },

        // Deal/Offer info (if available)
        offer: dealDetails
          ? {
              dealId: convertedDealId,
              status: dealDetails.fields?.status,
              amount: dealDetails.fields?.amount,
              terms: {
                numberOfPayments: dealDetails.fields?.omNumberOfPayments,
                paybackAmount: dealDetails.fields?.omPaybackAmount,
                termDays: dealDetails.fields?.omTermDays,
                collectionFrequency: dealDetails.fields?.omCollectionFrequency,
                principalAmount: dealDetails.fields?.omPrincipalAmount,
              },
            }
          : null,

        // Estimated info (based on typical Bizcap terms)
        estimates: {
          approvalTime: "24-48 hours",
          rateRange: "0.9% - 3.5% monthly",
          termRange: "3 - 24 months",
          minAmount: "£5,000",
          maxAmount: "£500,000",
        },

        // Message for user
        message: convertedDealId
          ? "Great news! Your application has been fast-tracked for approval."
          : "Your application has been submitted. Bizcap will review and contact you within 24-48 hours.",

        // Timestamps
        submittedAt: new Date().toISOString(),
      };

      console.log("\x1b[32m%s\x1b[0m", "═".repeat(60));
      console.log(
        "\x1b[32m%s\x1b[0m",
        `✅ SOFT INQUIRY COMPLETE - Lead ID: ${leadId}`,
      );
      console.log("\x1b[32m%s\x1b[0m", "═".repeat(60));

      return result;
    } catch (error) {
      console.log("\x1b[31m%s\x1b[0m", "═".repeat(60));
      console.log("\x1b[31m%s\x1b[0m", `❌ SOFT INQUIRY FAILED`);
      console.log("\x1b[31m%s\x1b[0m", `Error: ${error.message}`);
      console.log("\x1b[31m%s\x1b[0m", "═".repeat(60));

      return {
        success: false,
        lender: this.getDisplayName(),
        lenderKey: "bizcap",
        error: error.message,
        estimates: {
          approvalTime: "24-48 hours",
          rateRange: "0.9% - 3.5% monthly",
          termRange: "3 - 24 months",
          minAmount: "£5,000",
          maxAmount: "£500,000",
        },
        message:
          "We couldn't complete the inquiry at this time. Please try again or contact support.",
      };
    }
  }

  /**
   * Check inquiry status - Get updated status for a previously submitted lead
   */
  async checkInquiryStatus(leadId) {
    if (!this.isEnabled()) {
      return { success: false, error: "Lender integration not available" };
    }

    try {
      // Get lead details
      const leadDetails = await this.makeRequest("GET", `/LEAD/${leadId}`);

      // Check for deal conversion
      let dealDetails = null;
      const convertedDealId = leadDetails?.fields?.convertedDealId;

      if (convertedDealId) {
        try {
          dealDetails = await this.makeRequest(
            "GET",
            `/DEAL/${convertedDealId}`,
          );
        } catch (e) {
          // Deal not accessible yet
        }
      }

      return {
        success: true,
        lender: this.getDisplayName(),
        leadId: leadId,
        status: leadDetails?.fields?.status || "Unknown",
        subStatus: leadDetails?.fields?.subStatus,
        convertedToDeal: !!convertedDealId,
        dealId: convertedDealId || null,

        // Offer details if deal exists
        offer: dealDetails
          ? {
              status: dealDetails.fields?.status,
              amount: dealDetails.fields?.amount,
              terms: {
                numberOfPayments: dealDetails.fields?.omNumberOfPayments,
                paybackAmount: dealDetails.fields?.omPaybackAmount,
                termDays: dealDetails.fields?.omTermDays,
                principalAmount: dealDetails.fields?.omPrincipalAmount,
              },
            }
          : null,

        updatedAt: leadDetails?.updatedAt,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        leadId: leadId,
      };
    }
  }
}

// Export singleton instance
module.exports = new BizcapLender();
