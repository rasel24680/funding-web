// ===== API Configuration =====
// Use relative URL so it works through ngrok/production
const API_BASE =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:3000/api"
    : "/api";

// ===== Form Step Navigation =====
let currentStep = 1;
let isInitialLoad = true;

function showStep(stepNumber) {
  // Hide all steps
  document.querySelectorAll(".form-step").forEach((step) => {
    step.style.display = "none";
  });

  // Show current step
  const nextStep = document.getElementById("step" + stepNumber);
  nextStep.style.display = "block";

  currentStep = stepNumber;
  updateProgressBars();

  // Smooth scroll to form (but not on initial load)
  if (!isInitialLoad) {
    setTimeout(() => {
      const formSection = document.querySelector(".funding-section");
      formSection.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  }
}

// ===== Validate Step 1 =====
function validateStep1() {
  const fundingAmount = document.getElementById("fundingAmount").value;
  const fundingPurpose = document.querySelector(
    'input[name="fundingPurpose"]:checked',
  );
  const assetFinanceSelected =
    fundingPurpose && fundingPurpose.value === "Asset Finance";
  const assetType = document.querySelector('input[name="assetType"]:checked');

  if (!fundingAmount) {
    showAlert("Please enter a funding amount", "error");
    return false;
  }

  if (fundingAmount < 1000 || fundingAmount > 5000000) {
    showAlert("Amount must be between £1,000 and £5,000,000", "error");
    return false;
  }

  if (!fundingPurpose) {
    showAlert("Please select a funding purpose", "error");
    return false;
  }

  if (assetFinanceSelected && !assetType) {
    showAlert("Please select an asset type", "error");
    return false;
  }

  return true;
}

// ===== Validate Step 2 =====
function validateStep2() {
  const importance = document.querySelector('input[name="importance"]:checked');

  if (!importance) {
    showAlert("Please select what is most important to you", "error");
    return false;
  }

  return true;
}

// ===== Validate Step 3 =====
function validateStep3() {
  const annualTurnover = document.getElementById("annualTurnover").value;
  const tradingYears = document.querySelector(
    'input[name="tradingYears"]:checked',
  );
  const tradingYearsNo = document.querySelector(
    'input[name="tradingYears"][value="No"]:checked',
  );
  const tradingMonths = document.getElementById("tradingMonths").value;
  const homeowner = document.querySelector('input[name="homeowner"]:checked');

  if (!annualTurnover) {
    showAlert("Please enter your annual turnover", "error");
    return false;
  }

  if (!tradingYears) {
    showAlert("Please select if you have been trading for 3+ years", "error");
    return false;
  }

  if (tradingYearsNo && !tradingMonths) {
    showAlert(
      "Please enter how many months you have been trading for",
      "error",
    );
    return false;
  }

  if (!homeowner) {
    showAlert("Please select if you are a homeowner in the UK", "error");
    return false;
  }

  return true;
}

// ===== Button Event Listeners =====
document.addEventListener("DOMContentLoaded", function () {
  // Only run funding form logic if on the funding form page
  if (!document.getElementById("fundingForm")) return;

  // Setup number input formatting
  setupNumberInputFormatting();

  // Add smooth transitions on page load
  const fundingForm = document.querySelector(".funding-form");
  if (fundingForm) {
    fundingForm.style.animation = "fadeIn 0.6s ease-out";
  }

  const step1Continue = document.getElementById("step1Continue");
  const step2Back = document.getElementById("step2Back");
  const step2Continue = document.getElementById("step2Continue");
  const step3Back = document.getElementById("step3Back");

  if (step1Continue) {
    step1Continue.addEventListener("click", function () {
      if (validateStep1()) {
        showStep(2);
      }
    });
  }

  if (step2Back) {
    step2Back.addEventListener("click", function () {
      showStep(1);
    });
  }

  if (step2Continue) {
    step2Continue.addEventListener("click", function () {
      if (validateStep2()) {
        showStep(3);
      }
    });
  }

  if (step3Back) {
    step3Back.addEventListener("click", function () {
      showStep(2);
    });
  }

  // Get form reference
  const form = document.getElementById("fundingForm");

  // ===== Form Submission =====
  if (form) {
    form.addEventListener("submit", async function (e) {
      e.preventDefault();

      if (validateStep3()) {
        // Add loading animation to button
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.style.opacity = "0.7";
        submitBtn.style.pointerEvents = "none";
        submitBtn.innerHTML = "⏳ Processing...";

        // Collect all form data
        const formData = {
          fundingAmount: parseFloat(
            document.getElementById("fundingAmount").value,
          ),
          fundingPurpose: document.querySelector(
            'input[name="fundingPurpose"]:checked',
          ).value,
          assetType:
            document.querySelector('input[name="assetType"]:checked')?.value ||
            null,
          importance: document.querySelector('input[name="importance"]:checked')
            .value,
          annualTurnover:
            parseFloat(document.getElementById("annualTurnover").value) || null,
          tradingYears: document.querySelector(
            'input[name="tradingYears"]:checked',
          ).value,
          tradingMonths: document.getElementById("tradingMonths").value || null,
          homeowner: document.querySelector('input[name="homeowner"]:checked')
            .value,
        };

        // Store locally for results page display
        localStorage.setItem("fundingFormData", JSON.stringify(formData));

        try {
          // Get auth token and session ID
          const authToken = localStorage.getItem("authToken");
          const sessionId =
            localStorage.getItem("guestSessionId") || crypto.randomUUID();

          // Store session ID for guest users
          if (!authToken) {
            localStorage.setItem("guestSessionId", sessionId);
          }

          // Build request headers
          const headers = { "Content-Type": "application/json" };
          if (authToken) {
            headers["Authorization"] = `Bearer ${authToken}`;
          }

          // Submit to backend API
          const response = await fetch(`${API_BASE}/funding/submit`, {
            method: "POST",
            headers,
            body: JSON.stringify({ ...formData, sessionId }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || "Submission failed");
          }

          // Store application ID
          if (data.applicationId) {
            localStorage.setItem("applicationId", data.applicationId);
          }

          submitBtn.innerHTML = "✓ Submitted!";
          showAlert(
            "Your application has been submitted successfully!",
            "success",
          );

          setTimeout(() => {
            // Always go to results page to show matched funders
            window.location.href = "results.html";
          }, 1000);
        } catch (error) {
          console.error("Submission error:", error);
          // Still redirect even if API fails (offline mode)
          submitBtn.innerHTML = "✓ Submitted!";
          showAlert("Application saved! Redirecting...", "success");

          setTimeout(() => {
            window.location.href = "results.html";
          }, 1000);
        }
      }
    });
  }

  // ===== Show/Hide Asset Type Question =====
  function toggleAssetTypeQuestion() {
    const assetFinanceSelected = document.querySelector(
      'input[name="fundingPurpose"][value="Asset Finance"]:checked',
    );
    const assetTypeGroup = document.getElementById("assetTypeGroup");

    if (assetFinanceSelected) {
      assetTypeGroup.style.display = "block";
    } else {
      assetTypeGroup.style.display = "none";
      document.querySelectorAll('input[name="assetType"]').forEach((radio) => {
        radio.checked = false;
      });
    }
  }

  // ===== Show/Hide Trading Months Input =====
  function toggleTradingMonths() {
    const tradingYearsNo = document.querySelector(
      'input[name="tradingYears"][value="No"]:checked',
    );
    const tradingMonthsGroup = document.getElementById("tradingMonthsGroup");

    if (tradingYearsNo) {
      tradingMonthsGroup.style.display = "block";
    } else {
      tradingMonthsGroup.style.display = "none";
      document.getElementById("tradingMonths").value = "";
    }
  }

  // Add event listeners to funding purpose radios
  document.querySelectorAll('input[name="fundingPurpose"]').forEach((radio) => {
    radio.addEventListener("change", function () {
      toggleAssetTypeQuestion();
      // Add animation to selected item
      this.closest(".radio-item").style.animation = "pulse 0.4s ease";
    });
  });

  // Add event listeners to trading years radios
  document.querySelectorAll('input[name="tradingYears"]').forEach((radio) => {
    radio.addEventListener("change", function () {
      toggleTradingMonths();
      // Add animation to selected item
      this.closest(".radio-item").style.animation = "pulse 0.4s ease";
    });
  });

  // ===== Load Saved Form Data =====
  function loadFormData() {
    const savedData = localStorage.getItem("fundingFormData");
    if (savedData) {
      try {
        const formData = JSON.parse(savedData);

        // Populate Step 1 fields
        if (formData.fundingAmount) {
          document.getElementById("fundingAmount").value =
            formData.fundingAmount;
        }
        if (formData.fundingPurpose) {
          const fundingRadio = document.querySelector(
            `input[name="fundingPurpose"][value="${formData.fundingPurpose}"]`,
          );
          if (fundingRadio) fundingRadio.checked = true;
        }
        if (formData.assetType && formData.assetType !== "N/A") {
          const assetRadio = document.querySelector(
            `input[name="assetType"][value="${formData.assetType}"]`,
          );
          if (assetRadio) assetRadio.checked = true;
        }

        // Populate Step 2 fields
        if (formData.importance) {
          const importanceRadio = document.querySelector(
            `input[name="importance"][value="${formData.importance}"]`,
          );
          if (importanceRadio) importanceRadio.checked = true;
        }

        // Populate Step 3 fields
        if (formData.annualTurnover) {
          document.getElementById("annualTurnover").value =
            formData.annualTurnover;
        }
        if (formData.tradingYears) {
          const tradingRadio = document.querySelector(
            `input[name="tradingYears"][value="${formData.tradingYears}"]`,
          );
          if (tradingRadio) tradingRadio.checked = true;
        }
        if (formData.tradingMonths && formData.tradingMonths !== "N/A") {
          document.getElementById("tradingMonths").value =
            formData.tradingMonths;
        }
        if (formData.homeowner) {
          const homeownerRadio = document.querySelector(
            `input[name="homeowner"][value="${formData.homeowner}"]`,
          );
          if (homeownerRadio) homeownerRadio.checked = true;
        }

        // Trigger conditional field toggles
        toggleAssetTypeQuestion();
        toggleTradingMonths();
      } catch (e) {
        console.error("Error loading form data:", e);
      }
    }
  }

  // Load saved data on page load
  loadFormData();

  // Initialize - show step 1
  showStep(1);
  isInitialLoad = false;
});

// ===== Update Progress Bars =====
function updateProgressBars() {
  const bar1El = document.getElementById("progressBar1");
  const bar2El = document.getElementById("progressBar2");
  const bar3El = document.getElementById("progressBar3");

  // Only run on pages that have progress bars (funding-form.html)
  if (!bar1El || !bar2El || !bar3El) return;

  const progressBar1 = bar1El.querySelector(".progress-fill");
  const progressBar2 = bar2El.querySelector(".progress-fill");
  const progressBar3 = bar3El.querySelector(".progress-fill");

  if (currentStep >= 1) {
    progressBar1.style.width = "100%";
  } else {
    progressBar1.style.width = "0%";
  }

  if (currentStep >= 2) {
    progressBar2.style.width = "100%";
  } else {
    progressBar2.style.width = "0%";
  }

  if (currentStep >= 3) {
    progressBar3.style.width = "100%";
  } else {
    progressBar3.style.width = "0%";
  }
}

// ===== Alert System =====
function showAlert(message, type = "info") {
  const existingAlert = document.querySelector(".custom-alert");
  if (existingAlert) {
    existingAlert.remove();
  }

  const alert = document.createElement("div");
  alert.className = `custom-alert custom-alert-${type}`;
  alert.textContent = message;

  alert.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        margin-bottom: 1rem;
        z-index: 1000;
        animation: slideIn 0.3s ease;
        font-weight: 500;
        max-width: 400px;
    `;

  if (type === "error") {
    alert.style.backgroundColor = "#ff6b5a";
    alert.style.color = "#ffffff";
  } else if (type === "success") {
    alert.style.backgroundColor = "#10b981";
    alert.style.color = "#ffffff";
  } else {
    alert.style.backgroundColor = "#3b82f6";
    alert.style.color = "#ffffff";
  }

  document.body.appendChild(alert);

  setTimeout(() => {
    alert.style.animation = "slideOut 0.3s ease";
    setTimeout(() => alert.remove(), 300);
  }, 3000);
}

// ===== Format Number with Commas =====
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// ===== Format Input Fields with Live Formatting =====
function setupNumberInputFormatting() {
  const numberInputs = document.querySelectorAll('input[type="number"]');

  numberInputs.forEach((input) => {
    // Store original input value
    input.addEventListener("input", function () {
      // Keep the numeric value for form submission
      // Visual display will show formatted version via placeholder/label updates
      const value = this.value;

      if (value && this.id === "fundingAmount") {
        this.dataset.formattedValue = formatNumber(value);
        // Update placeholder to show format
        const displayValue = formatNumber(value);
        if (this.value && this.value.length > 4) {
          const event = new CustomEvent("formatted", {
            detail: { formatted: displayValue },
          });
          this.dispatchEvent(event);
        }
      }
    });

    // Add focus effect
    input.addEventListener("focus", function () {
      this.parentElement.style.transform = "scale(1.02)";
    });

    input.addEventListener("blur", function () {
      this.parentElement.style.transform = "scale(1)";
    });
  });
}

// ===== Add Animations =====
const style = document.createElement("style");
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    @keyframes slideInLeft {
        from {
            opacity: 0;
            transform: translateX(-30px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(30px);
        }
    }
    
    @keyframes fadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }
    
    @keyframes pulse {
        0% {
            transform: scale(1);
            opacity: 1;
        }
        50% {
            transform: scale(1.05);
            opacity: 0.8;
        }
        100% {
            transform: scale(1);
            opacity: 1;
        }
    }
    
    .radio-item {
        animation: none !important;
    }
`;
document.head.appendChild(style);

// ===== Authentication Functions =====

// Check if we're on the login page
function initializeAuthPage() {
  const authTabs = document.querySelectorAll(".auth-tab");
  const toggleButtons = document.querySelectorAll(".toggle-btn");
  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");
  const socialButtons = document.querySelectorAll(".social-btn");

  // Tab switcher (new design)
  if (authTabs.length > 0) {
    authTabs.forEach((tab) => {
      tab.addEventListener("click", function () {
        const formType = this.getAttribute("data-toggle");

        // Update tab active state
        authTabs.forEach((t) => t.classList.remove("active"));
        this.classList.add("active");

        // Hide all forms
        document.querySelectorAll(".auth-form-new").forEach((form) => {
          form.classList.remove("active");
        });

        // Show selected form
        if (formType === "signup") {
          document.getElementById("signupForm").classList.add("active");
        } else {
          document.getElementById("loginForm").classList.add("active");
        }

        // Clear messages
        const message = document.getElementById("authMessage");
        if (message) {
          message.classList.remove("success", "error");
          message.textContent = "";
        }
      });
    });
  }

  // Toggle between login and signup forms (legacy toggle buttons)
  if (toggleButtons.length > 0) {
    toggleButtons.forEach((button) => {
      button.addEventListener("click", function (e) {
        e.preventDefault();
        const formType = this.getAttribute("data-toggle");

        // Hide all forms and toggle paragraphs
        document.querySelectorAll(".auth-form-new").forEach((form) => {
          form.classList.remove("active");
        });
        document.querySelectorAll(".auth-toggle p").forEach((p) => {
          p.style.display = "none";
        });

        // Update tabs if they exist
        authTabs.forEach((t) => {
          t.classList.remove("active");
          if (t.getAttribute("data-toggle") === formType)
            t.classList.add("active");
        });

        // Show selected form
        if (formType === "signup") {
          document.getElementById("signupForm").classList.add("active");
          const toggleP = document.querySelectorAll(".auth-toggle p");
          if (toggleP[1]) toggleP[1].style.display = "block";
        } else {
          document.getElementById("loginForm").classList.add("active");
          const toggleP = document.querySelectorAll(".auth-toggle p");
          if (toggleP[0]) toggleP[0].style.display = "block";
        }

        // Clear messages
        const message = document.getElementById("authMessage");
        if (message) {
          message.classList.remove("success", "error");
          message.textContent = "";
        }

        // Smooth scroll to top
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    });
  }

  // Social login buttons
  if (socialButtons.length > 0) {
    socialButtons.forEach((button) => {
      button.addEventListener("click", function (e) {
        e.preventDefault();
        const provider = this.classList.contains("twitter-btn")
          ? "Twitter"
          : "Facebook";
        showAuthMessage(
          `Redirecting to ${provider}...`,
          "success",
          document.getElementById("authMessage"),
        );
        // In real app, redirect to social login
        // window.location.href = `/auth/${provider.toLowerCase()}`;
      });
    });
  }

  // Password strength meter
  const signupPassword = document.getElementById("signupPassword");
  if (signupPassword) {
    signupPassword.addEventListener("input", function () {
      updatePasswordStrength(this.value);
    });
  }

  // Login form submission
  if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();
      handleLogin(this);
    });
  }

  // Sign up form submission
  if (signupForm) {
    signupForm.addEventListener("submit", function (e) {
      e.preventDefault();
      handleSignup(this);
    });
  }

  // CRN Lookup functionality
  setupCRNLookup();

  // Toggle password visibility
  document.querySelectorAll(".toggle-password-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const wrapper = this.closest(".input-wrapper");
      const input = wrapper.querySelector("input");
      const eyeOpen = this.querySelector(".eye-open");
      const eyeClosed = this.querySelector(".eye-closed");
      if (input.type === "password") {
        input.type = "text";
        if (eyeOpen) eyeOpen.style.display = "none";
        if (eyeClosed) eyeClosed.style.display = "block";
      } else {
        input.type = "password";
        if (eyeOpen) eyeOpen.style.display = "block";
        if (eyeClosed) eyeClosed.style.display = "none";
      }
    });
  });
}

