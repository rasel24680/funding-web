/**
 * MyPulseLender - MyPulse Lending API Integration
 * API Documentation: https://mypulse.io/docs/api/lending-api
 * Sandbox URL: https://demo-api.mypulse-sandbox.io
 * Production URL: https://prod-api.mypulse.io
 */
const BaseLender = require("./BaseLender");

class MyPulseLender extends BaseLender {
  constructor() {
    const isProduction = process.env.MYPULSE_ENVIRONMENT === "production";
    const baseUrl = isProduction
      ? "https://prod-api.mypulse.io"
      : "https://demo-api.mypulse-sandbox.io";

    super({
      name: "mypulse", // Internal identifier (hidden from users)
      displayName: process.env.MYPULSE_DISPLAY_NAME || "SME Finance Partner", // User-facing name
      apiBaseUrl: baseUrl,
      apiKey: process.env.MYPULSE_SUBSCRIPTION_KEY || "",
      enabled: process.env.MYPULSE_ENABLED !== "false",
      timeout: 30000,
    });

    // OAuth credentials
    this.clientId = process.env.MYPULSE_CLIENT_ID || "";
    this.clientSecret = process.env.MYPULSE_CLIENT_SECRET || "";
    this.scope = process.env.MYPULSE_SCOPE || "";
    this.subscriptionKey = process.env.MYPULSE_SUBSCRIPTION_KEY || "";

    // Token management
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  /**
   * Check if lender is properly configured
   */
  isEnabled() {
    return (
      this.enabled && this.clientId && this.clientSecret && this.subscriptionKey
    );
  }

  /**
   * Get OAuth 2.0 access token
   * Token is valid for 60 minutes
   */
  async getAccessToken() {
    // Return cached token if still valid (with 5 min buffer)
    if (
      this.accessToken &&
      this.tokenExpiry &&
      Date.now() < this.tokenExpiry - 300000
    ) {
      return this.accessToken;
    }

    const tokenUrl = `${this.apiBaseUrl}/authorization/oauth2/v2.0/token`;

    const params = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: this.clientId,
      client_secret: this.clientSecret,
      scope: this.scope,
    });

    try {
      console.log("\x1b[35m%s\x1b[0m", "═".repeat(60));
      console.log(
        "\x1b[35m%s\x1b[0m",
        `🔐 OAUTH TOKEN REQUEST - ${this.name.toUpperCase()}`,
      );
      console.log("\x1b[35m%s\x1b[0m", "═".repeat(60));
      console.log("\x1b[33m%s\x1b[0m", `🔗 POST ${tokenUrl}`);

      const response = await fetch(tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });

      const data = await response.json();

      if (!response.ok) {
        console.log(
          "\x1b[31m%s\x1b[0m",
          `❌ Token request failed: ${response.status}`,
        );
        console.log(JSON.stringify(data, null, 2));
        throw new Error(
          data.error_description ||
            data.error ||
            `Token request failed: ${response.status}`,
        );
      }

      this.accessToken = data.access_token;
      // Token expires in 60 minutes (3600 seconds)
      this.tokenExpiry = Date.now() + (data.expires_in || 3600) * 1000;

      console.log(
        "\x1b[32m%s\x1b[0m",
        `✅ Token acquired, expires in ${data.expires_in || 3600}s`,
      );
      console.log("\x1b[35m%s\x1b[0m", "═".repeat(60));

