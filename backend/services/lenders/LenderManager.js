/**
 * LenderManager - Manages all lender integrations
 * Provides a unified interface to interact with multiple lenders
 */

// Import all lender services
const BizcapLender = require("./BizcapLender");
const MyPulseLender = require("./MyPulseLender");

class LenderManager {
  constructor() {
    // Register all lenders
    this.lenders = {
      bizcap: BizcapLender,
      mypulse: MyPulseLender,
      // Add more lenders here as needed:
      // prospa: ProspaLender,
      // ondeck: OnDeckLender,
      // etc.
    };
  }

  /**
   * Get a specific lender by name
   */
  getLender(lenderName) {
    const lender = this.lenders[lenderName.toLowerCase()];
    if (!lender) {
      throw new Error(`Lender '${lenderName}' not found`);
    }
    return lender;
  }

  /**
   * Get all enabled lenders
   */
  getEnabledLenders() {
    return Object.entries(this.lenders)
      .filter(([name, lender]) => lender.isEnabled())
      .map(([name, lender]) => ({
        name, // Internal identifier (hidden from users)
        displayName: lender.getDisplayName(), // User-facing name
      }));
  }

  /**
   * Get all lenders (including disabled)
   */
  getAllLenders() {
    return Object.entries(this.lenders).map(([name, lender]) => ({
      name, // Internal identifier (hidden from users)
      displayName: lender.getDisplayName(), // User-facing name
      enabled: lender.isEnabled(),
    }));
  }

  /**
   * Submit application to a specific lender
   */
  async submitToLender(lenderName, applicationData) {
    const lender = this.getLender(lenderName);
    return await lender.submitLead(applicationData);
  }

  /**
   * Submit application to all enabled lenders
   * Returns results from all lenders
   */
  async submitToAllLenders(applicationData) {
    const results = {};
    const enabledLenders = this.getEnabledLenders();

    for (const { name } of enabledLenders) {
      try {
        const lender = this.getLender(name);
        results[name] = {
          success: true,
          data: await lender.submitLead(applicationData),
        };
      } catch (error) {
        results[name] = {
          success: false,
          error: error.message,
        };
      }
    }

    return results;
  }

  /**
   * Get leads from a specific lender
   */
  async getLeadsFromLender(lenderName, page = 1, pageSize = 100) {
    const lender = this.getLender(lenderName);
    return await lender.getLeads(page, pageSize);
  }

  /**
   * Get a specific lead from a lender
   */
  async getLeadFromLender(lenderName, leadId) {
    const lender = this.getLender(lenderName);
    return await lender.getLead(leadId);
  }

  /**
   * Get deals from a specific lender
   */
  async getDealsFromLender(lenderName, page = 1, pageSize = 100) {
    const lender = this.getLender(lenderName);
    return await lender.getDeals(page, pageSize);
  }

  /**
   * Get a specific deal from a lender
   */
  async getDealFromLender(lenderName, dealId) {
    const lender = this.getLender(lenderName);
    return await lender.getDeal(dealId);
  }

  /**
   * Get deals from all enabled lenders
   */
  async getDealsFromAllLenders(page = 1, pageSize = 100) {
    const results = {};
    const enabledLenders = this.getEnabledLenders();

    for (const { name } of enabledLenders) {
      try {
        const lender = this.getLender(name);
        results[name] = {
          success: true,
          data: await lender.getDeals(page, pageSize),
        };
      } catch (error) {
        results[name] = {
          success: false,
          error: error.message,
        };
      }
    }

    return results;
  }

  /**
   * Update a lead with a specific lender
   */
  async updateLeadWithLender(lenderName, leadId, updateData) {
    const lender = this.getLender(lenderName);
    return await lender.updateLead(leadId, updateData);
  }

  /**
   * Upload files to a lead with a specific lender
   */
  async uploadFilesToLender(lenderName, leadId, files) {
    const lender = this.getLender(lenderName);
    return await lender.uploadFiles(leadId, files);
  }

  /**
   * Soft inquiry to a specific lender
   * Submits lead and returns real response with status/links
   */
  async softInquiry(lenderName, applicationData) {
    const lender = this.getLender(lenderName);
    if (!lender.softInquiry) {
      throw new Error(`Lender '${lenderName}' does not support soft inquiry`);
    }
    return await lender.softInquiry(applicationData);
  }

  /**
   * Soft inquiry to all enabled lenders
   * Returns real responses from all lenders
   */
  async softInquiryAll(applicationData) {
    const results = [];
    const enabledLenders = this.getEnabledLenders();

    for (const { name, displayName } of enabledLenders) {
      try {
        const lender = this.getLender(name);
        if (lender.softInquiry) {
          const result = await lender.softInquiry(applicationData);
          results.push(result);
        } else {
          // Lender doesn't support soft inquiry - return estimate
          results.push({
            success: true,
            lender: displayName,
            lenderKey: name,
            status: "Estimated",
            message:
              "This lender does not support instant quotes. Apply to get a real offer.",
            estimates: {
              approvalTime: "24-72 hours",
              rateRange: "Varies",
            },
          });
        }
      } catch (error) {
        results.push({
          success: false,
          lender: displayName,
          lenderKey: name,
          error: error.message,
        });
      }
    }

    return results;
  }

  /**
   * Check inquiry status for a lead
   */
  async checkInquiryStatus(lenderName, leadId) {
    const lender = this.getLender(lenderName);
    if (!lender.checkInquiryStatus) {
      throw new Error(
        `Lender '${lenderName}' does not support status checking`,
      );
    }
    return await lender.checkInquiryStatus(leadId);
  }
}

// Export singleton instance
module.exports = new LenderManager();