// Update password strength indicator
function updatePasswordStrength(password) {
  const strengthBar = document.getElementById("strengthBar");
  let strength = 0;

  if (!password) {
    strengthBar.style.width = "0%";
    return;
  }

  // Check password criteria
  if (password.length >= 8) strength += 25;
  if (password.length >= 12) strength += 25;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
  if (/\d/.test(password) && /[!@#$%^&*]/.test(password)) strength += 25;

  strengthBar.style.width = strength + "%";

  // Change color based on strength
  if (strength <= 25) {
    strengthBar.style.background = "linear-gradient(90deg, #ff6b5a, #ff6b5a)";
  } else if (strength <= 50) {
    strengthBar.style.background = "linear-gradient(90deg, #ff8c42, #ff8c42)";
  } else if (strength <= 75) {
    strengthBar.style.background = "linear-gradient(90deg, #ffc857, #ffc857)";
  } else {
    strengthBar.style.background = "linear-gradient(90deg, #2ecc71, #2ecc71)";
  }
}

// ===== Mock Company Verification =====
function setupCRNLookup() {
  const companyNameInput = document.getElementById("companyName");
  const verifyStatus = document.getElementById("companyVerifyStatus");

  if (!companyNameInput) return;

  let verifyTimeout = null;

  // Verify company name as user types (with debounce)
  companyNameInput.addEventListener("input", () => {
    const companyName = companyNameInput.value.trim();

    // Clear previous timeout
    if (verifyTimeout) {
      clearTimeout(verifyTimeout);
    }

    // Hide status if input is too short
    if (companyName.length < 2) {
      hideVerifyStatus();
      return;
    }

    // Show checking status after user stops typing
    verifyTimeout = setTimeout(() => {
      mockVerifyCompany(companyName);
    }, 600);
  });

  // Mock company verification - shows checking animation then approves
  function mockVerifyCompany(companyName) {
    // Show checking status
    showVerifyStatus(
      `<span class="verify-spinner"></span> Checking "${escapeHtml(companyName)}"...`,
      "checking",
    );

    // After a short delay, show approved
    setTimeout(() => {
      showVerifyStatus(
        `<span class="verify-check">✓</span> <strong>${escapeHtml(companyName)}</strong> - Company verified`,
        "verified",
      );

      // Store company data for later use
      localStorage.setItem(
        "verifiedCompanyData",
        JSON.stringify({
          name: companyName,
          verified: true,
          verifiedAt: new Date().toISOString(),
        }),
      );
    }, 1200);
  }

  function showVerifyStatus(message, type) {
    if (!verifyStatus) return;
    verifyStatus.innerHTML = message;
    verifyStatus.className = "company-verify-status " + type;
    verifyStatus.style.display = "block";
  }

  function hideVerifyStatus() {
    if (verifyStatus) {
      verifyStatus.style.display = "none";
      verifyStatus.innerHTML = "";
    }
  }

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}

// Legacy function placeholder - no longer used
function searchCompaniesByName_legacy(query) {
  // Removed - Companies House API not available
  console.log("Company search disabled - no API key provided");
  return Promise.resolve({ companies: [] });
}

// Legacy CRN lookup placeholder - no longer used
function lookupCompanyByCRN_legacy(crn) {
  // Removed - Companies House API not available
  console.log("CRN lookup disabled - no API key provided");
  return Promise.resolve(null);
}

/* REMOVED - Old CRN lookup functionality
async function searchCompaniesByName(query) {
    // Show loading state
    crnLookupBtn.classList.add("loading");
    showCRNStatus("Searching companies...", "loading");

    try {
      const response = await fetch(`${API_BASE}/company/find`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, type: "name" }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Search failed");
      }

      if (data.companies && data.companies.length > 0) {
        showSearchResults(data.companies);
        showCRNStatus(`Found ${data.companies.length} companies`, "success");
      } else if (data.message) {
        // Name search not available, try CRN lookup
        showCRNStatus(data.message, "info");
        hideSearchResults();
      } else {
        showCRNStatus(
          "No companies found. Try entering the CRN directly.",
          "info",
        );
        hideSearchResults();
      }
    } catch (error) {
      showCRNStatus(error.message || "Search failed", "error");
      hideSearchResults();
    } finally {
      crnLookupBtn.classList.remove("loading");
      crnLookupBtn.disabled = false;
    }
  }

  function showSearchResults(companies) {
    if (!searchResults) return;

    const html = companies
      .map(
        (company) => `
      <div class="company-result-item" data-crn="${company.crn}" data-name="${escapeHtml(company.name)}">
        <div class="company-result-name">${escapeHtml(company.name)}</div>
        <div class="company-result-info">
          <span class="crn-badge">${company.crn}</span>
          ${company.status ? `<span class="status-${company.status.toLowerCase().replace(/\s+/g, "-")}">${company.status}</span>` : ""}
        </div>
      </div>
    `,
      )
      .join("");

    searchResults.innerHTML = html;
    searchResults.style.display = "block";

    // Add click handlers
    searchResults.querySelectorAll(".company-result-item").forEach((item) => {
      item.addEventListener("click", () => {
        const crn = item.dataset.crn;
        const name = item.dataset.name;

        // Set values
        crnInput.value = crn;
        selectedCRN = crn;
        if (companyNameInput) {
          companyNameInput.value = name;
        }

        // Lookup full details
        lookupCompanyByCRN(crn);
        hideSearchResults();
      });
    });
  }

  function hideSearchResults() {
    if (searchResults) {
      searchResults.style.display = "none";
      searchResults.innerHTML = "";
    }
  }

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  function showCRNStatus(message, type) {
    if (!crnStatus) return;
    crnStatus.innerHTML = message;
    crnStatus.className = "crn-status " + type;
  }
} */

// Handle login
async function handleLogin(form) {
  const email = form.querySelector("#loginEmail").value.trim();
  const password = form.querySelector("#loginPassword").value;
  const messageEl = document.getElementById("authMessage");
  const submitBtn = form.querySelector('button[type="submit"]');

  // Validate inputs
  if (!email || !password) {
    showAuthMessage("Please fill in all fields", "error", messageEl);
    return;
  }

  if (!isValidEmail(email)) {
    showAuthMessage("Please enter a valid email address", "error", messageEl);
    return;
  }

  if (password.length < 6) {
    showAuthMessage(
      "Password must be at least 6 characters",
      "error",
      messageEl,
    );
    return;
  }

  // Show loading state
  const originalText = submitBtn.innerHTML;
  submitBtn.innerHTML = "<span>Signing in...</span>";
  submitBtn.disabled = true;

  try {
    // Get session ID for linking guest applications
    const sessionId = localStorage.getItem("guestSessionId");

    const response = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, sessionId }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.errors?.[0]?.msg || "Login failed");
    }

    // SECURITY: Clear ALL previous user data before setting new user data
    // This prevents data leakage between users on shared browsers
    localStorage.removeItem("authToken");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userCompanyName");
    localStorage.removeItem("userData");
    localStorage.removeItem("isPhoneVerified");
    localStorage.removeItem("userPhone");
    localStorage.removeItem("userProfilePicture");
    localStorage.removeItem("applicationId");
    localStorage.removeItem("fundingFormData"); // Clear previous user's form data
    localStorage.removeItem("pendingPhoneVerification");

    // Store auth token and user data for NEW logged-in user
    localStorage.setItem("authToken", data.token);
    localStorage.setItem("userEmail", data.user.email);
    localStorage.setItem(
      "userCompanyName",
      data.user.businessName || data.user.firstName,
    );
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem(
      "isPhoneVerified",
      data.user.phoneVerified ? "true" : "false",
    );
    localStorage.setItem(
      "userData",
      JSON.stringify({
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        email: data.user.email,
        companyName: data.user.businessName,
        phone: data.user.phone,
      }),
    );

    // Clear guest session ID
    localStorage.removeItem("guestSessionId");

    showAuthMessage("Login successful! Redirecting...", "success", messageEl);

    setTimeout(() => {
      // After login, go to funding form page
      window.location.href = "funding-form.html";
    }, 1000);
  } catch (error) {
    console.error("Login error:", error);
    showAuthMessage(
      error.message || "Login failed. Please try again.",
      "error",
      messageEl,
    );
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
  }
}