      return this.accessToken;
    } catch (error) {
      this.logError("getAccessToken", error, { endpoint: tokenUrl });
      throw error;
    }
  }

  /**
   * Make authenticated API request
   */
  async makeRequest(method, endpoint, data = null) {
    const token = await this.getAccessToken();
    const url = `${this.apiBaseUrl}${endpoint}`;

    const options = {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "Ocp-Apim-Subscription-Key": this.subscriptionKey,
      },
    };

    if (data && (method === "POST" || method === "PATCH" || method === "PUT")) {
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
          responseData.message ||
            responseData.error ||
            `HTTP ${response.status}`,
        );
        error.response = { status: response.status, data: responseData };
        throw error;
      }

      return responseData;
    } catch (error) {
      if (!error.response) {
        error.response = { status: 0, data: { error: error.message } };
      }
      throw error;
    }
  }

  /**
   * Create a loan application
   * POST /v1/Create-Application
   */
  async submitLead(applicationData) {
    if (!this.isEnabled()) {
      this.logWarning(
        "submitLead",
        "MyPulse integration is disabled or credentials not configured",
      );
      return null;
    }

    const endpoint = "/v1/Create-Application";
    const mappedData = this.mapApplicationToLenderFormat(applicationData);

    try {
      const response = await this.makeRequest("POST", endpoint, mappedData);
      this.logSuccess(
        "submitLead",
        "Application submitted successfully",
        response,
      );
      return this.mapLenderResponseToInternal(response);
    } catch (error) {
      this.logError("submitLead", error, { endpoint, requestBody: mappedData });
      throw error;
    }
  }

  /**
   * Get application status
   * GET /v1/Application-Status/{application_id}
   */
  async getApplicationStatus(applicationId) {
    if (!this.isEnabled()) {
      this.logWarning(
        "getApplicationStatus",
        "MyPulse integration is disabled",
      );
      return null;
    }

    const endpoint = `/v1/Application-Status/${applicationId}`;

    try {
      const response = await this.makeRequest("GET", endpoint);
      this.logSuccess(
        "getApplicationStatus",
        `Retrieved status for ${applicationId}`,
        response,
      );
      return this.mapStatusResponseToInternal(response);
    } catch (error) {
      this.logError("getApplicationStatus", error, { endpoint });
      throw error;
    }
  }

  /**
   * Alias for getApplicationStatus (for consistency with other lenders)
   */
  async getLead(applicationId) {
    return await this.getApplicationStatus(applicationId);
  }

  /**
   * Get company details by CRN
   * GET /v1/get-company-details/{Company-CRN}
   */
  async getCompanyDetails(crn) {
    if (!this.isEnabled()) {
      this.logWarning("getCompanyDetails", "MyPulse integration is disabled");
      return null;
    }

    const endpoint = `/v1/get-company-details/${crn}`;

    try {
      const response = await this.makeRequest("GET", endpoint);
      this.logSuccess(
        "getCompanyDetails",
        `Retrieved company ${crn}`,
        response,
      );
      return this.mapCompanyResponseToInternal(response);
    } catch (error) {
      this.logError("getCompanyDetails", error, { endpoint });
      throw error;
    }
  }

  /**
   * Get company officers/directors by CRN
   * GET /v1/get-officers/{Company-CRN}
   */
  async getCompanyOfficers(crn) {
    if (!this.isEnabled()) {
      this.logWarning("getCompanyOfficers", "MyPulse integration is disabled");
      return null;
    }

    const endpoint = `/v1/get-officers/${crn}`;

    try {
      const response = await this.makeRequest("GET", endpoint);
      this.logSuccess(
        "getCompanyOfficers",
        `Retrieved officers for ${crn}`,
        response,
      );
      return response;
    } catch (error) {
      this.logError("getCompanyOfficers", error, { endpoint });
      throw error;
    }
  }

  /**
   * Map company details response to internal format
   */
  mapCompanyResponseToInternal(response) {
    // Handle array or nested response
    const data =
      response?.data ||
      (Array.isArray(response) ? response[0]?.data : response);

    if (!data) {
      return null;
    }

    return {
      crn: data.Company_CRN,
      name: data.Company_Name,
      status: data.Company_Status,
      type: data.Company_Type,
      incorporationDate: data.Incorporation_Date,
      address: {
        line1: data.Address_Line1,
        line2: data.Address_Line2,
        city: data.City,
        country: data.Country,
        postcode: data.Postal_Code,
        registered: data.Registered_Address,
        trading: data.Trading_Address,
      },
      sicCode: data.Sic_Code,
      sicDescription: data.Sic_Code_Description,
      employees: data.No_Of_Employees,
      accounts: {
        lastFiledDate: data.Last_Filed_Accounts_Date,
        nextDue: data.Accounts_Next_Due,
        type: data.Last_Accounts_Type,
      },
      raw: data,
    };
  }

  /**
   * Soft inquiry - submit application and return status
   */
  async softInquiry(applicationData) {
    if (!this.isEnabled()) {
      return {
        success: false,
        lender: this.getDisplayName(),
        lenderKey: this.name,
        error: "MyPulse integration is not configured",
      };
    }

    // Validate application data first
    const validation = this.validateApplicationData(applicationData);
    if (!validation.valid) {
      console.log("\x1b[33m%s\x1b[0m", "═".repeat(60));
      console.log("\x1b[33m%s\x1b[0m", `⚠️ MYPULSE VALIDATION FAILED`);
      console.log(
        "\x1b[33m%s\x1b[0m",
        `Errors: ${validation.errors.join(", ")}`,
      );
      console.log("\x1b[33m%s\x1b[0m", "═".repeat(60));

      return {
        success: false,
        lender: this.getDisplayName(),
        lenderKey: this.name,
        error: `Validation failed: ${validation.errors.join("; ")}`,
        validationErrors: validation.errors,
      };
    }

    try {
      // Submit the application
      const submitResult = await this.submitLead(applicationData);

      if (!submitResult || !submitResult.applicationId) {
        return {
          success: false,
          lender: this.getDisplayName(),
          lenderKey: this.name,
          error: "Failed to create application",
        };
      }

      return {
        success: true,
        lender: this.getDisplayName(),
        lenderKey: this.name,
        applicationId: submitResult.applicationId,
        status: submitResult.status || "Submitted",
        message:
          submitResult.message ||
          "Your application has been submitted to our funding partner for review.",
        links: submitResult.links || {},
        estimates: {
          rateRange: "Competitive rates",
          termRange: "Flexible terms",
          approvalTime: "24-48 hours",
        },
      };
    } catch (error) {
      console.log("\x1b[31m%s\x1b[0m", "═".repeat(60));
      console.log("\x1b[31m%s\x1b[0m", `❌ SOFT INQUIRY FAILED`);
      console.log("\x1b[31m%s\x1b[0m", `Error: ${error.message}`);
      console.log("\x1b[31m%s\x1b[0m", "═".repeat(60));

      return {
        success: false,
        lender: this.getDisplayName(),
        lenderKey: this.name,
        error: error.message || "Failed to submit application",
      };
    }
  }

  /**
   * Check inquiry status
   */
  async checkInquiryStatus(applicationId) {
    try {
      const status = await this.getApplicationStatus(applicationId);

      return {
        success: true,
        lender: this.getDisplayName(),
        lenderKey: this.name,
        applicationId: applicationId,
        status: status.status,
        loanOffer: status.loanOffer || null,
        message: this.getStatusMessage(status.status),
      };
    } catch (error) {
      return {
        success: false,
        lender: this.getDisplayName(),
        lenderKey: this.name,
        applicationId: applicationId,
        error: error.message,
      };
    }
  }

  /**
   * Get human-readable status message
   */
  getStatusMessage(status) {
    const messages = {
      Decline:
        "Unfortunately, the lender was unable to make an offer at this time.",
      "Pre-Approved":
        "You have received a tentative offer! Final terms are subject to verification.",
      Approved: "Congratulations! Your loan has been approved.",
      Payout: "Your loan has been funded and paid out.",
      InProgress:
        "Your application is being reviewed. We'll notify you when there's an update.",
    };
    return messages[status] || "Application status updated.";
  }

  /**
   * Map internal application data to MyPulse API format
   * Validates and transforms data to meet MyPulse API requirements
   */
  mapApplicationToLenderFormat(data) {
    // Parse address if provided as string
    const parseAddress = (address) => {
      if (!address) return {};
      if (typeof address === "object") return address;

      // Simple address parsing - can be enhanced
      const parts = address.split(",").map((p) => p.trim());
      return {
        street: parts[0] || "",
        town: parts[1] || "",
        postcode: parts[parts.length - 1] || "",
      };
    };

    const addressParts = parseAddress(data.address);

    // Calculate business start date from trading years/months
    let businessStartDate = null;
    if (data.tradingYears || data.tradingMonths) {
      const totalMonths =
        (parseInt(data.tradingYears) || 0) * 12 +
        (parseInt(data.tradingMonths) || 0);
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - totalMonths);
      businessStartDate = startDate.toISOString().split("T")[0];
    }

    // Parse annual turnover
    let turnover = 0;
    if (data.annualTurnover) {
      const turnoverStr = String(data.annualTurnover).replace(/[£$,]/g, "");
      if (turnoverStr.includes("-")) {
        // Range like "100000-250000" - take lower value
        turnover = parseInt(turnoverStr.split("-")[0]) || 0;
      } else if (turnoverStr.includes("+")) {
        // Like "1000000+"
        turnover = parseInt(turnoverStr.replace("+", "")) || 0;
      } else {
        turnover = parseInt(turnoverStr) || 0;
      }
    }

    // Parse funding amount - cap at £500,000 (MyPulse max)
    let loanAmount = 0;
    if (data.fundingAmount) {
      const amountStr = String(data.fundingAmount).replace(/[£$,]/g, "");
      if (amountStr.includes("-")) {
        const [min, max] = amountStr.split("-").map((v) => parseInt(v) || 0);
        loanAmount = Math.round((min + max) / 2);
      } else {
        loanAmount = parseInt(amountStr) || 0;
      }
    }
    // Cap at MyPulse maximum
    const MYPULSE_MAX_LOAN = 500000;
    if (loanAmount > MYPULSE_MAX_LOAN) {
      loanAmount = MYPULSE_MAX_LOAN;
    }

    // Validate and format first/last name (letters only, no numbers)
    const formatName = (name) => {
      if (!name) return "";
      // Remove numbers and special characters, keep letters, spaces, hyphens, apostrophes
      return name.replace(/[^a-zA-Z\s\-']/g, "").trim();
    };

    const firstName = formatName(data.firstName);
    const lastName = formatName(data.lastName);

    // Format phone number for UK (must be 10-11 digits)
    let phoneNumber = this.formatPhoneNumber(data.phone || "");
    // Ensure it's 10-11 digits, pad with leading zeros if needed
    if (phoneNumber.length < 10) {
      phoneNumber = phoneNumber.padStart(10, "0");
    }
    if (phoneNumber.length > 11) {
      phoneNumber = phoneNumber.substring(0, 11);
    }

    // Format date of birth (YYYY-MM-DD required by MyPulse API)
    let dobFormatted = "";
    if (data.dateOfBirth) {
      const dob = new Date(data.dateOfBirth);
      if (!isNaN(dob.getTime())) {
        const day = String(dob.getDate()).padStart(2, "0");
        const month = String(dob.getMonth() + 1).padStart(2, "0");
        const year = dob.getFullYear();
        dobFormatted = `${year}-${month}-${day}`;
      }
    }
    // If no DOB, we need to throw an error or set a placeholder
    if (!dobFormatted && data.dob) {
      dobFormatted = data.dob; // Already formatted
    }

    // Get companies house ID
    const companiesHouseId =
      data.companyNumber || data.companiesHouseId || data.crn || "";

    // Build address object - API requires either house_number/flat_number OR house_name
    const houseNum = data.houseNumber || addressParts.houseNumber || "";
    const applicantAddress = {
      house_number: houseNum,
      flat_number: data.flatNumber || addressParts.flatNumber || "",
      house_name: data.houseName || addressParts.houseName || "",
      street: data.street || addressParts.street || "",
      town: data.town || addressParts.town || "",
      postcode: data.postcode || addressParts.postcode || "",
      residential_status:
        data.homeowner === "Yes" || data.homeowner === true
          ? "Owner"
          : "Tenant",
    };

    // Build request body
    const requestBody = {
      application: {
        consent_to_search: data.consentToSearch !== false, // Default true if not specified
      },
      applicant: {
        first_name: firstName,
        last_name: lastName,
        email: data.email || "",
        phone_number: phoneNumber,
        address: [applicantAddress],
        date_of_birth: dobFormatted,
        percent_of_control: data.percentOfControl || 100,
        role: data.role || "Director",
        guarantor: true, // Applicant must be a guarantor
        send_ob_link: data.sendOpenBankingLink !== false,
        send_oa_link: data.sendOpenAccountingLink !== false,
      },
      // Directors array must include at least the applicant as director
      directors: [
        {
          first_name: firstName,
          last_name: lastName,
          email: data.email || "",
          phone_number: phoneNumber,
          address: [applicantAddress],
          date_of_birth: dobFormatted,
          percent_of_control: data.percentOfControl || 100,
          role: data.role || "Director",
          guarantor: true,
          send_ob_link: false,
          send_oa_link: false,
        },
      ],
      company: {
        company_name: data.businessName || data.companyName || "",
        companies_house_id: companiesHouseId,
        last_12_months_turnover: turnover,
        loan_amount: loanAmount,
        loan_term: data.loanTerm || 12, // Default 12 months
        additional_information: this.buildNotes(data),
      },
    };

    // Add additional directors if provided
    if (
      data.directors &&
      Array.isArray(data.directors) &&
      data.directors.length > 0
    ) {
      data.directors.forEach((director) => {
        const dirFirstName = formatName(director.firstName);
        const dirLastName = formatName(director.lastName);
        if (dirFirstName && dirLastName) {
          requestBody.directors.push({
            first_name: dirFirstName,
            last_name: dirLastName,
            email: director.email || "",
            phone_number: this.formatPhoneNumber(director.phone || ""),
            address: [
              {
                house_number: director.houseNumber || "",
                flat_number: director.flatNumber || "",
                house_name: director.houseName || "",
                street: director.street || "",
                town: director.town || "",
                postcode: director.postcode || "",
                residential_status:
                  director.homeowner === "Yes" ? "Owner" : "Tenant",
              },
            ],
            date_of_birth: director.dateOfBirth || "",
            percent_of_control: director.percentOfControl || 0,
            role: director.role || "Director",
            guarantor: director.guarantor || false,
            send_ob_link: false,
            send_oa_link: false,
          });
        }
      });
    }

    return requestBody;
  }

  /**
   * Validate application data before submission
   * Returns { valid: boolean, errors: string[] }
   */
  validateApplicationData(data) {
    const errors = [];

    // Validate name (letters only)
    const nameRegex = /^[a-zA-Z\s\-']+$/;
    if (!data.firstName || !nameRegex.test(data.firstName)) {
      errors.push("First name must contain only letters");
    }
    if (!data.lastName || !nameRegex.test(data.lastName)) {
      errors.push("Last name must contain only letters");
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!data.email || !emailRegex.test(data.email)) {
      errors.push("Valid email address is required");
    }

    // Validate phone (10-11 digits after formatting)
    const phone = this.formatPhoneNumber(data.phone || "");
    if (phone.length < 10 || phone.length > 11) {
      errors.push("Phone number must be 10-11 digits");
    }

    // Validate date of birth (required)
    if (!data.dateOfBirth && !data.dob) {
      errors.push("Date of birth is required");
    }

    // Validate companies house ID (required)
    if (!data.companyNumber && !data.companiesHouseId && !data.crn) {
      errors.push("Companies House registration number is required");
    }

    // Validate address - either house_number/flat_number or house_name is required
    if (!data.houseNumber && !data.flatNumber && !data.houseName) {
      errors.push("Either house/flat number or house name is required");
    }
    if (!data.street) {
      errors.push("Street is required");
    }
    if (!data.town) {
      errors.push("Town/City is required");
    }
    if (!data.postcode) {
      errors.push("Postcode is required");
    }

    // Validate funding amount (MyPulse requires minimum £3,000)
    if (!data.fundingAmount || data.fundingAmount < 3000) {
      errors.push("Funding amount must be at least £3,000 for MyPulse");
    }
    if (data.fundingAmount > 500000) {
      errors.push("MyPulse maximum loan amount is £500,000");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Format phone number for UK
   */
  formatPhoneNumber(phone) {
    if (!phone) return "";
    // Remove all non-digits
    let cleaned = phone.replace(/\D/g, "");
    // Remove leading 0 or 44
    if (cleaned.startsWith("44")) {
      cleaned = cleaned.substring(2);
    } else if (cleaned.startsWith("0")) {
      cleaned = cleaned.substring(1);
    }
    return cleaned;
  }

  /**
   * Build notes from application data
   */
  buildNotes(data) {
    const notes = [];
    notes.push(`Submitted via Pellopay/FundOnion platform.`);
    if (data.fundingPurpose) {
      notes.push(`Funding purpose: ${data.fundingPurpose}.`);
    }
    if (data.additionalInfo) {
      notes.push(data.additionalInfo);
    }
    return notes.join(" ");
  }

  /**
   * Map API response to internal format
   */
  mapLenderResponseToInternal(response) {
    // Handle array response
    const data = Array.isArray(response) ? response[0] : response;

    return {
      success: true,
      applicationId: data.application_id,
      status: data.status || "Submitted",
      message: data.message || "Application submitted successfully",
      links: {
        openBanking: data.open_banking_link || null,
      },
      raw: data,
    };
  }

  /**
   * Map status response to internal format
   */
  mapStatusResponseToInternal(response) {
    // Handle array response
    const data = Array.isArray(response) ? response[0] : response;

    const result = {
      applicationId: data.application_id,
      companyName: data.company_name,
      status: data.status,
    };

    // Include loan offer if available
    if (data.loan_offer) {
      result.loanOffer = {
        amount: data.loan_offer.amount,
        term: data.loan_offer.term,
        interestRate: data.loan_offer.interest_rate,
        repaymentType: data.loan_offer.repayment_type,
        repaymentAmount: data.loan_offer.repayment_amount,
        brokerCommission: data.loan_offer.broker_commission_amount,
      };
    }

    return result;
  }
}

// Export singleton instance
module.exports = new MyPulseLender();
