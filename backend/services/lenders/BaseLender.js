/**
 * BaseLender - Abstract base class for all lender integrations
 * All lender services should extend this class
 */
class BaseLender {
  constructor(config = {}) {
    this.name = config.name || "Unknown Lender"; // Internal identifier (hidden from users)
    this.displayName = config.displayName || config.name || "Funding Partner"; // User-facing name
    this.apiBaseUrl = config.apiBaseUrl || "";
    this.apiKey = config.apiKey || "";
    this.enabled = config.enabled !== false;
    this.timeout = config.timeout || 30000; // 30 seconds default
  }

  /**
   * Get internal lender name (for API/backend use)
   */
  getName() {
    return this.name;
  }

  /**
   * Get user-facing display name (shown to users)
   */
  getDisplayName() {
    return this.displayName;
  }

  /**
   * Check if lender is enabled
   */
  isEnabled() {
    return this.enabled && this.apiKey;
  }

  /**
   * Log error with terminal notification (colorized)
   */
  logError(method, error, context = {}) {
    const timestamp = new Date().toISOString();
    console.error("\x1b[31m%s\x1b[0m", "═".repeat(60));
    console.error("\x1b[31m%s\x1b[0m", `❌ LENDER API ERROR - ${this.name}`);
    console.error("\x1b[31m%s\x1b[0m", "═".repeat(60));
    console.error("\x1b[33m%s\x1b[0m", `📅 Timestamp: ${timestamp}`);
    console.error("\x1b[33m%s\x1b[0m", `📍 Method: ${method}`);
    console.error("\x1b[33m%s\x1b[0m", `🔗 API URL: ${this.apiBaseUrl}`);
    if (context.endpoint) {
      console.error("\x1b[33m%s\x1b[0m", `📌 Endpoint: ${context.endpoint}`);
    }
    if (context.requestBody) {
      console.error(
        "\x1b[36m%s\x1b[0m",
        `📤 Request Body: ${JSON.stringify(context.requestBody, null, 2)}`,
      );
    }
    console.error("\x1b[31m%s\x1b[0m", `❗ Error: ${error.message || error}`);
    if (error.response) {
      console.error(
        "\x1b[31m%s\x1b[0m",
        `📥 Response Status: ${error.response.status}`,
      );
      console.error(
        "\x1b[31m%s\x1b[0m",
        `📥 Response Data: ${JSON.stringify(error.response.data || {})}`,
      );
    }
    console.error("\x1b[31m%s\x1b[0m", "═".repeat(60));
  }

  /**
   * Log success with terminal notification (colorized)
   */
  logSuccess(method, message, data = null) {
    const timestamp = new Date().toISOString();
    console.log("\x1b[32m%s\x1b[0m", "═".repeat(60));
    console.log("\x1b[32m%s\x1b[0m", `✅ LENDER API SUCCESS - ${this.name}`);
    console.log("\x1b[32m%s\x1b[0m", "═".repeat(60));
    console.log("\x1b[33m%s\x1b[0m", `📅 Timestamp: ${timestamp}`);
    console.log("\x1b[33m%s\x1b[0m", `📍 Method: ${method}`);
    console.log("\x1b[32m%s\x1b[0m", `✨ ${message}`);
    if (data && data.id) {
      console.log("\x1b[36m%s\x1b[0m", `🆔 ID: ${data.id}`);
    }
    console.log("\x1b[32m%s\x1b[0m", "═".repeat(60));
  }

  /**
   * Log warning with terminal notification (colorized)
   */
  logWarning(method, message) {
    const timestamp = new Date().toISOString();
    console.warn("\x1b[33m%s\x1b[0m", "═".repeat(60));
    console.warn("\x1b[33m%s\x1b[0m", `⚠️  LENDER API WARNING - ${this.name}`);
    console.warn("\x1b[33m%s\x1b[0m", "═".repeat(60));
    console.warn("\x1b[33m%s\x1b[0m", `📅 Timestamp: ${timestamp}`);
    console.warn("\x1b[33m%s\x1b[0m", `📍 Method: ${method}`);
    console.warn("\x1b[33m%s\x1b[0m", `⚠️  ${message}`);
    console.warn("\x1b[33m%s\x1b[0m", "═".repeat(60));
  }

  // ============================================
  // Abstract methods - must be implemented by subclasses
  // ============================================

  /**
   * Submit a lead/application to the lender
   * @param {Object} applicationData - The funding application data
   * @returns {Promise<Object>} - Response with lead ID and links
   */
  async submitLead(applicationData) {
    throw new Error(`submitLead not implemented for ${this.name}`);
  }

  /**
   * Get a lead by ID
   * @param {string} leadId - The lender's lead ID
   * @returns {Promise<Object>} - Lead details
   */
  async getLead(leadId) {
    throw new Error(`getLead not implemented for ${this.name}`);
  }

  /**
   * Get list of leads with pagination
   * @param {number} page - Page number
   * @param {number} pageSize - Number of items per page
   * @returns {Promise<Array>} - List of leads
   */
  async getLeads(page = 1, pageSize = 100) {
    throw new Error(`getLeads not implemented for ${this.name}`);
  }

  /**
   * Update a lead
   * @param {string} leadId - The lender's lead ID
   * @param {Object} updateData - Fields to update
   * @returns {Promise<Object>} - Updated lead
   */
  async updateLead(leadId, updateData) {
    throw new Error(`updateLead not implemented for ${this.name}`);
  }

  /**
   * Get a deal by ID
   * @param {string} dealId - The lender's deal ID
   * @returns {Promise<Object>} - Deal details
   */
  async getDeal(dealId) {
    throw new Error(`getDeal not implemented for ${this.name}`);
  }

  /**
   * Get list of deals with pagination
   * @param {number} page - Page number
   * @param {number} pageSize - Number of items per page
   * @returns {Promise<Array>} - List of deals
   */
  async getDeals(page = 1, pageSize = 100) {
    throw new Error(`getDeals not implemented for ${this.name}`);
  }

  /**
   * Upload files/documents to a lead
   * @param {string} leadId - The lender's lead ID
   * @param {Array} files - Array of file objects
   * @returns {Promise<Object>} - Upload response
   */
  async uploadFiles(leadId, files) {
    throw new Error(`uploadFiles not implemented for ${this.name}`);
  }

  /**
   * Map internal application data to lender's format
   * @param {Object} applicationData - Internal funding application
   * @returns {Object} - Lender-formatted data
   */
  mapApplicationToLenderFormat(applicationData) {
    throw new Error(
      `mapApplicationToLenderFormat not implemented for ${this.name}`,
    );
  }

  /**
   * Map lender response to internal format
   * @param {Object} lenderResponse - Response from lender API
   * @returns {Object} - Internal format
   */
  mapLenderResponseToInternal(lenderResponse) {
    throw new Error(
      `mapLenderResponseToInternal not implemented for ${this.name}`,
    );
  }
}

module.exports = BaseLender;