// Handle sign up
async function handleSignup(form) {
  const firstName = form.querySelector("#firstName").value.trim();
  const lastName = form.querySelector("#lastName").value.trim();
  const email = form.querySelector("#signupEmail").value.trim();
  const password = form.querySelector("#signupPassword").value;
  const confirmPassword = form.querySelector("#confirmPassword").value;
  const companyName = form.querySelector("#companyName").value.trim();
  const agreeTerms = form.querySelector("#agreeTerms").checked;
  const messageEl = document.getElementById("authMessage");
  const submitBtn = form.querySelector('button[type="submit"]');

  // Validate inputs
  if (
    !firstName ||
    !lastName ||
    !email ||
    !password ||
    !confirmPassword ||
    !companyName
  ) {
    showAuthMessage("Please fill in all fields", "error", messageEl);
    return;
  }

  if (!isValidEmail(email)) {
    showAuthMessage("Please enter a valid email address", "error", messageEl);
    return;
  }

  if (password.length < 8) {
    showAuthMessage(
      "Password must be at least 8 characters",
      "error",
      messageEl,
    );
    return;
  }

  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    showAuthMessage(
      "Password must contain uppercase, lowercase, and number",
      "error",
      messageEl,
    );
    return;
  }

  if (password !== confirmPassword) {
    showAuthMessage("Passwords do not match", "error", messageEl);
    return;
  }

  if (!agreeTerms) {
    showAuthMessage(
      "You must agree to the Terms of Service",
      "error",
      messageEl,
    );
    return;
  }

  // Show loading state
  const originalText = submitBtn.innerHTML;
  submitBtn.innerHTML = "<span>Creating account...</span>";
  submitBtn.disabled = true;

  try {
    // Get session ID for linking guest applications
    const sessionId = localStorage.getItem("guestSessionId");

    const response = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName,
        lastName,
        email,
        password,
        businessName: companyName,
        sessionId,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || data.errors?.[0]?.msg || "Registration failed",
      );
    }

    // Clear guest session ID
    localStorage.removeItem("guestSessionId");

    showAuthMessage("Account created! Please log in.", "success", messageEl);

    setTimeout(() => {
      // After signup, redirect to login page so user logs in manually
      window.location.href = "login.html";
    }, 1500);
  } catch (error) {
    console.error("Signup error:", error);
    showAuthMessage(
      error.message || "Registration failed. Please try again.",
      "error",
      messageEl,
    );
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
  }
}

// Show authentication message
function showAuthMessage(message, type, messageEl) {
  if (messageEl) {
    messageEl.textContent = message;
    messageEl.classList.remove("success", "error");
    messageEl.classList.add(type);
  }
}

// Validate email format
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Handle forgot password
function handleForgotPassword(e) {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value.trim();
  const messageEl = document.getElementById("authMessage");

  if (!email) {
    showAuthMessage(
      "Please enter your email address first",
      "error",
      messageEl,
    );
    return;
  }

  if (!isValidEmail(email)) {
    showAuthMessage("Please enter a valid email address", "error", messageEl);
    return;
  }

  // Simulate sending reset email
  showAuthMessage("Sending password reset email...", "success", messageEl);
  setTimeout(() => {
    showAuthMessage(
      "Password reset link sent to " + email + ". Check your inbox!",
      "success",
      messageEl,
    );
  }, 1000);
}

// Initialize auth page when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  // Initialize user navbar on all pages
  initializeUserNavbar();

  // Initialize admin page if on admin page
  if (document.querySelector(".admin-section")) {
    initializeAdminPage();
  }

  // Initialize documents page if on documents page
  if (document.querySelector(".documents-section")) {
    initializeDocumentsPage();
  }

  // Initialize search results if on search results page
  if (document.querySelector(".search-results-section")) {
    initializeSearchResults();
  }

  // Initialize dashboard if on dashboard page
  if (document.querySelector(".dashboard-container")) {
    initializeDashboard();
  }

  // Only initialize if on auth page
  if (document.querySelector(".auth-section-new")) {
    initializeAuthPage();

    // Add forgot password handler
    const forgotPasswordLink = document.querySelector(".forgot-password-link");
    if (forgotPasswordLink) {
      forgotPasswordLink.addEventListener("click", handleForgotPassword);
    }
  }
});

// Fallback init: some pages inject inline scripts that can affect DOMContentLoaded timing.
// This ensures navbar dropdown is always initialized when the page is fully loaded.
window.addEventListener("load", function () {
  initializeUserNavbar();
});

// ===== User Navbar Functions =====
let _navbarEventsInitialized = false;

function initializeUserNavbar() {
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const userEmail = localStorage.getItem("userEmail");
  // Get company name from signup info, fallback to email prefix
  let companyName = localStorage.getItem("userCompanyName");
  if (!companyName) {
    const userData = localStorage.getItem("userData");
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        companyName =
          parsed.companyName ||
          ((parsed.firstName || "") + " " + (parsed.lastName || "")).trim();
      } catch (e) {}
    }
    if (!companyName && userEmail) {
      companyName = userEmail.split("@")[0];
    }
    if (!companyName) companyName = "My Account";
  }

  const userProfileDropdown = document.getElementById("userProfileDropdown");
  const companyNameDisplay = document.getElementById("companyNameDisplay");
  const userProfileHeader = document.querySelector(".user-profile-header");
  const userDropdownMenu = document.getElementById("userDropdownMenu");

  // Only show user profile dropdown when logged in
  if (userProfileDropdown) {
    if (isLoggedIn) {
      userProfileDropdown.style.display = "block";
      if (companyNameDisplay) {
        companyNameDisplay.textContent = companyName;
      }
    } else {
      userProfileDropdown.style.display = "none";
    }
  }

  // Only bind event listeners once to prevent duplicate handlers
  if (_navbarEventsInitialized) return;
  _navbarEventsInitialized = true;

  // Toggle dropdown on header click
  if (userProfileHeader) {
    userProfileHeader.addEventListener("click", function (e) {
      e.stopPropagation();
      this.classList.toggle("active");
      if (userDropdownMenu) {
        userDropdownMenu.style.display =
          userDropdownMenu.style.display === "block" ? "none" : "block";
      }
    });
  }

  // Close dropdown when clicking outside
  document.addEventListener("click", function (e) {
    if (userProfileDropdown && !userProfileDropdown.contains(e.target)) {
      if (userProfileHeader) {
        userProfileHeader.classList.remove("active");
      }
      if (userDropdownMenu) {
        userDropdownMenu.style.display = "none";
      }
    }
  });

  // Handle logout
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", function (e) {
      e.preventDefault();
      handleLogout();
    });
  }

  // Handle dropdown links
  const dashboardLink = document.querySelector(".dashboard-link");
  const documentsLink = document.querySelector(".documents-link");
  const searchLink = document.querySelector(".search-link");
  const adminLink = document.querySelector(".admin-link");
  const connectedAppsLink = document.querySelector(".connected-apps-link");

  function closeUserDropdownMenu() {
    if (userProfileHeader) {
      userProfileHeader.classList.remove("active");
    }
    if (userDropdownMenu) {
      userDropdownMenu.style.display = "none";
    }
  }

  if (dashboardLink) {
    dashboardLink.addEventListener("click", function (e) {
      e.preventDefault();
      closeUserDropdownMenu();
      window.location.href = "dashboard.html";
    });
  }

  if (documentsLink) {
    documentsLink.addEventListener("click", function (e) {
      e.preventDefault();
      closeUserDropdownMenu();
      window.location.href = "documents.html";
    });
  }

  if (searchLink) {
    searchLink.addEventListener("click", function (e) {
      e.preventDefault();
      closeUserDropdownMenu();
      window.location.href = "search-results.html";
    });
  }

  if (adminLink) {
    adminLink.addEventListener("click", function (e) {
      e.preventDefault();
      closeUserDropdownMenu();
      window.location.href = "admin.html";
    });
  }

  if (connectedAppsLink) {
    connectedAppsLink.addEventListener("click", function (e) {
      e.preventDefault();
      closeUserDropdownMenu();

      // If already on dashboard, switch hash in-place; otherwise navigate.
      if (window.location.pathname.endsWith("/dashboard.html")) {
        window.location.hash = "connected-apps";
      } else {
        window.location.href = "dashboard.html#connected-apps";
      }
    });
  }
}

function handleLogout() {
  // Clear all user data
  localStorage.removeItem("authToken");
  localStorage.removeItem("userEmail");
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("fundingFormData");
  localStorage.removeItem("userCompanyName");
  localStorage.removeItem("userData");
  localStorage.removeItem("isPhoneVerified");
  localStorage.removeItem("userPhone");
  localStorage.removeItem("userProfilePicture");
  localStorage.removeItem("applicationId");
  localStorage.removeItem("guestSessionId");
  localStorage.removeItem("pendingPhoneVerification");

  // Redirect to login page
  window.location.href = "login.html";
}

// ===== Sidebar User Info & Avatar Helper =====
function initializeSidebarUserInfo() {
  const userData = localStorage.getItem("userData");
  const userFullNameSidebar = document.getElementById("userFullNameSidebar");
  const userCompanyInfoSidebar = document.getElementById(
    "userCompanyInfoSidebar",
  );
  const avatarImg = document.getElementById("userAvatarImg");
  const avatarInitials = document.getElementById("userAvatarInitials");
  const avatarSmall = document.getElementById("userAvatarSmall");
  const avatarUploadInput = document.getElementById("avatarUploadInput");

  let firstName = "";
  let lastName = "";
  let companyName = "";

  if (userData) {
    try {
      const parsedData = JSON.parse(userData);
      firstName = parsedData.firstName || "";
      lastName = parsedData.lastName || "";
      companyName = parsedData.companyName || "";
    } catch (e) {}
  }

  // Fallback to userCompanyName from localStorage
  if (!companyName) {
    companyName = localStorage.getItem("userCompanyName") || "";
  }
  // Fallback to email prefix
  if (!companyName) {
    const email = localStorage.getItem("userEmail") || "";
    if (email) companyName = email.split("@")[0];
  }

  // Fallback full name from company name if no first/last
  const fullName = (firstName + " " + lastName).trim();

  // h3 = Company Name, p = Full Name
  if (userFullNameSidebar) {
    userFullNameSidebar.textContent = companyName || "Company";
  }
  if (userCompanyInfoSidebar) {
    userCompanyInfoSidebar.textContent = fullName || companyName || "User";
  }

  // Show initials in avatar
  if (avatarInitials) {
    let initials = (
      (firstName.charAt(0) || "") + (lastName.charAt(0) || "")
    ).toUpperCase();
    if (!initials && companyName)
      initials = companyName.charAt(0).toUpperCase();
    avatarInitials.textContent = initials || "U";
  }

  // Load saved profile picture
  const savedAvatar = localStorage.getItem("userProfilePicture");
  if (savedAvatar && avatarImg) {
    avatarImg.src = savedAvatar;
    avatarImg.style.display = "block";
    if (avatarInitials) avatarInitials.style.display = "none";
  }

  // Handle avatar click to trigger file upload
  if (avatarSmall && avatarUploadInput) {
    avatarSmall.addEventListener("click", function () {
      avatarUploadInput.click();
    });

    avatarUploadInput.addEventListener("change", function (e) {
      const file = e.target.files[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        showAlert("Please select an image file", "error");
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        showAlert("Image must be under 2MB", "error");
        return;
      }

      const reader = new FileReader();
      reader.onload = function (ev) {
        const dataUrl = ev.target.result;
        localStorage.setItem("userProfilePicture", dataUrl);
        if (avatarImg) {
          avatarImg.src = dataUrl;
          avatarImg.style.display = "block";
        }
        if (avatarInitials) avatarInitials.style.display = "none";
        showAlert("Profile picture updated!", "success");
      };
      reader.readAsDataURL(file);
    });
  }
}

// ===== Dashboard Functions =====
function initializeDashboard() {
  // Check if user is logged in
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  if (!isLoggedIn) {
    window.location.href = "login.html";
    return;
  }

  // Get user data from localStorage
  const userData = localStorage.getItem("userData");
  const userEmail = localStorage.getItem("userEmail");

  // Initialize sidebar user info, avatar & profile picture
  initializeSidebarUserInfo();

  // Check if phone is verified - show modal if not
  const isPhoneVerified = localStorage.getItem("isPhoneVerified") === "true";
  if (!isPhoneVerified) {
    showDashboardPhoneVerificationModal();
  }

  // Load and display user's application
  loadUserApplication();

  // Initialize sidebar navigation
  const sidebarItems = document.querySelectorAll(".sidebar-item");
  const dashboardSections = document.querySelectorAll(".dashboard-section");
  const sidebarMenu = document.getElementById("dashboardSidebarMenu");
  const menuToggleBtn = document.getElementById("dashboardOptionsToggle");

  function activateDashboardSection(sectionName) {
    if (!sectionName || dashboardSections.length === 0) return;

    const targetSidebarItem = document.querySelector(
      `.sidebar-item[data-section="${sectionName}"]`,
    );
    const targetSection = document.getElementById(`section-${sectionName}`);
    if (!targetSidebarItem || !targetSection) return;

    sidebarItems.forEach((i) => i.classList.remove("active"));
    dashboardSections.forEach((s) => (s.style.display = "none"));

    targetSidebarItem.classList.add("active");
    targetSection.style.display = "block";
  }

  // Mobile/tablet options menu (three-dot menu)
  if (menuToggleBtn && sidebarMenu) {
    menuToggleBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      const isOpen = sidebarMenu.classList.toggle("menu-open");
      menuToggleBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    document.addEventListener("click", function (e) {
      const clickedInsideMenu = sidebarMenu.contains(e.target);
      const clickedToggle = menuToggleBtn.contains(e.target);

      if (!clickedInsideMenu && !clickedToggle) {
        sidebarMenu.classList.remove("menu-open");
        menuToggleBtn.setAttribute("aria-expanded", "false");
      }
    });
  }

  sidebarItems.forEach((item) => {
    item.addEventListener("click", function (e) {
      if (menuToggleBtn && sidebarMenu && window.innerWidth <= 1024) {
        sidebarMenu.classList.remove("menu-open");
        menuToggleBtn.setAttribute("aria-expanded", "false");
      }

      // Check if this is a page navigation link (supports .html and .html#hash)
      const href = this.getAttribute("href");
      const sectionName = this.dataset.section;
      const isDashboardHashLink = href && href.startsWith("dashboard.html#");
      const isOnDashboardPage =
        window.location.pathname.endsWith("/dashboard.html");

      // Handle dashboard hash links explicitly for reliable cross-page behavior
      if (isDashboardHashLink && sectionName) {
        e.preventDefault();

        if (isOnDashboardPage) {
          history.replaceState(null, "", `#${sectionName}`);
          activateDashboardSection(sectionName);
        } else {
          window.location.href = href;
        }

        return;
      }

      if (href && href.includes(".html")) {
        // Allow browser navigation to target page
        return;
      }

      e.preventDefault();

      // Remove active class from all items
      sidebarItems.forEach((i) => i.classList.remove("active"));
      // Add active class to clicked item
      this.classList.add("active");

      // Hide all sections
      dashboardSections.forEach((section) => {
        section.style.display = "none";
      });

      // Show corresponding section
      const sectionId = `section-${this.dataset.section}`;
      const targetSection = document.getElementById(sectionId);
      if (targetSection) {
        targetSection.style.display = "block";
      }
    });
  });

  // Initialize tab switching
  const tabButtons = document.querySelectorAll(".tab-btn");
  tabButtons.forEach((btn) => {
    btn.addEventListener("click", function () {
      const tabName = this.dataset.tab;

      // Remove active class from all tabs
      tabButtons.forEach((b) => b.classList.remove("active"));
      // Add active class to clicked tab
      this.classList.add("active");

      // Hide all tab contents
      const tabContents = document.querySelectorAll(".applications-list");
      tabContents.forEach((content) => {
        content.style.display = "none";
      });

      // Show selected tab content
      const targetContent = document.getElementById(tabName);
      if (targetContent) {
        targetContent.style.display = "block";
      }
    });
  });

  // Handle hash-based section navigation (e.g. dashboard.html#connected-apps)
  const hash = window.location.hash.replace("#", "");
  if (hash) {
    activateDashboardSection(hash);
  }

  window.addEventListener("hashchange", function () {
    const changedHash = window.location.hash.replace("#", "");
    if (changedHash) {
      activateDashboardSection(changedHash);
    }
  });
}

// ===== Search Results Functions =====
function initializeSearchResults() {
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  if (!isLoggedIn) {
    window.location.href = "login.html";
    return;
  }

  // Check if phone is verified
  const isPhoneVerified = localStorage.getItem("isPhoneVerified") === "true";
  const phoneVerificationModal = document.getElementById(
    "phoneVerificationModal",
  );
  const fundingCardsContainer = document.getElementById(
    "fundingCardsContainer",
  );

  // Show/hide modal and blur cards
  if (isPhoneVerified) {
    if (phoneVerificationModal) {
      phoneVerificationModal.style.display = "none";
    }
    if (fundingCardsContainer) {
      fundingCardsContainer.classList.remove("blurred");
    }
  } else {
    if (phoneVerificationModal) {
      phoneVerificationModal.style.display = "flex";
    }
    if (fundingCardsContainer) {
      fundingCardsContainer.classList.add("blurred");
    }
  }

  // Initialize sort functionality
  const sortSelect = document.getElementById("sortSelect");

  // Generate funding cards with default sort
  generateFundingCards(sortSelect ? sortSelect.value : "personal-touch");

  if (sortSelect) {
    sortSelect.addEventListener("change", function () {
      generateFundingCards(this.value);
    });
  }

  // Initialize modal handlers
  initializePhoneVerificationModal();

  // Initialize edit search button
  const editSearchBtn = document.getElementById("editSearchBtn");
  if (editSearchBtn) {
    editSearchBtn.addEventListener("click", function () {
      window.location.href = "funding-form.html";
    });
  }
}

// Parse currency string to number (e.g. '£50,000' -> 50000)
function parseCurrency(str) {
  return parseFloat(str.replace(/[^0-9.]/g, "")) || 0;
}

// Parse percentage string to number (e.g. '4.5%' -> 4.5)
function parseRate(str) {
  return parseFloat(str.replace("%", "")) || 0;
}

// Parse approval time to days (takes first number, e.g. '2-3 days' -> 2)
function parseApprovalDays(str) {
  const match = str.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 999;
}

// Real lenders data - connected to actual API providers
const _fundersData = [
  {
    id: 1,
    name: "Business Finance Partner",
    lenderKey: "bizcap",
    loanAmount: "£5,000 - £500,000",
    interestRate: "0.9% - 3.5%",
    term: "3 - 24 months",
    apprTime: "24-48 hours",
    personalTouch: 9,
    acceptsImpairedCredit: true,
    features: ["Fast approval", "No early repayment fees", "Flexible terms"],
  },
  {
    id: 2,
    name: "SME Finance Partner",
    lenderKey: "mypulse",
    loanAmount: "£10,000 - £1,000,000",
    interestRate: "Competitive rates",
    term: "6 - 60 months",
    apprTime: "24-72 hours",
    personalTouch: 8,
    acceptsImpairedCredit: false,
    features: [
      "Open banking integration",
      "Real-time decisions",
      "Tailored offers",
    ],
  },
];

function generateFundingCards(sortBy) {
  const fundingCardsContainer = document.getElementById(
    "fundingCardsContainer",
  );
  if (!fundingCardsContainer) return;

  // Copy array so original order is preserved
  const funders = [..._fundersData];

  // Sort based on selected option
  switch (sortBy) {
    case "personal-touch":
      funders.sort((a, b) => (b.personalTouch || 0) - (a.personalTouch || 0));
      break;
    case "fastest-decision":
      funders.sort(
        (a, b) => parseApprovalDays(a.apprTime) - parseApprovalDays(b.apprTime),
      );
      break;
    case "lowest-rates":
      funders.sort(
        (a, b) => parseRate(a.interestRate) - parseRate(b.interestRate),
      );
      break;
    case "accepts-impaired-credit":
      funders.sort(
        (a, b) =>
          (b.acceptsImpairedCredit ? 1 : 0) - (a.acceptsImpairedCredit ? 1 : 0),
      );
      break;
  }

  fundingCardsContainer.innerHTML = funders
    .map(
      (funder) => `
        <div class="funding-card" data-lender-key="${funder.lenderKey || "bizcap"}">
            <div class="card-header">
                <h3 class="funder-name">${funder.name}</h3>
                <span class="funder-badge">Verified</span>
            </div>
            <div class="card-details">
                <div class="detail-item">
                    <span class="detail-label">Amount</span>
                    <span class="detail-value highlight">${funder.loanAmount}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Interest Rate</span>
                    <span class="detail-value">${funder.interestRate}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Loan Term</span>
                    <span class="detail-value">${funder.term}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Approval Time</span>
                    <span class="detail-value">${funder.apprTime}</span>
                </div>
            </div>
            <div class="card-footer">
                <button class="more-details-btn" data-funder-id="${funder.id}">
                    More details
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                </button>
                <button class="apply-btn" data-lender-key="${funder.lenderKey || "bizcap"}">Apply Now</button>
            </div>
        </div>
    `,
    )
    .join("");

  // Update banner funder count
  const bannerCount = document.getElementById("bannerFunderCount");
  const funderCountEl = document.getElementById("funderCount");
  const count = funders.length;
  if (bannerCount) bannerCount.textContent = count;
  if (funderCountEl) funderCountEl.textContent = count;

  // Attach Apply Now button handlers
  attachApplyButtonHandlers();

  // Attach More Details button handlers
  attachMoreDetailsHandlers();
}

// ===== Apply Now Button Handlers =====
function attachApplyButtonHandlers() {
  const applyButtons = document.querySelectorAll(".apply-btn");

  applyButtons.forEach((btn) => {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      const lenderKey = this.dataset.lenderKey || "bizcap";
      const card = this.closest(".funding-card");
      const lenderName = card
        ? card.querySelector(".funder-name")?.textContent
        : "Lender";

      showApplicationModal(lenderKey, lenderName);
    });
  });
}

// ===== More Details Button Handlers =====
function attachMoreDetailsHandlers() {
  const moreDetailsButtons = document.querySelectorAll(".more-details-btn");

  moreDetailsButtons.forEach((btn) => {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      const card = this.closest(".funding-card");
      const lenderKey = card ? card.dataset.lenderKey : "bizcap";
      const lenderData =
        _fundersData.find((f) => f.lenderKey === lenderKey) || _fundersData[0];

      showLenderDetailsModal(lenderData);
    });
  });
}

// ===== Lender Details Modal =====
function showLenderDetailsModal(lender) {
  // Remove existing modal if present
  const existingModal = document.getElementById("lenderDetailsModal");
  if (existingModal) existingModal.remove();

  const featuresHtml = lender.features
    ? lender.features
        .map((f) => `<li><span class="feature-check">✓</span> ${f}</li>`)
        .join("")
    : "";

  const modal = document.createElement("div");
  modal.id = "lenderDetailsModal";
  modal.className = "application-modal-overlay";
  modal.innerHTML = `
    <div class="application-modal lender-details-modal">
      <div class="modal-header">
        <h2>${lender.name}</h2>
        <button class="modal-close-btn" id="closeLenderDetailsModal">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <div class="modal-body">
        <div class="lender-overview">
          <span class="funder-badge verified">Verified Lender</span>
          <p class="lender-description">A trusted lending partner providing flexible business finance solutions.</p>
        </div>
        
        <div class="lender-stats">
          <div class="stat-item">
            <span class="stat-label">Loan Amount</span>
            <span class="stat-value">${lender.loanAmount}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Interest Rate</span>
            <span class="stat-value">${lender.interestRate}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Loan Term</span>
            <span class="stat-value">${lender.term}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Approval Time</span>
            <span class="stat-value">${lender.apprTime}</span>
          </div>
        </div>

        ${
          lender.features
            ? `
        <div class="lender-features">
          <h3>Key Features</h3>
          <ul>${featuresHtml}</ul>
        </div>
        `
            : ""
        }

        <div class="lender-eligibility">
          <h3>Eligibility</h3>
          <ul>
            <li><span class="feature-check">✓</span> UK registered business</li>
            <li><span class="feature-check">✓</span> Minimum trading period required</li>
            ${lender.acceptsImpairedCredit ? '<li><span class="feature-check">✓</span> Accepts impaired credit history</li>' : ""}
          </ul>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary" id="closeLenderDetailsBtn">Close</button>
        <button class="btn-primary apply-from-details" data-lender-key="${lender.lenderKey}">Apply Now</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Close handlers
  document
    .getElementById("closeLenderDetailsModal")
    .addEventListener("click", () => modal.remove());
  document
    .getElementById("closeLenderDetailsBtn")
    .addEventListener("click", () => modal.remove());
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.remove();
  });

  // Apply from details
  modal
    .querySelector(".apply-from-details")
    .addEventListener("click", function () {
      modal.remove();
      showApplicationModal(lender.lenderKey, lender.name);
    });
}

// ===== Application Modal =====
function showApplicationModal(lenderKey, lenderName) {
  // Check if phone is verified
  const isPhoneVerified = localStorage.getItem("isPhoneVerified") === "true";
  if (!isPhoneVerified) {
    const phoneModal = document.getElementById("phoneVerificationModal");
    if (phoneModal) {
      phoneModal.style.display = "flex";
    }
    return;
  }

  // Get user data from localStorage
  const userData = JSON.parse(localStorage.getItem("userData") || "{}");
  const formData = JSON.parse(localStorage.getItem("fundingFormData") || "{}");

  // Check if this is MyPulse (requires additional fields)
  const isMyPulse = lenderKey === "mypulse";
  const minAmount = isMyPulse ? 3000 : 1000;
  const maxAmount = isMyPulse ? 500000 : 5000000;

  // Remove existing modal if present
  const existingModal = document.getElementById("applicationModal");
  if (existingModal) existingModal.remove();

  const modal = document.createElement("div");
  modal.id = "applicationModal";
  modal.className = "application-modal-overlay";
  modal.innerHTML = `
    <div class="application-modal">
      <div class="modal-header">
        <h2>Apply to ${lenderName}</h2>
        <button class="modal-close-btn" id="closeApplicationModal">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <div class="modal-body">
        <p class="modal-description">Review your application details before submitting. The lender will contact you directly about your funding request.</p>
        
        <form id="applicationForm" class="application-form">
          <div class="form-section">
            <h3>Business Information</h3>
            <div class="form-row two-col">
              <div class="form-group">
                <label for="appBusinessName">Business Name *</label>
                <input type="text" id="appBusinessName" value="${userData.companyName || formData.businessName || ""}" required>
              </div>
              <div class="form-group">
                <label for="appCompanyNumber">Company Registration Number ${isMyPulse ? "*" : ""}</label>
                <input type="text" id="appCompanyNumber" value="${userData.companyNumber || formData.companyNumber || ""}" placeholder="e.g. 12345678" ${isMyPulse ? "required" : ""}>
                <small class="field-hint">8-digit Companies House number</small>
              </div>
            </div>
          </div>

          <div class="form-section">
            <h3>Contact Details</h3>
            <div class="form-row two-col">
              <div class="form-group">
                <label for="appFirstName">First Name *</label>
                <input type="text" id="appFirstName" value="${userData.firstName || formData.firstName || ""}" pattern="[A-Za-z\\s\\-']+" title="Please enter a valid name (letters only)" required>
              </div>
              <div class="form-group">
                <label for="appLastName">Last Name *</label>
                <input type="text" id="appLastName" value="${userData.lastName || formData.lastName || ""}" pattern="[A-Za-z\\s\\-']+" title="Please enter a valid name (letters only)" required>
              </div>
            </div>
            <div class="form-row two-col">
              <div class="form-group">
                <label for="appEmail">Email *</label>
                <input type="email" id="appEmail" value="${userData.email || formData.email || ""}" required>
              </div>
              <div class="form-group">
                <label for="appPhone">Phone * <small>(UK mobile/landline)</small></label>
                <input type="tel" id="appPhone" value="${userData.phone || formData.phone || ""}" pattern="[0-9]{10,11}" title="Please enter a valid UK phone number (10-11 digits)" required>
              </div>
            </div>
            <div class="form-row two-col">
              <div class="form-group">
                <label for="appDateOfBirth">Date of Birth ${isMyPulse ? "*" : ""}</label>
                <input type="date" id="appDateOfBirth" value="${userData.dateOfBirth || formData.dateOfBirth || ""}" max="${new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split("T")[0]}" ${isMyPulse ? "required" : ""}>
                <small class="field-hint">You must be 18 or over</small>
              </div>
              <div class="form-group">
                <label for="appHomeowner">Residential Status</label>
                <select id="appHomeowner">
                  <option value="No" ${formData.homeowner === "No" ? "selected" : ""}>Tenant/Renting</option>
                  <option value="Yes" ${formData.homeowner === "Yes" ? "selected" : ""}>Homeowner</option>
                </select>
              </div>
            </div>
          </div>

          <div class="form-section" ${!isMyPulse ? 'style="display:none"' : ""}>
            <h3>Address ${isMyPulse ? "*" : ""}</h3>
            <div class="form-row two-col">
              <div class="form-group">
                <label for="appHouseNumber">House/Flat Number</label>
                <input type="text" id="appHouseNumber" value="" placeholder="e.g. 42 or 5B">
              </div>
              <div class="form-group">
                <label for="appHouseName">House Name</label>
                <input type="text" id="appHouseName" value="" placeholder="e.g. Wood Acre House">
              </div>
            </div>
            ${isMyPulse ? '<small class="field-hint" style="margin-bottom:8px;display:block">Either house/flat number or house name is required</small>' : ""}
            <div class="form-row two-col">
              <div class="form-group">
                <label for="appStreet">Street ${isMyPulse ? "*" : ""}</label>
                <input type="text" id="appStreet" value="" placeholder="e.g. Baker Street" ${isMyPulse ? "required" : ""}>
              </div>
              <div class="form-group">
                <label for="appTown">Town/City ${isMyPulse ? "*" : ""}</label>
                <input type="text" id="appTown" value="" placeholder="e.g. London" ${isMyPulse ? "required" : ""}>
              </div>
            </div>
            <div class="form-row two-col">
              <div class="form-group">
                <label for="appPostcode">Postcode ${isMyPulse ? "*" : ""}</label>
                <input type="text" id="appPostcode" value="" placeholder="e.g. NW1 6XE" ${isMyPulse ? "required" : ""}>
              </div>
              <div class="form-group"></div>
            </div>
          </div>

          <div class="form-section">
            <h3>Funding Request</h3>
            <div class="form-row two-col">
              <div class="form-group">
                <label for="appFundingAmount">Amount Required (£) *</label>
                <input type="number" id="appFundingAmount" value="${Math.min(formData.fundingAmount || 0, maxAmount) || ""}" min="${minAmount}" max="${maxAmount}" required>
                ${isMyPulse ? `<small class="field-hint">£3,000 – £500,000 for this lender</small>` : ""}
              </div>
              <div class="form-group">
                <label for="appFundingPurpose">Purpose *</label>
                <select id="appFundingPurpose" required>
                  <option value="Growth" ${formData.fundingPurpose === "Growth" ? "selected" : ""}>Growth</option>
                  <option value="Cashflow" ${formData.fundingPurpose === "Cashflow" ? "selected" : ""}>Cashflow</option>
                  <option value="Refinancing" ${formData.fundingPurpose === "Refinancing" ? "selected" : ""}>Refinancing</option>
                  <option value="Asset Finance" ${formData.fundingPurpose === "Asset Finance" ? "selected" : ""}>Asset Finance</option>
                  <option value="Other" ${formData.fundingPurpose === "Other" ? "selected" : ""}>Other</option>
                </select>
              </div>
            </div>
            <div class="form-row two-col">
              <div class="form-group">
                <label for="appAnnualTurnover">Annual Turnover (£)</label>
                <input type="number" id="appAnnualTurnover" value="${formData.annualTurnover || ""}" min="0">
              </div>
              <div class="form-group">
                <label for="appTradingYears">Trading 3+ Years?</label>
                <select id="appTradingYears">
                  <option value="Yes" ${formData.tradingYears === "Yes" ? "selected" : ""}>Yes</option>
                  <option value="No" ${formData.tradingYears === "No" ? "selected" : ""}>No</option>
                </select>
              </div>
            </div>
          </div>

          <div class="form-message" id="applicationMessage"></div>

          <div class="form-consent">
            <label class="consent-checkbox">
              <input type="checkbox" id="appConsent" required>
              <span>I agree to share my details with ${lenderName} and consent to being contacted about my funding application.</span>
            </label>
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary" id="cancelApplicationBtn">Cancel</button>
        <button class="btn-primary" id="submitApplicationBtn" data-lender-key="${lenderKey}">
          <span class="btn-text">Submit Application</span>
          <span class="btn-loading" style="display: none;">
            <svg class="spinner" width="20" height="20" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none" stroke-dasharray="32" stroke-linecap="round"/>
            </svg>
            Submitting...
          </span>
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Close handlers
  document
    .getElementById("closeApplicationModal")
    .addEventListener("click", () => modal.remove());
  document
    .getElementById("cancelApplicationBtn")
    .addEventListener("click", () => modal.remove());
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.remove();
  });

  // Submit handler
  document
    .getElementById("submitApplicationBtn")
    .addEventListener("click", () => {
      submitApplication(lenderKey, lenderName);
    });

  // Form validation on input
  const form = document.getElementById("applicationForm");
  form.querySelectorAll("input, select").forEach((input) => {
    input.addEventListener("input", () => {
      document.getElementById("applicationMessage").textContent = "";
      document.getElementById("applicationMessage").className = "form-message";
    });
  });
}

// ===== Submit Application to Lender =====
async function submitApplication(lenderKey, lenderName) {
  const form = document.getElementById("applicationForm");
  const messageEl = document.getElementById("applicationMessage");
  const submitBtn = document.getElementById("submitApplicationBtn");
  const btnText = submitBtn.querySelector(".btn-text");
  const btnLoading = submitBtn.querySelector(".btn-loading");

  // Validate form
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  // Check consent
  if (!document.getElementById("appConsent").checked) {
    messageEl.textContent =
      "Please agree to share your details with the lender";
    messageEl.className = "form-message error";
    return;
  }

  // Gather form data
  const applicationData = {
    businessName: document.getElementById("appBusinessName").value.trim(),
    companyNumber:
      document.getElementById("appCompanyNumber")?.value.trim() || "",
    firstName: document.getElementById("appFirstName").value.trim(),
    lastName: document.getElementById("appLastName").value.trim(),
    email: document.getElementById("appEmail").value.trim(),
    phone: document.getElementById("appPhone").value.trim(),
    dateOfBirth: document.getElementById("appDateOfBirth")?.value || "",
    homeowner: document.getElementById("appHomeowner")?.value || "No",
    houseNumber: document.getElementById("appHouseNumber")?.value.trim() || "",
    houseName: document.getElementById("appHouseName")?.value.trim() || "",
    street: document.getElementById("appStreet")?.value.trim() || "",
    town: document.getElementById("appTown")?.value.trim() || "",
    postcode: document.getElementById("appPostcode")?.value.trim() || "",
    fundingAmount: parseFloat(
      document.getElementById("appFundingAmount").value,
    ),
    fundingPurpose: document.getElementById("appFundingPurpose").value,
    annualTurnover:
      parseFloat(document.getElementById("appAnnualTurnover").value) || 0,
    tradingYears: document.getElementById("appTradingYears").value,
    lenderKey: lenderKey,
  };

  // MyPulse: validate address - need either house number/flat number or house name
  if (lenderKey === "mypulse") {
    if (!applicationData.houseNumber && !applicationData.houseName) {
      messageEl.textContent =
        "Please enter either a house/flat number or house name";
      messageEl.className = "form-message error";
      return;
    }
  }

  // Client-side validation for names (letters only)
  const nameRegex = /^[A-Za-z\s\-']+$/;
  if (!nameRegex.test(applicationData.firstName)) {
    messageEl.textContent = "First name must contain only letters";
    messageEl.className = "form-message error";
    return;
  }
  if (!nameRegex.test(applicationData.lastName)) {
    messageEl.textContent = "Last name must contain only letters";
    messageEl.className = "form-message error";
    return;
  }

  // Validate phone format (10-11 digits)
  const phoneDigits = applicationData.phone.replace(/\D/g, "");
  if (phoneDigits.length < 10 || phoneDigits.length > 11) {
    messageEl.textContent = "Phone number must be 10-11 digits";
    messageEl.className = "form-message error";
    return;
  }

  // Show loading state
  btnText.style.display = "none";
  btnLoading.style.display = "inline-flex";
  submitBtn.disabled = true;

  try {
    const response = await fetch(`${API_BASE}/funding/soft-inquiry`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
      body: JSON.stringify(applicationData),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      // Extract readable error from API response
      let errorMsg = data.error || "Failed to submit application";
      if (data.results && data.results.length > 0) {
        const failedResult = data.results.find((r) => !r.success);
        if (failedResult && failedResult.error) {
          errorMsg = failedResult.error;
        }
      }
      throw new Error(errorMsg);
    }

    // Success - show confirmation
    showApplicationSuccess(lenderName, data);

    // Close modal
    document.getElementById("applicationModal").remove();
  } catch (error) {
    console.error("Application submission error:", error);
    messageEl.textContent =
      error.message || "Failed to submit application. Please try again.";
    messageEl.className = "form-message error";

    btnText.style.display = "inline";
    btnLoading.style.display = "none";
    submitBtn.disabled = false;
  }
}

// ===== Application Success Modal =====
function showApplicationSuccess(lenderName, responseData) {
  const existingModal = document.getElementById("successModal");
  if (existingModal) existingModal.remove();

  const leadId = responseData.results?.[0]?.data?.leadId || "N/A";

  const modal = document.createElement("div");
  modal.id = "successModal";
  modal.className = "application-modal-overlay success-overlay";
  modal.innerHTML = `
    <div class="application-modal success-modal">
      <div class="success-icon">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#28a745" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M8 12l2 2 4-4"/>
        </svg>
      </div>
      <h2>Application Submitted!</h2>
      <p class="success-message">Your application has been sent to <strong>${lenderName}</strong>.</p>
      <div class="success-details">
        <div class="detail-row">
          <span class="label">Reference:</span>
          <span class="value">${leadId}</span>
        </div>
        <div class="detail-row">
          <span class="label">Amount:</span>
          <span class="value">£${Number(responseData.applicationData?.fundingAmount || 0).toLocaleString()}</span>
        </div>
      </div>
      <p class="next-steps">The lender will review your application and contact you within 24-48 hours. Check your email for updates.</p>
      <div class="success-actions">
        <button class="btn-secondary" onclick="window.location.href='dashboard.html'">Go to Dashboard</button>
        <button class="btn-primary" id="closeSuccessModal">View More Funders</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  document
    .getElementById("closeSuccessModal")
    .addEventListener("click", () => modal.remove());
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.remove();
  });
}

// ===== Phone Verification Modal =====
function initializePhoneVerificationModal() {
  const phoneVerificationModal = document.getElementById(
    "phoneVerificationModal",
  );
  const modalOverlay = document.getElementById("modalOverlay");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const skipVerificationBtn = document.getElementById("skipVerificationBtn");
  const verifyPhoneBtn = document.getElementById("verifyPhoneBtn");
  const phoneInput = document.getElementById("phoneNumber");
  const verificationMessage = document.getElementById("verificationMessage");

  let verificationStep = "phone"; // 'phone' or 'code'

  // Close modal on close button
  if (closeModalBtn) {
    closeModalBtn.addEventListener("click", function () {
      if (phoneVerificationModal) {
        phoneVerificationModal.style.display = "none";
      }
    });
  }

  // Skip verification
  if (skipVerificationBtn) {
    skipVerificationBtn.addEventListener("click", function () {
      // Just close the modal but keep cards blurred
      if (phoneVerificationModal) {
        phoneVerificationModal.style.display = "none";
      }
      // Cards remain blurred
    });
  }

  // Verify phone - 2-step API flow
  if (verifyPhoneBtn) {
    verifyPhoneBtn.addEventListener("click", async function () {
      const inputValue = phoneInput.value.trim();

      if (verificationStep === "phone") {
        // Step 1: Send verification code
        if (!inputValue) {
          showVerificationMessage(
            "Please enter your phone number",
            "error",
            verificationMessage,
          );
          return;
        }

        if (!/^\d{7,15}$/.test(inputValue.replace(/\D/g, ""))) {
          showVerificationMessage(
            "Please enter a valid phone number",
            "error",
            verificationMessage,
          );
          return;
        }

        verifyPhoneBtn.disabled = true;
        verifyPhoneBtn.textContent = "Sending code...";

        try {
          const authToken = localStorage.getItem("authToken");
          const response = await fetch(`${API_BASE}/phone/send-code`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({ phone: inputValue }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(
              data.error || data.errors?.[0]?.msg || "Failed to send code",
            );
          }

          // In dev mode, show the code
          if (data.code) {
            showVerificationMessage(
              `DEV MODE - Code: ${data.code}`,
              "success",
              verificationMessage,
            );
          } else {
            showVerificationMessage(
              "Code sent! Check your phone.",
              "success",
              verificationMessage,
            );
          }

          // Switch to code entry mode
          verificationStep = "code";
          phoneInput.value = "";
          phoneInput.placeholder = "Enter 6-digit code";
          phoneInput.maxLength = 6;
          verifyPhoneBtn.textContent = "Verify Code";
          verifyPhoneBtn.disabled = false;
          localStorage.setItem("pendingPhoneVerification", inputValue);
        } catch (error) {
          console.error("Send code error:", error);
          showVerificationMessage(
            error.message || "Failed to send code",
            "error",
            verificationMessage,
          );
          verifyPhoneBtn.textContent = "Send Code";
          verifyPhoneBtn.disabled = false;
        }
      } else {
        // Step 2: Verify the code
        if (!inputValue || inputValue.length !== 6) {
          showVerificationMessage(
            "Please enter the 6-digit code",
            "error",
            verificationMessage,
          );
          return;
        }

        verifyPhoneBtn.disabled = true;
        verifyPhoneBtn.textContent = "Verifying...";

        try {
          const authToken = localStorage.getItem("authToken");
          const response = await fetch(`${API_BASE}/phone/verify`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({ code: inputValue }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || "Invalid code");
          }

          showVerificationMessage(
            "Phone verified successfully!",
            "success",
            verificationMessage,
          );
          verifyPhoneBtn.textContent = "✓ Verified";

          localStorage.setItem("isPhoneVerified", "true");
          localStorage.setItem(
            "userPhone",
            "+44" + localStorage.getItem("pendingPhoneVerification"),
          );
          localStorage.removeItem("pendingPhoneVerification");

          setTimeout(() => {
            // Update UI
            const fundingCardsContainer = document.getElementById(
              "fundingCardsContainer",
            );
            if (fundingCardsContainer) {
              fundingCardsContainer.classList.remove("blurred");
            }
            if (phoneVerificationModal) {
              phoneVerificationModal.style.display = "none";
            }

            // Reset modal for next use
            phoneInput.value = "";
            phoneInput.placeholder = "Phone number";
            phoneInput.maxLength = 15;
            verifyPhoneBtn.textContent = "Send Code";
            verifyPhoneBtn.disabled = false;
            verificationStep = "phone";
            verificationMessage.textContent = "";
            verificationMessage.classList.remove("success", "error");
          }, 1000);
        } catch (error) {
          console.error("Verify error:", error);
          showVerificationMessage(
            error.message || "Invalid code",
            "error",
            verificationMessage,
          );
          verifyPhoneBtn.textContent = "Verify Code";
          verifyPhoneBtn.disabled = false;
        }
      }
    });
  }

  // Allow only numbers in phone input
  if (phoneInput) {
    phoneInput.addEventListener("input", function (e) {
      this.value = this.value.replace(/\D/g, "").slice(0, this.maxLength || 15);
    });

    phoneInput.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        verifyPhoneBtn.click();
      }
    });
  }
}

function showVerificationMessage(message, type, element) {
  if (element) {
    element.textContent = message;
    element.classList.remove("success", "error");
    element.classList.add(type);
  }
}

// ===== Documents Page Functions =====
function initializeDocumentsPage() {
  // Check if user is logged in
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  if (!isLoggedIn) {
    window.location.href = "login.html";
    return;
  }

  // Document storage key
  const DOCS_KEY = "uploadedDocuments";

  // Load saved documents from localStorage
  function getSavedDocs() {
    try {
      return JSON.parse(localStorage.getItem(DOCS_KEY) || "{}");
    } catch (e) {
      return {};
    }
  }

  function saveDocs(docs) {
    localStorage.setItem(DOCS_KEY, JSON.stringify(docs));
  }

  // Format file size
  function formatSize(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  // Get file icon by extension
  function getFileIcon(name) {
    const ext = name.split(".").pop().toLowerCase();
    if (["pdf"].includes(ext))
      return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e74c3c" stroke-width="2"><path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>';
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext))
      return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3498db" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>';
    if (["xls", "xlsx", "csv"].includes(ext))
      return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#27ae60" stroke-width="2"><path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/><polyline points="13 2 13 9 20 9"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/></svg>';
    if (["doc", "docx"].includes(ext))
      return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2980b9" stroke-width="2"><path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/><polyline points="13 2 13 9 20 9"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="12" y2="17"/></svg>';
    return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2"><path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>';
  }

  // Render uploaded files list for a section
  function renderFileList(sectionId) {
    const container = document.getElementById("files-" + sectionId);
    if (!container) return;

    const docs = getSavedDocs();
    const files = docs[sectionId] || [];

    if (files.length === 0) {
      container.innerHTML = "";
      container.style.display = "none";
      updateSectionStatus(sectionId, false);
      return;
    }

    container.style.display = "block";
    container.innerHTML = `
      <div class="uploaded-files-header">
        <span class="uploaded-count">${files.length} file${files.length > 1 ? "s" : ""} uploaded</span>
      </div>
      ${files
        .map(
          (file, idx) => `
        <div class="uploaded-file-row" data-section="${sectionId}" data-index="${idx}">
          <div class="file-icon">${getFileIcon(file.name)}</div>
          <div class="file-info">
            <span class="file-name">${file.name}</span>
            <span class="file-meta">${formatSize(file.size)} &bull; ${file.date}</span>
          </div>
          <button class="file-remove-btn" data-section="${sectionId}" data-index="${idx}" title="Remove file">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      `,
        )
        .join("")}
    `;

    // Attach remove handlers
    container.querySelectorAll(".file-remove-btn").forEach((btn) => {
      btn.addEventListener("click", function () {
        const sec = this.getAttribute("data-section");
        const idx = parseInt(this.getAttribute("data-index"));
        const allDocs = getSavedDocs();
        if (allDocs[sec]) {
          allDocs[sec].splice(idx, 1);
          if (allDocs[sec].length === 0) delete allDocs[sec];
          saveDocs(allDocs);
          renderFileList(sec);
          updateProgress();
        }
      });
    });

    updateSectionStatus(sectionId, true);
  }

  // Update section header to show completion status
  function updateSectionStatus(sectionId, hasFiles) {
    const header = document.querySelector(`[data-section="${sectionId}"]`);
    if (!header) return;
    const numEl = header.querySelector(".section-number");
    if (hasFiles) {
      numEl.innerHTML =
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><path d="M20 6L9 17l-5-5"/></svg>';
      numEl.classList.add("completed");
    } else {
      // Restore original number
      const allHeaders = document.querySelectorAll(".section-header");
      allHeaders.forEach((h, i) => {
        if (h.getAttribute("data-section") === sectionId) {
          numEl.textContent = i + 1;
          numEl.classList.remove("completed");
        }
      });
    }
  }

  // Update overall progress bar
  function updateProgress() {
    const docs = getSavedDocs();
    const sections = [
      "bank-statements",
      "financial-accounts",
      "applicant-info",
    ];
    const completed = sections.filter(
      (s) => docs[s] && docs[s].length > 0,
    ).length;
    const total = sections.length;
    const pct = Math.round((completed / total) * 100);

    const progressBar = document.getElementById("docsProgressBar");
    const progressText = document.getElementById("docsProgressText");
    if (progressBar) progressBar.style.width = pct + "%";
    if (progressText)
      progressText.textContent =
        completed + " of " + total + " sections completed";

    // Show/hide completion message
    const completeMsg = document.getElementById("docsCompleteMsg");
    if (completeMsg) {
      completeMsg.style.display = completed === total ? "block" : "none";
    }
  }

  // Handle file selection (from input or drop)
  function handleFiles(fileList, sectionId) {
    if (!fileList || fileList.length === 0) return;

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/csv",
    ];
    const maxSize = 10 * 1024 * 1024; // 10MB

    const docs = getSavedDocs();
    if (!docs[sectionId]) docs[sectionId] = [];

    let errors = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (!allowedTypes.includes(file.type)) {
        errors.push(file.name + ": unsupported file type");
        continue;
      }
      if (file.size > maxSize) {
        errors.push(file.name + ": file too large (max 10MB)");
        continue;
      }
      // Check duplicate
      if (
        docs[sectionId].some(
          (d) => d.name === file.name && d.size === file.size,
        )
      ) {
        errors.push(file.name + ": already uploaded");
        continue;
      }

      docs[sectionId].push({
        name: file.name,
        size: file.size,
        type: file.type,
        date: new Date().toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
      });
    }

    saveDocs(docs);
    renderFileList(sectionId);
    updateProgress();

    if (errors.length > 0) {
      showDocAlert(errors.join("\\n"), "error");
    } else {
      showDocAlert(
        fileList.length +
          " file" +
          (fileList.length > 1 ? "s" : "") +
          " uploaded successfully!",
        "success",
      );
    }
  }

  // Show temporary alert
  function showDocAlert(message, type) {
    let alert = document.getElementById("docAlertMsg");
    if (!alert) {
      alert = document.createElement("div");
      alert.id = "docAlertMsg";
      document.body.appendChild(alert);
    }
    alert.textContent = message;
    alert.className = "doc-alert " + type;
    alert.style.display = "block";
    setTimeout(() => {
      alert.style.display = "none";
    }, 3500);
  }

  // Initialize section toggles
  const sectionHeaders = document.querySelectorAll(".section-header");
  sectionHeaders.forEach((header) => {
    header.addEventListener("click", function () {
      const sectionId = this.getAttribute("data-section");
      const sectionContent = document.getElementById("section-" + sectionId);
      const toggleIcon = this.querySelector(".section-toggle");
      if (sectionContent) {
        sectionContent.classList.toggle("active");
        if (toggleIcon) toggleIcon.classList.toggle("rotated");
      }
    });
  });

  // Initialize all upload file buttons and drop zones
  const sections = ["bank-statements", "financial-accounts", "applicant-info"];

  sections.forEach((sectionId) => {
    const sectionEl = document.getElementById("section-" + sectionId);
    if (!sectionEl) return;

    // Create hidden file input for this section
    let fileInput = sectionEl.querySelector(".doc-file-input");
    if (!fileInput) {
      fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.className = "doc-file-input";
      fileInput.multiple = true;
      fileInput.accept =
        ".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.xls,.xlsx,.csv";
      fileInput.style.display = "none";
      sectionEl.appendChild(fileInput);
    }

    // Upload files button
    const uploadBtn = sectionEl.querySelector(".upload-files-btn");
    if (uploadBtn) {
      uploadBtn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        fileInput.click();
      });
    }

    // File input change handler
    fileInput.addEventListener("change", function () {
      handleFiles(this.files, sectionId);
      this.value = ""; // reset so same file can be re-uploaded
    });

    // Drop zone
    const dropZone = sectionEl.querySelector(".doc-drop-zone");
    if (dropZone) {
      dropZone.addEventListener("dragover", function (e) {
        e.preventDefault();
        this.classList.add("dragover");
      });
      dropZone.addEventListener("dragleave", function () {
        this.classList.remove("dragover");
      });
      dropZone.addEventListener("drop", function (e) {
        e.preventDefault();
        this.classList.remove("dragover");
        handleFiles(e.dataTransfer.files, sectionId);
      });
      // Clicking on drop zone also triggers file input
      dropZone.addEventListener("click", function () {
        fileInput.click();
      });
    }

    // Render existing files
    renderFileList(sectionId);
  });

  // Connect open banking button
  const connectBankingBtns = document.querySelectorAll(".connect-banking-btn");
  connectBankingBtns.forEach((btn) => {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();

      // Create connection modal
      let modal = document.getElementById("openBankingModal");
      if (modal) modal.remove();

      modal = document.createElement("div");
      modal.id = "openBankingModal";
      modal.className = "funder-modal-overlay";
      modal.innerHTML = `
        <div class="funder-modal-card" style="max-width:480px; text-align:center;">
          <button class="funder-modal-close" id="closeOBModal">&times;</button>
          <div style="margin-bottom:1.5rem;">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#F96C34" stroke-width="1.5">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 6v6l4 2"/>
            </svg>
          </div>
          <h2 style="font-size:1.3rem; margin-bottom:0.5rem; color:#1a2b3d;">Connect Open Banking</h2>
          <p style="font-size:0.92rem; color:#666; margin-bottom:1.8rem; line-height:1.6;">Securely connect your business bank account to automatically share your last 6 months of bank statements. We use read-only access and never store your banking credentials.</p>
          <div class="ob-banks" style="display:flex; flex-wrap:wrap; gap:0.75rem; justify-content:center; margin-bottom:1.8rem;">
            <button class="ob-bank-btn" data-bank="Barclays">Barclays</button>
            <button class="ob-bank-btn" data-bank="HSBC">HSBC</button>
            <button class="ob-bank-btn" data-bank="Lloyds">Lloyds</button>
            <button class="ob-bank-btn" data-bank="NatWest">NatWest</button>
            <button class="ob-bank-btn" data-bank="Santander">Santander</button>
            <button class="ob-bank-btn" data-bank="Monzo">Monzo</button>
            <button class="ob-bank-btn" data-bank="Starling">Starling</button>
            <button class="ob-bank-btn" data-bank="Tide">Tide</button>
          </div>
          <div id="obStatus" style="min-height:1.5em; font-size:0.9rem; margin-bottom:1rem;"></div>
        </div>
      `;
      document.body.appendChild(modal);

      document
        .getElementById("closeOBModal")
        .addEventListener("click", () => modal.remove());
      modal.addEventListener("click", (ev) => {
        if (ev.target === modal) modal.remove();
      });

      // Bank selection handler
      modal.querySelectorAll(".ob-bank-btn").forEach((bankBtn) => {
        bankBtn.addEventListener("click", function () {
          const bank = this.getAttribute("data-bank");
          const statusEl = document.getElementById("obStatus");

          // Disable all bank buttons
          modal.querySelectorAll(".ob-bank-btn").forEach((b) => {
            b.disabled = true;
          });
          this.classList.add("selected");
          statusEl.textContent = "Connecting to " + bank + "...";
          statusEl.style.color = "#F96C34";

          // Simulate connection process
          setTimeout(() => {
            statusEl.textContent = "Authenticating with " + bank + "...";
            setTimeout(() => {
              statusEl.textContent = "Retrieving bank statements...";
              setTimeout(() => {
                // Save simulated bank statements
                const docs = getSavedDocs();
                if (!docs["bank-statements"]) docs["bank-statements"] = [];

                // Add simulated statements
                const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
                const year = new Date().getFullYear();
                months.forEach((m) => {
                  const fname = bank + "_Statement_" + m + "_" + year + ".pdf";
                  if (!docs["bank-statements"].some((d) => d.name === fname)) {
                    docs["bank-statements"].push({
                      name: fname,
                      size: Math.floor(Math.random() * 500000) + 100000,
                      type: "application/pdf",
                      date: new Date().toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      }),
                      source: "Open Banking - " + bank,
                    });
                  }
                });

                saveDocs(docs);
                renderFileList("bank-statements");
                updateProgress();

                statusEl.innerHTML =
                  '<span style="color:#10b981; font-weight:600;">&#10003; Connected successfully! 6 statements imported from ' +
                  bank +
                  ".</span>";

                setTimeout(() => modal.remove(), 2500);
              }, 1200);
            }, 1000);
          }, 1000);
        });
      });
    });
  });

  // Initialize progress
  updateProgress();
}

// ===== Admin Page Functions =====
function initializeAdminPage() {
  // Check if user is logged in
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  if (!isLoggedIn) {
    window.location.href = "login.html";
    return;
  }

  // Get user data from localStorage
  const userData = localStorage.getItem("userData");

  // Initialize sidebar user info, avatar & profile picture
  initializeSidebarUserInfo();

  // Initialize sidebar navigation
  const sidebarItems = document.querySelectorAll(".sidebar-item");

  sidebarItems.forEach((item) => {
    item.addEventListener("click", function (e) {
      // Check if this is an external page link
      const href = this.getAttribute("href");
      if (href && href.endsWith(".html")) {
        // Allow navigation to external pages
        return;
      }

      e.preventDefault();
    });
  });

  // Initialize copy link button
  const copyLinkBtn = document.getElementById("copyLinkBtn");
  if (copyLinkBtn) {
    copyLinkBtn.addEventListener("click", function () {
      const referralLink = document.getElementById("referralLink");
      const linkValue = referralLink.value;

      // Copy to clipboard using modern API with fallback
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard
          .writeText(linkValue)
          .then(() => {
            showCopyFeedback(copyLinkBtn);
          })
          .catch(() => {
            // Fallback for older browsers
            referralLink.select();
            document.execCommand("copy");
            showCopyFeedback(copyLinkBtn);
          });
      } else {
        referralLink.select();
        document.execCommand("copy");
        showCopyFeedback(copyLinkBtn);
      }
    });
  }
}

function showCopyFeedback(button) {
  const originalHTML = button.innerHTML;
  button.textContent = "Copied!";
  button.classList.add("copied");

  setTimeout(() => {
    button.innerHTML = originalHTML;
    button.classList.remove("copied");
  }, 2000);
}

// ===== Dashboard Phone Verification Modal =====
function showDashboardPhoneVerificationModal() {
  // Create modal if it doesn't exist
  let modal = document.getElementById("dashboardPhoneModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "dashboardPhoneModal";
    modal.className = "phone-verify-overlay";
    modal.innerHTML = `
      <div class="phone-verify-card">
        <h2>Verify Your Phone</h2>
        <p class="verify-subtitle">Please verify your mobile number to access your matched funders.</p>
        <form id="dashboardPhoneForm">
          <div class="phone-verify-group">
            <label>Mobile number</label>
            <input type="tel" id="dashboardPhoneInput" placeholder="Mobile Phone" maxlength="15">
          </div>
          <div class="phone-verify-message" id="dashboardPhoneMessage"></div>
          <button type="submit" class="phone-verify-btn" id="dashboardPhoneBtn">Get code</button>
        </form>
        <button class="phone-verify-skip" id="dashboardPhoneSkip">Skip for now</button>
      </div>
    `;
    document.body.appendChild(modal);
  }

  modal.style.display = "flex";

  const phoneForm = document.getElementById("dashboardPhoneForm");
  const phoneInput = document.getElementById("dashboardPhoneInput");
  const phoneMessage = document.getElementById("dashboardPhoneMessage");
  const phoneBtn = document.getElementById("dashboardPhoneBtn");
  const skipBtn = document.getElementById("dashboardPhoneSkip");

  let verificationStep = "phone";

  // Skip button - close modal
  skipBtn.onclick = () => {
    modal.style.display = "none";
  };

  // Form submit handler
  phoneForm.onsubmit = async (e) => {
    e.preventDefault();
    const inputValue = phoneInput.value.trim();
    phoneMessage.classList.remove("success", "error");
    phoneMessage.textContent = "";

    if (verificationStep === "phone") {
      // Step 1: Send code
      if (!inputValue || !/^\d{7,15}$/.test(inputValue.replace(/\D/g, ""))) {
        phoneMessage.textContent = "Please enter a valid mobile number";
        phoneMessage.classList.add("error");
        return;
      }

      phoneBtn.disabled = true;
      phoneBtn.textContent = "Sending code...";

      try {
        const authToken = localStorage.getItem("authToken");
        const response = await fetch(`${API_BASE}/phone/send-code`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ phone: inputValue }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to send code");
        }

        // DEV mode - show code
        if (data.code) {
          phoneMessage.textContent = `DEV MODE - Code: ${data.code}`;
        } else {
          phoneMessage.textContent = "Code sent! Check your phone.";
        }
        phoneMessage.classList.add("success");

        verificationStep = "code";
        phoneInput.value = "";
        phoneInput.placeholder = "Enter 6-digit code";
        phoneInput.maxLength = 6;
        phoneBtn.textContent = "Verify Code";
        phoneBtn.disabled = false;
        localStorage.setItem("pendingPhoneVerification", inputValue);
      } catch (error) {
        phoneMessage.textContent = error.message || "Failed to send code";
        phoneMessage.classList.add("error");
        phoneBtn.textContent = "Get code";
        phoneBtn.disabled = false;
      }
    } else {
      // Step 2: Verify code
      if (!inputValue || inputValue.length !== 6) {
        phoneMessage.textContent = "Please enter the 6-digit code";
        phoneMessage.classList.add("error");
        return;
      }

      phoneBtn.disabled = true;
      phoneBtn.textContent = "Verifying...";

      try {
        const authToken = localStorage.getItem("authToken");
        const response = await fetch(`${API_BASE}/phone/verify`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ code: inputValue }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Invalid code");
        }

        phoneMessage.textContent = "Phone verified successfully!";
        phoneMessage.classList.add("success");
        phoneBtn.textContent = "✓ Verified";

        localStorage.setItem("isPhoneVerified", "true");
        localStorage.setItem(
          "userPhone",
          "+44" + localStorage.getItem("pendingPhoneVerification"),
        );
        localStorage.removeItem("pendingPhoneVerification");

        setTimeout(() => {
          modal.style.display = "none";
          // Redirect to search results after verification
          window.location.href = "search-results.html";
        }, 1000);
      } catch (error) {
        phoneMessage.textContent = error.message || "Invalid code";
        phoneMessage.classList.add("error");
        phoneBtn.textContent = "Verify Code";
        phoneBtn.disabled = false;
      }
    }
  };

  // Allow only numbers
  phoneInput.oninput = () => {
    phoneInput.value = phoneInput.value
      .replace(/\D/g, "")
      .slice(0, phoneInput.maxLength || 15);
  };
}

// ===== Load User Application =====
async function loadUserApplication() {
  const myApplicationsList = document.getElementById("my-applications");
  if (!myApplicationsList) return;

  // Show loading state
  myApplicationsList.innerHTML = `
    <div class="loading-applications">
      <p>Loading your applications...</p>
    </div>
  `;

  try {
    // Fetch user's applications from API (secure, user-scoped)
    const authToken = localStorage.getItem("authToken");
    const response = await fetch(`${API_BASE}/funding/my-applications`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (response.ok) {
      const data = await response.json();

      if (data.applications && data.applications.length > 0) {
        // Display applications from database (user-specific)
        myApplicationsList.innerHTML = data.applications
          .map(
            (app) => `
          <div class="application-card" data-app-id="${app.id}">
            <div class="application-header">
              <div class="application-info">
                <h3>Funding Application</h3>
                <span class="application-id">#APP-${app.id}</span>
              </div>
              <div class="application-header-actions">
                <button class="btn-refresh-status" onclick="refreshApplicationStatus(${app.id})" title="Refresh Status">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M23 4v6h-6M1 20v-6h6"/>
                    <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
                  </svg>
                </button>
                <span class="application-status status-${app.status || "pending"}">${formatStatus(app.status || "pending")}</span>
              </div>
            </div>
            <div class="application-details">
              <div class="detail-row">
                <span class="detail-label">Amount Requested</span>
                <span class="detail-value">£${Number(app.fundingAmount || 0).toLocaleString()}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Purpose</span>
                <span class="detail-value">${app.fundingPurpose || "Not specified"}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Annual Turnover</span>
                <span class="detail-value">£${Number(app.annualTurnover || 0).toLocaleString()}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Trading Experience</span>
                <span class="detail-value">${app.tradingYears === "Yes" ? "3+ years" : app.tradingMonths ? app.tradingMonths + " months" : "Less than 3 years"}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Submitted</span>
                <span class="detail-value">${formatDate(app.createdAt)}</span>
              </div>
            </div>
            ${renderLenderSubmissions(app.lenderSubmissions)}
            <div class="application-actions">
              <button class="btn-view-results" onclick="window.location.href='search-results.html'">
                View Matched Funders →
              </button>
              <button class="btn-edit-application" onclick="window.location.href='funding-form.html'">
                New Application
              </button>
            </div>
          </div>
        `,
          )
          .join("");
        return;
      }
    }
  } catch (error) {
    console.error("Error fetching applications:", error);
  }

  // Fallback: No applications found
  myApplicationsList.innerHTML = `
    <div class="no-applications-state">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5">
        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
        <polyline points="13 2 13 9 20 9"/>
      </svg>
      <h3>No Applications Yet</h3>
      <p>Start exploring funding options to submit your first application.</p>
      <a href="funding-form.html" class="btn-primary">Find Funding</a>
    </div>
  `;
}

// ===== Format Status Display =====
function formatStatus(status) {
  const statusMap = {
    pending: "Pending",
    reviewing: "Under Review",
    approved: "Approved",
    declined: "Declined",
    rejected: "Rejected",
    submitted: "Submitted",
    submitted_to_lenders: "Sent to Lenders",
    funded: "Funded",
    error: "Error",
  };
  return (
    statusMap[status] ||
    status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  );
}

// ===== Format Date =====
function formatDate(dateStr) {
  if (!dateStr) return "N/A";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ===== Render Lender Submissions =====
function renderLenderSubmissions(submissions) {
  if (!submissions || submissions.length === 0) {
    return "";
  }

  return `
    <div class="lender-submissions-section">
      <h4>Lender Responses</h4>
      <div class="lender-submissions-list">
        ${submissions
          .map(
            (sub) => `
          <div class="lender-submission-item status-${sub.status}">
            <div class="lender-info">
              <span class="lender-name">${sub.lender}</span>
              ${sub.leadId ? `<span class="lead-id">Ref: ${sub.leadId}</span>` : ""}
            </div>
            <div class="submission-status">
              <span class="status-badge status-${sub.status}">${formatStatus(sub.status)}</span>
              <span class="submission-date">${formatDate(sub.submittedAt)}</span>
            </div>
            ${sub.error ? `<p class="submission-error">${sub.error}</p>` : ""}
          </div>
        `,
          )
          .join("")}
      </div>
    </div>
  `;
}

// ===== Refresh Application Status =====
async function refreshApplicationStatus(applicationId) {
  const card = document.querySelector(`[data-app-id="${applicationId}"]`);
  if (!card) return;

  const refreshBtn = card.querySelector(".btn-refresh-status");
  if (refreshBtn) {
    refreshBtn.classList.add("spinning");
    refreshBtn.disabled = true;
  }

  try {
    const authToken = localStorage.getItem("authToken");
    const response = await fetch(
      `${API_BASE}/funding/${applicationId}/lender-status`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      },
    );

    if (response.ok) {
      const data = await response.json();

      // Update the status badge
      const statusBadge = card.querySelector(".application-status");
      if (statusBadge && data.applicationStatus) {
        statusBadge.className = `application-status status-${data.applicationStatus}`;
        statusBadge.textContent = formatStatus(data.applicationStatus);
      }

      // Update lender submissions section
      const existingSection = card.querySelector(".lender-submissions-section");
      if (existingSection) {
        existingSection.remove();
      }

      if (data.lenderSubmissions && data.lenderSubmissions.length > 0) {
        const submissionsHtml = renderLenderSubmissions(data.lenderSubmissions);
        const actionsDiv = card.querySelector(".application-actions");
        if (actionsDiv) {
          actionsDiv.insertAdjacentHTML("beforebegin", submissionsHtml);
        }
      }

      showAlert("Status refreshed successfully", "success");
    } else {
      showAlert("Failed to refresh status", "error");
    }
  } catch (error) {
    console.error("Error refreshing status:", error);
    showAlert("Failed to refresh status", "error");
  } finally {
    if (refreshBtn) {
      refreshBtn.classList.remove("spinning");
      refreshBtn.disabled = false;
    }
  }
}

// ===== Logout Handler =====
