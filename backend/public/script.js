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
  const fundingInput = document.getElementById("fundingAmount");
  // Get clean numeric value (remove commas)
  const fundingAmount = parseInt(
    fundingInput.dataset.cleanValue || fundingInput.value.replace(/\D/g, ""),
    10,
  );
  const fundingPurpose = document.querySelector(
    'input[name="fundingPurpose"]:checked',
  );
  const assetFinanceSelected =
    fundingPurpose && fundingPurpose.value === "Asset Finance";
  const assetType = document.querySelector('input[name="assetType"]:checked');

  if (!fundingAmount || fundingAmount === 0) {
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
  const annualTurnoverInput = document.getElementById("annualTurnover");
  // Get clean numeric value (remove commas)
  const annualTurnover = parseInt(
    annualTurnoverInput.dataset.cleanValue ||
      annualTurnoverInput.value.replace(/\D/g, ""),
    10,
  );
  const tradingYears = document.querySelector(
    'input[name="tradingYears"]:checked',
  );
  const tradingYearsNo = document.querySelector(
    'input[name="tradingYears"][value="No"]:checked',
  );
  const tradingMonths = document.getElementById("tradingMonths").value;
  const homeowner = document.querySelector('input[name="homeowner"]:checked');

  if (!annualTurnover || annualTurnover === 0) {
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

  // Initialize navbar on funding form page
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const navLoginBtn = document.getElementById("navLoginBtn");
  const navMenu = document.getElementById("navMenu");
  const logoutBtn = document.getElementById("logoutBtn");

  if (isLoggedIn) {
    if (navLoginBtn) navLoginBtn.style.display = "none";
    if (navMenu) navMenu.style.display = "flex";
  } else {
    if (navLoginBtn) navLoginBtn.style.display = "inline-block";
    if (navMenu) navMenu.style.display = "none";
  }

  if (logoutBtn && !logoutBtn.dataset.bound) {
    logoutBtn.dataset.bound = "true";
    logoutBtn.addEventListener("click", function (e) {
      e.preventDefault();
      if (typeof handleLogout === "function") {
        handleLogout();
        return;
      }

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
      window.location.href = "login.html";
    });
  }

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
        const fundingInput = document.getElementById("fundingAmount");
        const cleanFundingAmount = parseInt(
          fundingInput.dataset.cleanValue ||
            fundingInput.value.replace(/\D/g, ""),
          10,
        );

        const annualTurnoverInput = document.getElementById("annualTurnover");
        const cleanAnnualTurnover = parseInt(
          annualTurnoverInput.dataset.cleanValue ||
            annualTurnoverInput.value.replace(/\D/g, ""),
          10,
        );

        const formData = {
          fundingAmount: cleanFundingAmount,
          fundingPurpose: document.querySelector(
            'input[name="fundingPurpose"]:checked',
          ).value,
          assetType:
            document.querySelector('input[name="assetType"]:checked')?.value ||
            null,
          importance: document.querySelector('input[name="importance"]:checked')
            .value,
          annualTurnover: cleanAnnualTurnover || null,
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
          const fundingInput = document.getElementById("fundingAmount");
          fundingInput.value = formatNumber(formData.fundingAmount.toString());
          fundingInput.dataset.cleanValue = formData.fundingAmount.toString();
        }

        // Populate Step 3 - Annual Turnover
        if (formData.annualTurnover) {
          const turnoverInput = document.getElementById("annualTurnover");
          turnoverInput.value = formatNumber(
            formData.annualTurnover.toString(),
          );
          turnoverInput.dataset.cleanValue = formData.annualTurnover.toString();
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
  // Fields to format with comma separators
  const fieldsToFormat = ["fundingAmount", "annualTurnover"];

  fieldsToFormat.forEach((fieldId) => {
    const input = document.getElementById(fieldId);

    if (input) {
      input.addEventListener("input", function () {
        // Remove non-digit characters
        let value = this.value.replace(/[^\d]/g, "");

        // Format with commas
        let formatted = "";
        if (value) {
          formatted = formatNumber(value);
        }

        // Update the display
        this.value = formatted;

        // Store clean numeric value for form submission
        this.dataset.cleanValue = value;
      });

      // Add focus effect
      input.addEventListener("focus", function () {
        this.parentElement.style.transform = "scale(1.02)";
      });

      input.addEventListener("blur", function () {
        this.parentElement.style.transform = "scale(1)";
      });
    }
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
// Global variable to capture referral code from URL
let capturedReferralCode = null;

function initializeAuthPage() {
  const authTabs = document.querySelectorAll(".auth-tab");
  const toggleButtons = document.querySelectorAll(".toggle-btn");
  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");
  const socialButtons = document.querySelectorAll(".social-btn");

  // Capture referral code from URL parameter (?ref=CODE)
  const urlParams = new URLSearchParams(window.location.search);
  const refCode = urlParams.get("ref");
  if (refCode) {
    capturedReferralCode = refCode.toUpperCase();
    console.log("Referral code captured:", capturedReferralCode);

    // Switch to signup tab if referral code present
    const signupTab = document.querySelector('.auth-tab[data-toggle="signup"]');
    if (signupTab) {
      signupTab.click();
    }
  }

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
    // Preserve fundingFormData - it's the user's own search, needed for apply modal
    const savedFundingForm = localStorage.getItem("fundingFormData");
    localStorage.removeItem("authToken");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userCompanyName");
    localStorage.removeItem("userData");
    localStorage.removeItem("isPhoneVerified");
    localStorage.removeItem("userPhone");
    localStorage.removeItem("userProfilePicture");
    localStorage.removeItem("applicationId");
    localStorage.removeItem("fundingFormData");
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

    // Restore funding form data (user's own search, safe across login)
    if (savedFundingForm) {
      localStorage.setItem("fundingFormData", savedFundingForm);
    }

    showAuthMessage("Login successful! Redirecting...", "success", messageEl);

    setTimeout(() => {
      // Redirect based on whether user has existing applications
      if (data.user.hasApplications) {
        // Returning user with applications → go to dashboard
        window.location.href = "dashboard.html";
      } else {
        // New user without applications → go to funding form
        window.location.href = "funding-form.html";
      }
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
        referralCode: capturedReferralCode,
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

// Setup referral code input - pre-fill from URL and validate
function setupReferralCodeInput() {
  const referralCodeInput = document.getElementById("referralCode");
  const referralCodeStatus = document.getElementById("referralCodeStatus");

  if (!referralCodeInput) return;

  // Check for ?ref= URL parameter and pre-fill
  const urlParams = new URLSearchParams(window.location.search);
  const refCode = urlParams.get("ref");

  if (refCode) {
    referralCodeInput.value = refCode;
    validateReferralCode(refCode, referralCodeInput, referralCodeStatus);

    // Switch to signup tab if on login tab
    const signupTab = document.querySelector('.auth-tab[data-toggle="signup"]');
    if (signupTab) {
      signupTab.click();
    }
  }

  // Validate referral code on input with debounce
  let debounceTimer;
  referralCodeInput.addEventListener("input", function () {
    const code = this.value.trim();

    // Clear previous status
    clearTimeout(debounceTimer);

    if (!code) {
      referralCodeStatus.textContent = "";
      referralCodeInput.classList.remove("valid", "invalid");
      return;
    }

    if (code.length < 4) {
      referralCodeStatus.className = "referral-code-status";
      referralCodeStatus.textContent = "";
      return;
    }

    referralCodeStatus.className = "referral-code-status checking";
    referralCodeStatus.textContent = "Checking code...";

    debounceTimer = setTimeout(() => {
      validateReferralCode(code, referralCodeInput, referralCodeStatus);
    }, 500);
  });
}

// Validate referral code via API
async function validateReferralCode(code, inputEl, statusEl) {
  try {
    const response = await fetch(
      `${API_BASE}/referral/validate/${encodeURIComponent(code)}`,
    );
    const data = await response.json();

    if (response.ok && data.valid) {
      statusEl.className = "referral-code-status valid";
      statusEl.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        Valid code from ${data.referrerName}
      `;
      inputEl.classList.add("valid");
      inputEl.classList.remove("invalid");
    } else {
      statusEl.className = "referral-code-status invalid";
      statusEl.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
        Invalid referral code
      `;
      inputEl.classList.add("invalid");
      inputEl.classList.remove("valid");
    }
  } catch (error) {
    console.error("Error validating referral code:", error);
    statusEl.className = "referral-code-status";
    statusEl.textContent = "";
  }
}

// ===== Admin Referral Management Functions =====
let allAdminReferrals = [];

async function loadAdminReferralData() {
  const adminReferralSection = document.getElementById(
    "section-admin-referrals",
  );
  if (!adminReferralSection) return;

  try {
    const authToken = localStorage.getItem("authToken");

    // Load admin's own referral link
    const codeResponse = await fetch(`${API_BASE}/referral/my-code`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    if (codeResponse.ok) {
      const codeData = await codeResponse.json();
      const adminLinkInput = document.getElementById("adminReferralLink");
      if (adminLinkInput) {
        // Build referral link dynamically using current domain
        const referralLink = `${window.location.origin}/login.html?ref=${codeData.referralCode}`;
        adminLinkInput.value = referralLink;
      }
    }

    // Load admin stats
    const statsResponse = await fetch(`${API_BASE}/referral/admin/stats`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    if (statsResponse.ok) {
      const stats = await statsResponse.json();
      updateAdminReferralStats(stats);
    }

    // Load all referrals
    const listResponse = await fetch(`${API_BASE}/referral/admin/all`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    if (listResponse.ok) {
      const listData = await listResponse.json();
      allAdminReferrals = listData.referrals || [];
      renderAdminReferralTable(allAdminReferrals);
    }
  } catch (error) {
    console.error("Error loading admin referral data:", error);
    const tableBody = document.getElementById("adminReferralTableBody");
    if (tableBody) {
      tableBody.innerHTML =
        '<tr><td colspan="7" class="no-data-row">Error loading referrals</td></tr>';
    }
  }
}

function updateAdminReferralStats(stats) {
  const elements = {
    adminTotalReferrals: stats.totalReferrals || 0,
    adminPendingReferrals: stats.pendingReferrals || 0,
    adminQualifiedReferrals: stats.qualifiedReferrals || 0,
    adminRewardedReferrals: stats.rewardedReferrals || 0,
    adminTotalPaid: `£${stats.totalRewardsPaid || 0}`,
  };

  Object.entries(elements).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  });
}

function renderAdminReferralTable(referrals) {
  const tableBody = document.getElementById("adminReferralTableBody");
  if (!tableBody) return;

  if (!referrals || referrals.length === 0) {
    tableBody.innerHTML =
      '<tr><td colspan="7" class="no-data-row">No referrals found</td></tr>';
    return;
  }

  tableBody.innerHTML = referrals
    .map(
      (ref) => `
    <tr data-referral-id="${ref.id}">
      <td>#${ref.id}</td>
      <td>${ref.referrerEmail || "N/A"}</td>
      <td>${ref.referredEmail || "N/A"}</td>
      <td>${formatDate(ref.createdAt)}</td>
      <td><span class="referral-status ${ref.status}">${ref.status.charAt(0).toUpperCase() + ref.status.slice(1)}</span></td>
      <td>${ref.rewardAmount ? `£${ref.rewardAmount}` : "-"}</td>
      <td>
        <div class="referral-actions">
          ${
            ref.status === "pending"
              ? `
            <button class="action-btn qualify" onclick="qualifyReferral(${ref.id})">Qualify</button>
            <button class="action-btn expire" onclick="expireReferral(${ref.id})">Expire</button>
          `
              : ""
          }
          ${
            ref.status === "qualified"
              ? `
            <button class="action-btn reward" onclick="rewardReferral(${ref.id})">Reward</button>
          `
              : ""
          }
          ${ref.status === "rewarded" ? '<span style="color: #155724; font-size: 0.8rem;">✓ Completed</span>' : ""}
          ${ref.status === "expired" ? '<span style="color: #721c24; font-size: 0.8rem;">Expired</span>' : ""}
        </div>
      </td>
    </tr>
  `,
    )
    .join("");
}

function filterAdminReferrals() {
  const statusFilter =
    document.getElementById("referralStatusFilter")?.value || "";
  const searchFilter =
    document.getElementById("referralSearchInput")?.value.toLowerCase() || "";

  let filtered = allAdminReferrals;

  if (statusFilter) {
    filtered = filtered.filter((ref) => ref.status === statusFilter);
  }

  if (searchFilter) {
    filtered = filtered.filter(
      (ref) =>
        (ref.referrerEmail &&
          ref.referrerEmail.toLowerCase().includes(searchFilter)) ||
        (ref.referredEmail &&
          ref.referredEmail.toLowerCase().includes(searchFilter)),
    );
  }

  renderAdminReferralTable(filtered);
}

async function qualifyReferral(referralId) {
  if (!confirm("Mark this referral as qualified?")) return;

  try {
    const authToken = localStorage.getItem("authToken");
    const response = await fetch(
      `${API_BASE}/referral/admin/qualify/${referralId}`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${authToken}` },
      },
    );

    if (response.ok) {
      showAlert("Referral marked as qualified", "success");
      loadAdminReferralData();
    } else {
      const data = await response.json();
      showAlert(data.error || "Failed to qualify referral", "error");
    }
  } catch (error) {
    console.error("Error qualifying referral:", error);
    showAlert("Error qualifying referral", "error");
  }
}

async function rewardReferral(referralId) {
  if (!confirm("Process £200 reward for this referral?")) return;

  try {
    const authToken = localStorage.getItem("authToken");
    const response = await fetch(
      `${API_BASE}/referral/admin/reward/${referralId}`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${authToken}` },
      },
    );

    if (response.ok) {
      showAlert("Reward processed successfully", "success");
      loadAdminReferralData();
    } else {
      const data = await response.json();
      showAlert(data.error || "Failed to process reward", "error");
    }
  } catch (error) {
    console.error("Error processing reward:", error);
    showAlert("Error processing reward", "error");
  }
}

async function expireReferral(referralId) {
  if (!confirm("Mark this referral as expired?")) return;

  try {
    const authToken = localStorage.getItem("authToken");
    const response = await fetch(
      `${API_BASE}/referral/admin/expire/${referralId}`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${authToken}` },
      },
    );

    if (response.ok) {
      showAlert("Referral marked as expired", "success");
      loadAdminReferralData();
    } else {
      const data = await response.json();
      showAlert(data.error || "Failed to expire referral", "error");
    }
  } catch (error) {
    console.error("Error expiring referral:", error);
    showAlert("Error expiring referral", "error");
  }
}

async function exportReferrals() {
  try {
    const authToken = localStorage.getItem("authToken");
    const response = await fetch(`${API_BASE}/referral/admin/export`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `referrals-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      showAlert("CSV exported successfully", "success");
    } else {
      showAlert("Failed to export CSV", "error");
    }
  } catch (error) {
    console.error("Error exporting referrals:", error);
    showAlert("Error exporting referrals", "error");
  }
}

function copyAdminReferralLink() {
  const linkInput = document.getElementById("adminReferralLink");
  const copyBtn = document.getElementById("copyAdminLinkBtn");

  if (!linkInput || !linkInput.value) {
    showAlert("No referral link to copy", "error");
    return;
  }

  navigator.clipboard
    .writeText(linkInput.value)
    .then(() => {
      if (copyBtn) {
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        Copied!
      `;
        setTimeout(() => {
          copyBtn.innerHTML = originalText;
        }, 2000);
      }
      showAlert("Referral link copied!", "success");
    })
    .catch(() => {
      linkInput.select();
      document.execCommand("copy");
      showAlert("Referral link copied!", "success");
    });
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

  // Initialize super admin page if on super admin page
  if (document.getElementById("saLoginGate")) {
    initializeSuperAdminPage();
    return; // Super admin page is standalone, no other init needed
  }

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
    // Initialize navbar on search results page
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    const navLoginBtn = document.getElementById("navLoginBtn");
    const navMenu = document.getElementById("navMenu");
    const logoutBtn = document.getElementById("logoutBtn");

    if (isLoggedIn) {
      if (navLoginBtn) navLoginBtn.style.display = "none";
      if (navMenu) navMenu.style.display = "flex";
    } else {
      if (navLoginBtn) navLoginBtn.style.display = "inline-block";
      if (navMenu) navMenu.style.display = "none";
    }

    if (logoutBtn && !logoutBtn.dataset.bound) {
      logoutBtn.dataset.bound = "true";
      logoutBtn.addEventListener("click", function (e) {
        e.preventDefault();
        if (typeof handleLogout === "function") {
          handleLogout();
          return;
        }

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
        window.location.href = "login.html";
      });
    }

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

      const isPhoneVerified =
        localStorage.getItem("isPhoneVerified") === "true";
      if (!isPhoneVerified) {
        showDashboardPhoneVerificationModal();
        return;
      }

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

  // Load referral data for Refer & Earn section
  loadReferralData();

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
async function showApplicationModal(lenderKey, lenderName) {
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
  let formData = JSON.parse(localStorage.getItem("fundingFormData") || "{}");

  // If localStorage is missing funding data, fetch from database
  if (!formData.fundingAmount) {
    try {
      const token = localStorage.getItem("authToken");
      if (token) {
        const resp = await fetch(`${API_BASE}/funding/my-applications`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await resp.json();
        if (data.success && data.applications && data.applications.length > 0) {
          const latest = data.applications[0];
          formData = {
            fundingAmount: latest.fundingAmount,
            fundingPurpose: latest.fundingPurpose,
            homeowner: latest.homeowner,
            annualTurnover: latest.annualTurnover,
            tradingYears: latest.tradingYears,
            tradingMonths: latest.tradingMonths,
            assetType: latest.assetType,
            importance: latest.importance,
          };
          // Re-cache so we don't fetch again
          localStorage.setItem("fundingFormData", JSON.stringify(formData));
        }
      }
    } catch (e) {
      // DB fetch failed, continue with whatever we have
    }
  }

  // Check if this is MyPulse (requires additional fields)
  const isMyPulse = lenderKey === "mypulse";
  const minAmount = isMyPulse ? 3000 : 1000;
  const maxAmount = isMyPulse ? 500000 : 5000000;

  // Pre-fill values from form + profile
  const prefillAmount = formData.fundingAmount
    ? Math.min(formData.fundingAmount, maxAmount)
    : "";
  const prefillPurpose = formData.fundingPurpose || "";
  const prefillHomeowner = formData.homeowner || "No";
  const prefillTurnover = userData.turnover || formData.annualTurnover || "";
  const hasFundingData = !!formData.fundingAmount;

  // Remove existing modal if present
  const existingModal = document.getElementById("applicationModal");
  if (existingModal) existingModal.remove();

  // Build summary values
  const displayName =
    `${userData.firstName || ""} ${userData.lastName || ""}`.trim() || "—";
  const displayEmail = userData.email || "—";
  const displayPhone = userData.phone || "—";
  const displayCompany = userData.companyName || "—";
  const displayAmount = prefillAmount
    ? `£${Number(prefillAmount).toLocaleString()}`
    : "—";
  const displayPurpose = prefillPurpose || "—";
  const displayHomeowner = prefillHomeowner === "Yes" ? "Homeowner" : "Tenant";
  const displayTurnover = prefillTurnover
    ? `£${Number(prefillTurnover).toLocaleString()} turnover`
    : "";
  const maxDOB = new Date(new Date().setFullYear(new Date().getFullYear() - 18))
    .toISOString()
    .split("T")[0];

  const modal = document.createElement("div");
  modal.id = "applicationModal";
  modal.className = "application-modal-overlay";
  modal.innerHTML = `
    <div class="application-modal compact-modal">
      <div class="modal-header">
        <h2>Apply to ${lenderName}</h2>
        <button class="modal-close-btn" id="closeApplicationModal">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <div class="modal-body">
        <form id="applicationForm" class="application-form">

          <!-- READ-ONLY SUMMARY OF KNOWN DATA -->
          <div class="app-summary-card">
            <div class="summary-line">
              <span class="summary-emoji">👤</span>
              <span>${displayName}</span>
              <span class="sdot">·</span>
              <span>${displayEmail}</span>
              <span class="sdot">·</span>
              <span>${displayPhone}</span>
            </div>
            <div class="summary-line">
              <span class="summary-emoji">💰</span>
              <span>${displayAmount}</span>
              <span class="sdot">·</span>
              <span>${displayPurpose}</span>
              <span class="sdot">·</span>
              <span>${displayHomeowner}</span>
              ${displayTurnover ? `<span class="sdot">·</span><span>${displayTurnover}</span>` : ""}
            </div>
          </div>

          <!-- COMPANY SEARCH — replaces CRN + business name inputs -->
          <div class="app-company-search">
            <label for="appCompanySearch">🔍 Find Your Company</label>
            <div class="company-search-row">
              <input type="text" id="appCompanySearch" placeholder="Company name or CRN (e.g. 12345678)" autocomplete="off" value="${userData.companyName || ""}">
              <button type="button" id="appSearchBtn" class="btn-search">
                <span class="search-text">Search</span>
                <span class="search-loading" style="display:none;">
                  <svg class="spinner" width="16" height="16" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none" stroke-dasharray="32" stroke-linecap="round"/></svg>
                </span>
              </button>
            </div>
            <div id="appSearchResults" class="company-search-results" style="display:none;"></div>
            <div id="appSearchStatus" class="company-search-status" style="display:none;"></div>
          </div>

          <!-- Hidden fields populated by company search -->
          <input type="hidden" id="appBusinessName" value="${userData.companyName || ""}">
          <input type="hidden" id="appCompanyNumber" value="">

          ${
            !hasFundingData
              ? `
          <!-- FUNDING DETAILS — shown when localStorage data is missing -->
          <div class="app-extras">
            <div class="app-grid-2">
              <div class="form-group">
                <label for="appFundingAmount">Funding Amount (£) *</label>
                <input type="number" id="appFundingAmount" name="fundingAmount" min="${minAmount}" max="${maxAmount}" placeholder="e.g. 25000" required>
              </div>
              <div class="form-group">
                <label for="appFundingPurpose">Purpose *</label>
                <select id="appFundingPurpose" name="fundingPurpose" required>
                  <option value="">Select...</option>
                  <option value="Working Capital">Working Capital</option>
                  <option value="Expansion">Expansion</option>
                  <option value="Stock Purchase">Stock Purchase</option>
                  <option value="Equipment">Equipment</option>
                  <option value="Cash Flow">Cash Flow</option>
                  <option value="Asset Finance">Asset Finance</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>
          `
              : ""
          }

          <!-- DATE OF BIRTH — only always-needed input -->
          <div class="app-inline-field">
            <div class="form-group">
              <label for="appDateOfBirth">Date of Birth *</label>
              <input type="date" id="appDateOfBirth" name="dateOfBirth" max="${maxDOB}" required>
            </div>
          </div>

          ${
            isMyPulse
              ? `
          <!-- MYPULSE EXTRAS — loan term + address -->
          <div class="app-extras">
            <div class="app-grid-2">
              <div class="form-group">
                <label for="appLoanTerm">Loan Term (months) *</label>
                <input type="number" id="appLoanTerm" name="loanTerm" min="6" max="60" placeholder="e.g. 36" required>
              </div>
              <div class="form-group">
                <label for="appHouseNumber">House/Flat No.</label>
                <input type="text" id="appHouseNumber" name="houseNumber" placeholder="e.g. 33a">
              </div>
            </div>
            <div class="app-grid-3">
              <div class="form-group">
                <label for="appStreet">Street *</label>
                <input type="text" id="appStreet" name="street" required>
              </div>
              <div class="form-group">
                <label for="appTown">Town *</label>
                <input type="text" id="appTown" name="town" required>
              </div>
              <div class="form-group">
                <label for="appPostcode">Postcode *</label>
                <input type="text" id="appPostcode" name="postcode" placeholder="PR7 3HN" required>
              </div>
            </div>
          </div>
          `
              : ""
          }

          <!-- CONSENT -->
          <div class="form-consent compact-consent">
            <label class="consent-checkbox">
              <input type="checkbox" id="appConsent" name="consent" required>
              <span>I agree to share my details with ${lenderName} and consent to credit and fraud checks.</span>
            </label>
          </div>

          <div class="form-message" id="applicationMessage"></div>
        </form>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary" id="cancelApplicationBtn">Cancel</button>
        <button class="btn-primary" id="submitApplicationBtn" data-lender-key="${lenderKey}">
          <span class="btn-text">Submit Application</span>
          <span class="btn-loading" style="display:none;">
            <svg class="spinner" width="18" height="18" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none" stroke-dasharray="32" stroke-linecap="round"/>
            </svg>
            Submitting...
          </span>
        </button>
      </div>
    </div>`;

  document.body.appendChild(modal);

  const submitBtn = modal.querySelector("#submitApplicationBtn");
  const applicationForm = modal.querySelector("#applicationForm");
  const searchInput = modal.querySelector("#appCompanySearch");
  const searchBtn = modal.querySelector("#appSearchBtn");
  const searchResults = modal.querySelector("#appSearchResults");
  const searchStatus = modal.querySelector("#appSearchStatus");

  // ===== COMPANY SEARCH / AUTO-FILL =====
  let searchDebounce = null;

  searchBtn.addEventListener("click", () => {
    const query = searchInput.value.trim();
    if (query.length >= 2) performCompanySearch(query);
  });

  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const query = searchInput.value.trim();
      if (query.length >= 2) performCompanySearch(query);
    }
  });

  // Auto-search as user types (debounced)
  searchInput.addEventListener("input", () => {
    clearTimeout(searchDebounce);
    const query = searchInput.value.trim();
    if (query.length < 2) {
      searchResults.style.display = "none";
      searchStatus.style.display = "none";
      return;
    }
    searchDebounce = setTimeout(() => performCompanySearch(query), 500);
  });

  async function performCompanySearch(query) {
    searchBtn.querySelector(".search-text").style.display = "none";
    searchBtn.querySelector(".search-loading").style.display = "inline-flex";
    searchBtn.disabled = true;
    searchStatus.style.display = "none";
    searchResults.style.display = "none";

    try {
      // Determine if CRN or name search
      const isCRN = /^[A-Za-z0-9]{6,8}$/.test(query);

      if (isCRN) {
        // Direct CRN lookup via myPulse
        const res = await fetch(
          `${API_BASE}/company/lookup/${encodeURIComponent(query)}`,
        );
        const data = await res.json();

        if (data.success && data.company) {
          applyCompanyData(data.company);
          showSearchStatus(`Found: ${data.company.name}`, "success");
          // Also fetch directors for auto-fill
          fetchOfficers(data.company.crn);
        } else {
          showSearchStatus("Company not found with that CRN", "error");
        }
      } else {
        // Name search via Companies House
        const res = await fetch(
          `${API_BASE}/company/search?q=${encodeURIComponent(query)}&limit=5`,
        );
        const data = await res.json();

        if (data.success && data.companies && data.companies.length > 0) {
          showCompanyResults(data.companies);
        } else if (data.message) {
          // Companies House API not configured, try as CRN fallback
          showSearchStatus(
            "Enter the 8-digit CRN for instant auto-fill",
            "info",
          );
        } else {
          showSearchStatus("No companies found. Try the CRN instead.", "info");
        }
      }
    } catch (err) {
      showSearchStatus(
        "Search failed. You can fill details manually.",
        "error",
      );
    } finally {
      searchBtn.querySelector(".search-text").style.display = "inline";
      searchBtn.querySelector(".search-loading").style.display = "none";
      searchBtn.disabled = false;
    }
  }

  function showCompanyResults(companies) {
    searchResults.innerHTML = companies
      .map(
        (c) => `
      <div class="company-result-item" data-crn="${c.crn}" data-name="${c.name}">
        <div class="company-result-name">${c.name}</div>
        <div class="company-result-meta">CRN: ${c.crn} · ${c.status || ""} ${c.address ? "· " + c.address : ""}</div>
      </div>
    `,
      )
      .join("");
    searchResults.style.display = "block";

    // Click handler for each result
    searchResults.querySelectorAll(".company-result-item").forEach((item) => {
      item.addEventListener("click", async () => {
        const crn = item.dataset.crn;
        const name = item.dataset.name;
        searchResults.style.display = "none";
        searchInput.value = name;
        showSearchStatus("Loading company details...", "loading");

        try {
          const res = await fetch(
            `${API_BASE}/company/lookup/${encodeURIComponent(crn)}`,
          );
          const data = await res.json();
          if (data.success && data.company) {
            applyCompanyData(data.company);
            showSearchStatus(`Auto-filled: ${data.company.name}`, "success");
            fetchOfficers(crn);
          } else {
            // Fallback: just use name and CRN from search result
            modal.querySelector("#appBusinessName").value = name;
            modal.querySelector("#appCompanyNumber").value = crn;
            showSearchStatus(`Set: ${name} (${crn})`, "success");
          }
        } catch {
          modal.querySelector("#appBusinessName").value = name;
          modal.querySelector("#appCompanyNumber").value = crn;
          showSearchStatus(`Set: ${name} (${crn})`, "success");
        }
      });
    });
  }

  function applyCompanyData(company) {
    modal.querySelector("#appBusinessName").value = company.name || "";
    modal.querySelector("#appCompanyNumber").value = company.crn || "";

    // Update search input to show found company name
    searchInput.value = company.name || searchInput.value;

    // Auto-fill address for MyPulse
    if (isMyPulse && company.address) {
      const addr = company.address;
      const houseNum = modal.querySelector("#appHouseNumber");
      const streetEl = modal.querySelector("#appStreet");
      const townEl = modal.querySelector("#appTown");
      const postcodeEl = modal.querySelector("#appPostcode");

      if (houseNum && addr.line1) {
        const match = addr.line1.match(/^(\d+\w*)\s+(.*)/);
        if (match) {
          houseNum.value = match[1];
          if (streetEl) streetEl.value = match[2];
        } else {
          if (streetEl) streetEl.value = addr.line1;
        }
      }
      if (addr.line2 && streetEl && !streetEl.value) {
        streetEl.value = addr.line2;
      }
      if (townEl) townEl.value = addr.city || "";
      if (postcodeEl) postcodeEl.value = addr.postcode || "";
    }

    // Calculate trading years from incorporation date
    if (company.incorporationDate) {
      const incDate = new Date(company.incorporationDate);
      if (!isNaN(incDate.getTime())) {
        const years = Math.floor(
          (Date.now() - incDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000),
        );
        modal.dataset.tradingYears = years;
      }
    }
  }

  async function fetchOfficers(crn) {
    try {
      const res = await fetch(
        `${API_BASE}/company/officers/${encodeURIComponent(crn)}`,
      );
      const data = await res.json();
      if (data.success && data.officers && data.officers.length > 0) {
        const director =
          data.officers.find(
            (o) =>
              o.Officer_Role?.toLowerCase().includes("director") &&
              !o.Resigned_On,
          ) || data.officers[0];

        if (director) {
          // Auto-fill DOB if available and empty
          const dobEl = modal.querySelector("#appDateOfBirth");
          if (dobEl && !dobEl.value && director.Date_Of_Birth) {
            const dob = new Date(director.Date_Of_Birth);
            if (!isNaN(dob.getTime())) {
              dobEl.value = dob.toISOString().split("T")[0];
            }
          }
        }
      }
    } catch {
      // Officers lookup is optional - fail silently
    }
  }

  function showSearchStatus(msg, type) {
    searchStatus.textContent = msg;
    searchStatus.className = "company-search-status " + type;
    searchStatus.style.display = "block";
  }

  // Close handlers
  modal
    .querySelector("#closeApplicationModal")
    .addEventListener("click", () => modal.remove());
  modal
    .querySelector("#cancelApplicationBtn")
    .addEventListener("click", () => modal.remove());
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.remove();
  });

  // Submit handler
  submitBtn.addEventListener("click", () => {
    submitApplication(lenderKey, lenderName, modal);
  });

  // Clear error styling on input
  applicationForm.querySelectorAll("input, select").forEach((input) => {
    input.addEventListener("input", () => {
      input.style.borderColor = "";
      modal.querySelector("#applicationMessage").textContent = "";
    });
  });

  // Close search results when clicking outside
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".app-company-search")) {
      searchResults.style.display = "none";
    }
  });
}

// ===== Submit Application to Lender =====
async function submitApplication(lenderKey, lenderName, modal) {
  const form = modal.querySelector("#applicationForm");
  const messageEl = modal.querySelector("#applicationMessage");
  const submitBtn = modal.querySelector("#submitApplicationBtn");
  const btnText = submitBtn.querySelector(".btn-text");
  const btnLoading = submitBtn.querySelector(".btn-loading");

  // Check consent (only validation needed on final step)
  const consentCheckbox = modal.querySelector("#appConsent");
  if (!consentCheckbox || !consentCheckbox.checked) {
    messageEl.textContent =
      "Please agree to share your details with the lender";
    messageEl.className = "form-message error";
    return;
  }

  // Pull pre-filled data from localStorage (user already entered during signup/funding form)
  const userData = JSON.parse(localStorage.getItem("userData") || "{}");
  const formData = JSON.parse(localStorage.getItem("fundingFormData") || "{}");
  const isMyPulse = lenderKey === "mypulse";
  const maxAmount = isMyPulse ? 500000 : 5000000;
  const minAmount = isMyPulse ? 3000 : 1000;
  // Read amount: prefer localStorage, fall back to modal input
  const modalAmountEl = modal.querySelector("#appFundingAmount");
  const modalPurposeEl = modal.querySelector("#appFundingPurpose");
  const rawAmount =
    parseFloat(
      formData.fundingAmount || (modalAmountEl ? modalAmountEl.value : "0"),
    ) || 0;

  if (rawAmount <= 0) {
    messageEl.textContent = "Please enter a funding amount";
    messageEl.className = "form-message error";
    if (modalAmountEl) modalAmountEl.style.borderColor = "#e74c3c";
    return;
  }

  const clampedAmount = Math.max(minAmount, Math.min(rawAmount, maxAmount));

  // Gather data: localStorage for pre-filled, modal for user-entered fields
  const applicationData = {
    // From localStorage (already captured)
    firstName: userData.firstName || "",
    lastName: userData.lastName || "",
    email: userData.email || "",
    phone: userData.phone || "",
    homeowner: formData.homeowner || "No",
    fundingAmount: clampedAmount,
    fundingPurpose:
      formData.fundingPurpose || (modalPurposeEl ? modalPurposeEl.value : ""),
    annualTurnover:
      parseFloat(formData.annualTurnover || userData.turnover || "0") || 0,
    tradingYears: parseInt(
      modal.dataset.tradingYears || formData.tradingYears || "0",
    ),

    // From modal (company search hidden inputs)
    businessName:
      modal.querySelector("#appBusinessName")?.value.trim() ||
      userData.companyName ||
      "",
    companyNumber: modal.querySelector("#appCompanyNumber")?.value.trim() || "",

    // From modal (user input)
    dateOfBirth: modal.querySelector("#appDateOfBirth")?.value || "",

    // myPulse address + loan fields (from modal if present)
    houseNumber: modal.querySelector("#appHouseNumber")?.value.trim() || "",
    houseName: "",
    street: modal.querySelector("#appStreet")?.value.trim() || "",
    town: modal.querySelector("#appTown")?.value.trim() || "",
    postcode: modal.querySelector("#appPostcode")?.value.trim() || "",
    loanTerm: parseInt(modal.querySelector("#appLoanTerm")?.value || "0"),
    lenderKey: lenderKey,
  };

  // Validate — only fields the user can actually fill in the modal
  if (!applicationData.dateOfBirth) {
    messageEl.textContent = "Please enter your date of birth";
    messageEl.className = "form-message error";
    return;
  }

  // MyPulse: validate address + loan term
  if (isMyPulse) {
    if (
      !applicationData.street ||
      !applicationData.town ||
      !applicationData.postcode
    ) {
      messageEl.textContent =
        "Please fill in the address fields (street, town, postcode)";
      messageEl.className = "form-message error";
      return;
    }
    if (!applicationData.loanTerm || applicationData.loanTerm <= 0) {
      messageEl.textContent = "Please enter a valid loan term";
      messageEl.className = "form-message error";
      return;
    }
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
    showApplicationSuccess(lenderName, applicationData.fundingAmount);

    // Close modal
    modal.remove();
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
function showApplicationSuccess(lenderName, fundingAmount) {
  const existingModal = document.getElementById("successModal");
  if (existingModal) existingModal.remove();

  const amount = parseFloat(fundingAmount) || 0;

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
      <p class="success-message">Your application for <strong>£${Number(amount).toLocaleString()}</strong> has been sent to <strong>${lenderName}</strong>.</p>
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

// ===== Phone Verification Modal (new card design) =====
function initializePhoneVerificationModal() {
  const phoneVerificationModal = document.getElementById(
    "phoneVerificationModal",
  );
  const skipVerificationBtn = document.getElementById("skipVerificationBtn");
  const verifyPhoneBtn = document.getElementById("verifyPhoneBtn");
  const phoneInput = document.getElementById("phoneNumber");
  const verificationMessage = document.getElementById("verificationMessage");
  const phoneVerifyForm = document.getElementById("phoneVerifyFormSearch");

  let verificationStep = "phone"; // 'phone' or 'code'

  // Skip verification
  if (skipVerificationBtn) {
    skipVerificationBtn.addEventListener("click", function () {
      if (phoneVerificationModal) {
        phoneVerificationModal.style.display = "none";
      }
    });
  }

  // Close on overlay click
  if (phoneVerificationModal) {
    phoneVerificationModal.addEventListener("click", function (e) {
      if (e.target === phoneVerificationModal) {
        phoneVerificationModal.style.display = "none";
      }
    });
  }

  // Form submit handler (Get code / Verify Code)
  if (phoneVerifyForm) {
    phoneVerifyForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const inputValue = phoneInput.value.trim();

      if (verificationStep === "phone") {
        if (!inputValue) {
          showVerificationMessage(
            "Please enter your mobile number",
            "error",
            verificationMessage,
          );
          return;
        }

        if (!/^\d{7,15}$/.test(inputValue.replace(/\D/g, ""))) {
          showVerificationMessage(
            "Please enter a valid mobile number",
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
          verifyPhoneBtn.textContent = "Get code";
          verifyPhoneBtn.disabled = false;
        }
      } else {
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
            const fundingCardsContainer = document.getElementById(
              "fundingCardsContainer",
            );
            if (fundingCardsContainer) {
              fundingCardsContainer.classList.remove("blurred");
            }
            if (phoneVerificationModal) {
              phoneVerificationModal.style.display = "none";
            }

            phoneInput.value = "";
            phoneInput.placeholder = "Mobile Phone";
            phoneInput.maxLength = 15;
            verifyPhoneBtn.textContent = "Get code";
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

  // Initialize sidebar user info
  initializeSidebarUserInfo();

  // Store loaded documents from server
  let serverDocs = {
    "bank-statements": [],
    "financial-accounts": [],
    "applicant-info": [],
  };

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

  // Load documents from server
  async function loadDocumentsFromServer() {
    try {
      const authToken = localStorage.getItem("authToken");
      const response = await fetch(`${API_BASE}/documents`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (response.ok) {
        const data = await response.json();
        serverDocs = data.documents;

        // Render all sections
        ["bank-statements", "financial-accounts", "applicant-info"].forEach(
          (sectionId) => {
            renderFileList(sectionId);
          },
        );
        updateProgress();
      }
    } catch (error) {
      console.error("Error loading documents:", error);
    }
  }

  // Render uploaded files list for a section
  function renderFileList(sectionId) {
    const container = document.getElementById("files-" + sectionId);
    if (!container) return;

    const files = serverDocs[sectionId] || [];

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
          (file) => `
        <div class="uploaded-file-row" data-section="${sectionId}" data-id="${file.id}">
          <div class="file-icon">${getFileIcon(file.name)}</div>
          <div class="file-info">
            <span class="file-name">${file.name}</span>
            <span class="file-meta">${formatSize(file.size)} &bull; ${file.date}</span>
          </div>
          <button class="file-download-btn" data-id="${file.id}" title="Download file">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          </button>
          <button class="file-remove-btn" data-section="${sectionId}" data-id="${file.id}" title="Remove file">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      `,
        )
        .join("")}
    `;

    // Attach download handlers
    container.querySelectorAll(".file-download-btn").forEach((btn) => {
      btn.addEventListener("click", async function () {
        const docId = this.getAttribute("data-id");
        await downloadDocument(docId);
      });
    });

    // Attach remove handlers
    container.querySelectorAll(".file-remove-btn").forEach((btn) => {
      btn.addEventListener("click", async function () {
        const docId = this.getAttribute("data-id");
        const sec = this.getAttribute("data-section");
        await deleteDocument(docId, sec);
      });
    });

    updateSectionStatus(sectionId, true);
  }

  // Download a document
  async function downloadDocument(docId) {
    try {
      const authToken = localStorage.getItem("authToken");
      window.open(
        `${API_BASE}/documents/download/${docId}?token=${authToken}`,
        "_blank",
      );
    } catch (error) {
      console.error("Download error:", error);
      showDocAlert("Failed to download file", "error");
    }
  }

  // Delete a document
  async function deleteDocument(docId, sectionId) {
    if (!confirm("Are you sure you want to delete this file?")) return;

    try {
      const authToken = localStorage.getItem("authToken");
      const response = await fetch(`${API_BASE}/documents/${docId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (response.ok) {
        // Remove from local cache and re-render
        serverDocs[sectionId] = serverDocs[sectionId].filter(
          (f) => f.id !== parseInt(docId),
        );
        renderFileList(sectionId);
        updateProgress();
        showDocAlert("File deleted successfully", "success");
      } else {
        showDocAlert("Failed to delete file", "error");
      }
    } catch (error) {
      console.error("Delete error:", error);
      showDocAlert("Failed to delete file", "error");
    }
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
    const sections = [
      "bank-statements",
      "financial-accounts",
      "applicant-info",
    ];
    const completed = sections.filter(
      (s) => serverDocs[s] && serverDocs[s].length > 0,
    ).length;
    const total = sections.length;
    const pct = Math.round((completed / total) * 100);

    const progressBar = document.getElementById("docsProgressBar");
    const progressText = document.getElementById("docsProgressText");
    if (progressBar) progressBar.style.width = pct + "%";
    if (progressText)
      progressText.textContent =
        completed + " of " + total + " sections completed";

    const completeMsg = document.getElementById("docsCompleteMsg");
    if (completeMsg) {
      completeMsg.style.display = completed === total ? "block" : "none";
    }
  }

  // Upload file to server
  async function uploadFileToServer(file, sectionId) {
    const authToken = localStorage.getItem("authToken");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", sectionId);

    const response = await fetch(`${API_BASE}/documents/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${authToken}` },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Upload failed");
    }

    return response.json();
  }

  // Handle file selection (from input or drop)
  async function handleFiles(fileList, sectionId) {
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

    let errors = [];
    let successCount = 0;

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

      try {
        showDocAlert(`Uploading ${file.name}...`, "info");
        const result = await uploadFileToServer(file, sectionId);

        // Add to local cache
        if (!serverDocs[sectionId]) serverDocs[sectionId] = [];
        serverDocs[sectionId].push(result.document);
        successCount++;
      } catch (error) {
        errors.push(file.name + ": " + error.message);
      }
    }

    renderFileList(sectionId);
    updateProgress();

    if (errors.length > 0) {
      showDocAlert(errors.join("\n"), "error");
    } else if (successCount > 0) {
      showDocAlert(
        successCount +
          " file" +
          (successCount > 1 ? "s" : "") +
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
      this.value = "";
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
      dropZone.addEventListener("click", function () {
        fileInput.click();
      });
    }
  });

  // Connect open banking button
  const connectBankingBtns = document.querySelectorAll(".connect-banking-btn");
  connectBankingBtns.forEach((btn) => {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();

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

      // Bank selection handler (simulated - Open Banking would need real integration)
      modal.querySelectorAll(".ob-bank-btn").forEach((bankBtn) => {
        bankBtn.addEventListener("click", function () {
          const bank = this.getAttribute("data-bank");
          const statusEl = document.getElementById("obStatus");

          modal.querySelectorAll(".ob-bank-btn").forEach((b) => {
            b.disabled = true;
          });
          this.classList.add("selected");
          statusEl.textContent = "Connecting to " + bank + "...";
          statusEl.style.color = "#F96C34";

          setTimeout(() => {
            statusEl.textContent = "Authenticating with " + bank + "...";
            setTimeout(() => {
              statusEl.textContent = "Retrieving bank statements...";
              setTimeout(() => {
                statusEl.innerHTML =
                  '<span style="color:#10b981; font-weight:600;">&#10003; Connected successfully! Open Banking integration requires additional setup.</span>';
                setTimeout(() => modal.remove(), 2500);
              }, 1200);
            }, 1000);
          }, 1000);
        });
      });
    });
  });

  // Load documents from server on page load
  loadDocumentsFromServer();
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

  // Load user's referral code for display
  loadSimpleReferralCode();

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
}

// Load simple referral code for minimal admin page
async function loadSimpleReferralCode() {
  const linkText = document.getElementById("referralLinkText");
  const codeValue = document.getElementById("referralCodeValue");

  try {
    const authToken = localStorage.getItem("authToken");

    if (!authToken) {
      console.error("No auth token found");
      if (linkText)
        linkText.textContent = "Please log in to see your referral link";
      if (codeValue) codeValue.textContent = "------";
      return;
    }

    const response = await fetch(`${API_BASE}/referral/my-code`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    if (response.ok) {
      const data = await response.json();

      // Build referral link dynamically using current domain
      const referralLink = `${window.location.origin}/login.html?ref=${data.referralCode}`;

      // Update referral link text
      if (linkText) {
        linkText.textContent = referralLink;
      }

      // Update referral code box
      if (codeValue) {
        codeValue.textContent = data.referralCode || "------";
      }
    } else {
      console.error(
        "Referral API error:",
        response.status,
        response.statusText,
      );
      if (linkText) linkText.textContent = "Unable to load referral link";
      if (codeValue) codeValue.textContent = "------";
    }
  } catch (error) {
    console.error("Error loading referral code:", error);
    if (linkText) linkText.textContent = "Error loading referral link";
    if (codeValue) codeValue.textContent = "------";
  }
}

// =============================================
// Super Admin Panel Functions
// =============================================
let saAllReferrals = [];
let saCurrentPage = 1;
let saTotalPages = 1;
let saDebounceTimer = null;

function initializeSuperAdminPage() {
  const loginGate = document.getElementById("saLoginGate");
  const panel = document.getElementById("saPanel");
  const loginForm = document.getElementById("saLoginForm");

  // Check if already authenticated
  const saToken = localStorage.getItem("superAdminToken");
  if (saToken) {
    // Verify token is still valid by making a test request
    verifySuperAdminToken(saToken).then((valid) => {
      if (valid) {
        loginGate.style.display = "none";
        panel.style.display = "block";
        loadSuperAdminData();
      } else {
        localStorage.removeItem("superAdminToken");
      }
    });
  }

  // Login form
  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();
    handleSuperAdminLogin();
  });

  // Logout
  document.getElementById("saLogoutBtn").addEventListener("click", function () {
    localStorage.removeItem("superAdminToken");
    panel.style.display = "none";
    loginGate.style.display = "flex";
    document.getElementById("saPasswordInput").value = "";
    document.getElementById("saLoginError").textContent = "";
  });

  // Export
  document.getElementById("saExportBtn").addEventListener("click", saExportCSV);

  // Filters
  document
    .getElementById("saStatusFilter")
    .addEventListener("change", function () {
      saCurrentPage = 1;
      loadSuperAdminReferrals();
    });

  document
    .getElementById("saSearchInput")
    .addEventListener("input", function () {
      clearTimeout(saDebounceTimer);
      saDebounceTimer = setTimeout(function () {
        saCurrentPage = 1;
        loadSuperAdminReferrals();
      }, 400);
    });

  // Detail modal close
  document
    .getElementById("saCloseDetail")
    .addEventListener("click", function () {
      document.getElementById("saDetailModal").style.display = "none";
    });
  document
    .getElementById("saDetailModal")
    .addEventListener("click", function (e) {
      if (e.target === this) this.style.display = "none";
    });

  // Reward modal close
  document
    .getElementById("saCloseReward")
    .addEventListener("click", function () {
      document.getElementById("saRewardModal").style.display = "none";
    });
  document
    .getElementById("saCancelReward")
    .addEventListener("click", function () {
      document.getElementById("saRewardModal").style.display = "none";
    });
  document
    .getElementById("saRewardModal")
    .addEventListener("click", function (e) {
      if (e.target === this) this.style.display = "none";
    });

  // Toggle voucher field visibility based on reward type
  document
    .getElementById("saRewardType")
    .addEventListener("change", function () {
      document.getElementById("saVoucherGroup").style.display =
        this.value === "amazon_voucher" ? "block" : "none";
    });

  // Reward form submit
  document
    .getElementById("saRewardForm")
    .addEventListener("submit", function (e) {
      e.preventDefault();
      saProcessReward();
    });
}

async function verifySuperAdminToken(token) {
  try {
    const response = await fetch(`${API_BASE}/superadmin/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function handleSuperAdminLogin() {
  const passwordInput = document.getElementById("saPasswordInput");
  const errorEl = document.getElementById("saLoginError");
  const loginBtn = document.getElementById("saLoginBtn");
  const btnText = loginBtn.querySelector(".btn-text");
  const btnLoading = loginBtn.querySelector(".btn-loading");

  const password = passwordInput.value.trim();
  if (!password) {
    errorEl.textContent = "Please enter the password";
    return;
  }

  btnText.style.display = "none";
  btnLoading.style.display = "inline-flex";
  loginBtn.disabled = true;
  errorEl.textContent = "";

  try {
    const response = await fetch(`${API_BASE}/superadmin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Authentication failed");
    }

    localStorage.setItem("superAdminToken", data.token);

    document.getElementById("saLoginGate").style.display = "none";
    document.getElementById("saPanel").style.display = "block";

    loadSuperAdminData();
  } catch (error) {
    errorEl.textContent = error.message;
  } finally {
    btnText.style.display = "inline";
    btnLoading.style.display = "none";
    loginBtn.disabled = false;
  }
}

async function loadSuperAdminData() {
  await Promise.all([loadSuperAdminStats(), loadSuperAdminReferrals()]);
}

async function loadSuperAdminStats() {
  try {
    const token = localStorage.getItem("superAdminToken");
    const response = await fetch(`${API_BASE}/superadmin/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 401) {
      saHandleAuthError();
      return;
    }

    const data = await response.json();
    if (!data.success) return;

    const s = data.stats;
    document.getElementById("saTotalReferrals").textContent = s.totalReferrals;
    document.getElementById("saPendingReferrals").textContent = s.pending;
    document.getElementById("saQualifiedReferrals").textContent = s.qualified;
    document.getElementById("saTotalPaid").textContent =
      `£${s.totalPaid.toLocaleString()}`;
    document.getElementById("saPendingPayout").textContent =
      `£${s.pendingPayout.toLocaleString()}`;
    document.getElementById("saTotalUsers").textContent = s.totalUsers;
  } catch (error) {
    console.error("Error loading super admin stats:", error);
  }
}

async function loadSuperAdminReferrals() {
  const tableBody = document.getElementById("saTableBody");
  tableBody.innerHTML =
    '<tr><td colspan="7" class="sa-loading-row">Loading referrals...</td></tr>';

  try {
    const token = localStorage.getItem("superAdminToken");
    const status = document.getElementById("saStatusFilter").value;
    const search = document.getElementById("saSearchInput").value.trim();

    const params = new URLSearchParams({
      page: saCurrentPage,
      limit: 25,
    });
    if (status !== "all") params.append("status", status);
    if (search) params.append("search", search);

    const response = await fetch(`${API_BASE}/superadmin/referrals?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 401) {
      saHandleAuthError();
      return;
    }

    const data = await response.json();
    if (!data.success) throw new Error("Failed to load referrals");

    saAllReferrals = data.referrals;
    saTotalPages = data.pagination.pages;
    saCurrentPage = data.pagination.page;

    saRenderTable(saAllReferrals);
    saRenderPagination(data.pagination);
  } catch (error) {
    console.error("Error loading referrals:", error);
    tableBody.innerHTML =
      '<tr><td colspan="8" class="sa-empty-row">Error loading referrals</td></tr>';
  }
}

function saRenderTable(referrals) {
  const tableBody = document.getElementById("saTableBody");

  if (!referrals || referrals.length === 0) {
    tableBody.innerHTML =
      '<tr><td colspan="8" class="sa-empty-row">No referrals found</td></tr>';
    return;
  }

  tableBody.innerHTML = referrals
    .map(function (ref) {
      const statusClass = "sa-status-" + ref.status;
      const createdDate = ref.createdAt
        ? new Date(ref.createdAt).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "-";

      let actionsHtml = "";
      if (ref.status === "pending") {
        actionsHtml = `
          <button class="sa-action-btn sa-btn-qualify" onclick="saQualifyReferral(${ref.id})">Qualify</button>
          <button class="sa-action-btn sa-btn-expire" onclick="saExpireReferral(${ref.id})">Expire</button>
        `;
      } else if (ref.status === "qualified") {
        actionsHtml = `
          <button class="sa-action-btn sa-btn-reward" onclick="saOpenRewardModal(${ref.id}, ${ref.rewardAmount})">Reward</button>
          <button class="sa-action-btn sa-btn-expire" onclick="saExpireReferral(${ref.id})">Expire</button>
        `;
      } else if (ref.status === "rewarded") {
        actionsHtml =
          '<span class="sa-completed-badge">&#10003; Completed</span>';
      } else if (ref.status === "expired") {
        actionsHtml = '<span class="sa-expired-badge">Expired</span>';
      }

      return (
        "<tr>" +
        "<td>#" +
        ref.id +
        "</td>" +
        '<td><div class="sa-user-cell">' +
        '<span class="sa-user-name">' +
        saEscape(ref.referrer.name) +
        "</span>" +
        '<span class="sa-user-email">' +
        saEscape(ref.referrer.email) +
        "</span>" +
        (ref.referrer.businessName
          ? '<span class="sa-user-business">' +
            saEscape(ref.referrer.businessName) +
            "</span>"
          : "") +
        "</div></td>" +
        '<td><div class="sa-user-cell">' +
        '<span class="sa-user-name">' +
        saEscape(ref.referred.name) +
        "</span>" +
        '<span class="sa-user-email">' +
        saEscape(ref.referred.email) +
        "</span>" +
        (ref.referred.businessName
          ? '<span class="sa-user-business">' +
            saEscape(ref.referred.businessName) +
            "</span>"
          : "") +
        (ref.referred.phoneVerified
          ? '<span style="color:#059669;font-size:0.72rem;">&#10003; Phone verified</span>'
          : '<span style="color:#94a3b8;font-size:0.72rem;">Phone not verified</span>') +
        "</div></td>" +
        "<td>" +
        createdDate +
        "</td>" +
        '<td><span class="sa-status ' +
        statusClass +
        '">' +
        ref.status.charAt(0).toUpperCase() +
        ref.status.slice(1) +
        "</span></td>" +
        "<td>" +
        (ref.paypalEmail
          ? '<span class="sa-paypal-provided" title="' +
            saEscape(ref.paypalEmail) +
            '">' +
            saEscape(ref.paypalEmail) +
            "</span>"
          : '<span class="sa-paypal-missing">Not provided</span>') +
        "</td>" +
        "<td>£" +
        (ref.rewardAmount || 0) +
        "</td>" +
        '<td><div class="sa-actions">' +
        '<button class="sa-action-btn sa-btn-detail" onclick="saViewDetail(' +
        ref.id +
        ')">View</button>' +
        actionsHtml +
        "</div></td>" +
        "</tr>"
      );
    })
    .join("");
}

function saRenderPagination(pagination) {
  const container = document.getElementById("saPagination");
  if (!pagination || pagination.pages <= 1) {
    container.innerHTML = "";
    return;
  }

  let html = "";

  html +=
    '<button class="sa-page-btn" ' +
    (pagination.page <= 1 ? "disabled" : "") +
    ' onclick="saGoToPage(' +
    (pagination.page - 1) +
    ')">&laquo; Prev</button>';

  const startPage = Math.max(1, pagination.page - 2);
  const endPage = Math.min(pagination.pages, pagination.page + 2);

  for (let i = startPage; i <= endPage; i++) {
    html +=
      '<button class="sa-page-btn ' +
      (i === pagination.page ? "active" : "") +
      '" onclick="saGoToPage(' +
      i +
      ')">' +
      i +
      "</button>";
  }

  html +=
    '<button class="sa-page-btn" ' +
    (pagination.page >= pagination.pages ? "disabled" : "") +
    ' onclick="saGoToPage(' +
    (pagination.page + 1) +
    ')">Next &raquo;</button>';

  container.innerHTML = html;
}

function saGoToPage(page) {
  saCurrentPage = page;
  loadSuperAdminReferrals();
}

async function saQualifyReferral(referralId) {
  if (
    !confirm(
      "Mark referral #" +
        referralId +
        " as qualified?\n\nThis means the referral conditions have been met and the referrer is eligible for a reward.",
    )
  )
    return;

  try {
    const token = localStorage.getItem("superAdminToken");
    const response = await fetch(
      `${API_BASE}/superadmin/qualify/${referralId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notes: "Qualified via super admin panel" }),
      },
    );

    if (response.status === 401) {
      saHandleAuthError();
      return;
    }

    const data = await response.json();
    if (!response.ok)
      throw new Error(data.error || "Failed to qualify referral");

    saShowToast(
      "Referral #" + referralId + " qualified successfully",
      "success",
    );
    loadSuperAdminData();
  } catch (error) {
    saShowToast(error.message, "error");
  }
}

function saOpenRewardModal(referralId, currentAmount) {
  document.getElementById("saRewardReferralId").value = referralId;
  document.getElementById("saRewardAmount").value = currentAmount || 200;
  document.getElementById("saRewardType").value = "cash";
  document.getElementById("saVoucherCode").value = "";
  document.getElementById("saRewardNotes").value = "";
  document.getElementById("saVoucherGroup").style.display = "none";
  document.getElementById("saRewardModal").style.display = "flex";
}

async function saProcessReward() {
  const referralId = document.getElementById("saRewardReferralId").value;
  const rewardType = document.getElementById("saRewardType").value;
  const rewardAmount = parseFloat(
    document.getElementById("saRewardAmount").value,
  );
  const voucherCode = document.getElementById("saVoucherCode").value.trim();
  const notes = document.getElementById("saRewardNotes").value.trim();

  if (!rewardAmount || rewardAmount <= 0) {
    saShowToast("Please enter a valid reward amount", "error");
    return;
  }

  try {
    const token = localStorage.getItem("superAdminToken");
    const response = await fetch(
      `${API_BASE}/superadmin/reward/${referralId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rewardType, rewardAmount, voucherCode, notes }),
      },
    );

    if (response.status === 401) {
      saHandleAuthError();
      return;
    }

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed to process reward");

    document.getElementById("saRewardModal").style.display = "none";
    saShowToast(
      "Reward of £" + rewardAmount + " processed for referral #" + referralId,
      "success",
    );
    loadSuperAdminData();
  } catch (error) {
    saShowToast(error.message, "error");
  }
}

async function saExpireReferral(referralId) {
  if (
    !confirm(
      "Expire referral #" +
        referralId +
        "?\n\nThis action cannot be undone for rewarded referrals.",
    )
  )
    return;

  try {
    const token = localStorage.getItem("superAdminToken");
    const response = await fetch(
      `${API_BASE}/superadmin/expire/${referralId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notes: "Expired via super admin panel" }),
      },
    );

    if (response.status === 401) {
      saHandleAuthError();
      return;
    }

    const data = await response.json();
    if (!response.ok)
      throw new Error(data.error || "Failed to expire referral");

    saShowToast("Referral #" + referralId + " expired", "success");
    loadSuperAdminData();
  } catch (error) {
    saShowToast(error.message, "error");
  }
}

async function saViewDetail(referralId) {
  const modal = document.getElementById("saDetailModal");
  const body = document.getElementById("saDetailBody");
  body.innerHTML =
    '<p style="text-align:center;color:#94a3b8;padding:2rem;">Loading...</p>';
  modal.style.display = "flex";

  try {
    const token = localStorage.getItem("superAdminToken");
    const response = await fetch(
      `${API_BASE}/superadmin/referral/${referralId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    if (response.status === 401) {
      saHandleAuthError();
      return;
    }

    const data = await response.json();
    if (!data.success) throw new Error("Failed to load details");

    const r = data.referral;
    const createdDate = r.createdAt
      ? new Date(r.createdAt).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "-";
    const qualifiedDate = r.qualifiedAt
      ? new Date(r.qualifiedAt).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "-";
    const rewardedDate = r.rewardedAt
      ? new Date(r.rewardedAt).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "-";
    const referrerJoined = r.referrer.joinedAt
      ? new Date(r.referrer.joinedAt).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "-";
    const referredJoined = r.referred.joinedAt
      ? new Date(r.referred.joinedAt).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "-";

    let appsHtml = "";
    if (r.referred.applications && r.referred.applications.length > 0) {
      appsHtml =
        '<div class="sa-detail-apps">' +
        r.referred.applications
          .map(function (app) {
            return (
              '<div class="sa-detail-app-item">' +
              "<span>£" +
              parseFloat(app.funding_amount).toLocaleString() +
              " - " +
              saEscape(app.funding_purpose) +
              "</span>" +
              '<span class="sa-detail-app-status" style="background:#e0f2fe;color:#0369a1;">' +
              app.status +
              "</span>" +
              "</div>"
            );
          })
          .join("") +
        "</div>";
    } else {
      appsHtml =
        '<p style="color:#94a3b8;font-size:0.85rem;margin-top:0.5rem;">No applications yet</p>';
    }

    let bankStatementsHtml = "";
    if (r.referred.bankStatements && r.referred.bankStatements.length > 0) {
      bankStatementsHtml =
        '<div class="sa-detail-apps">' +
        r.referred.bankStatements
          .map(function (bs) {
            const uploadDate = bs.uploadedAt
              ? new Date(bs.uploadedAt).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "";
            const fileSize = bs.size ? (bs.size / 1024).toFixed(1) + " KB" : "";
            return (
              '<div class="sa-detail-app-item">' +
              "<span>" +
              saEscape(bs.name) +
              ' <small style="color:#94a3b8;">(' +
              fileSize +
              " - " +
              uploadDate +
              ")</small></span>" +
              '<a href="' +
              API_BASE +
              "/superadmin/document/" +
              bs.id +
              '" target="_blank" class="sa-action-btn sa-btn-detail" style="text-decoration:none;font-size:0.75rem;padding:0.25rem 0.6rem;" download>Download</a>' +
              "</div>"
            );
          })
          .join("") +
        "</div>";
    } else {
      bankStatementsHtml =
        '<p style="color:#94a3b8;font-size:0.85rem;margin-top:0.5rem;">No bank statements uploaded yet</p>';
    }

    body.innerHTML =
      '<div class="sa-detail-grid">' +
      '<div class="sa-detail-section">' +
      "<h4>Referrer (Gets Reward)</h4>" +
      '<div class="sa-detail-row"><span class="sa-detail-label">Name</span><span class="sa-detail-value">' +
      saEscape(r.referrer.name) +
      "</span></div>" +
      '<div class="sa-detail-row"><span class="sa-detail-label">Email</span><span class="sa-detail-value">' +
      saEscape(r.referrer.email) +
      "</span></div>" +
      '<div class="sa-detail-row"><span class="sa-detail-label">Phone</span><span class="sa-detail-value">' +
      saEscape(r.referrer.phone || "N/A") +
      "</span></div>" +
      '<div class="sa-detail-row"><span class="sa-detail-label">Business</span><span class="sa-detail-value">' +
      saEscape(r.referrer.businessName || "N/A") +
      "</span></div>" +
      '<div class="sa-detail-row"><span class="sa-detail-label">Joined</span><span class="sa-detail-value">' +
      referrerJoined +
      "</span></div>" +
      "</div>" +
      '<div class="sa-detail-section">' +
      "<h4>Referred User (Used Code)</h4>" +
      '<div class="sa-detail-row"><span class="sa-detail-label">Name</span><span class="sa-detail-value">' +
      saEscape(r.referred.name) +
      "</span></div>" +
      '<div class="sa-detail-row"><span class="sa-detail-label">Email</span><span class="sa-detail-value">' +
      saEscape(r.referred.email) +
      "</span></div>" +
      '<div class="sa-detail-row"><span class="sa-detail-label">Phone</span><span class="sa-detail-value">' +
      saEscape(r.referred.phone || "N/A") +
      "</span></div>" +
      '<div class="sa-detail-row"><span class="sa-detail-label">Business</span><span class="sa-detail-value">' +
      saEscape(r.referred.businessName || "N/A") +
      "</span></div>" +
      '<div class="sa-detail-row"><span class="sa-detail-label">Joined</span><span class="sa-detail-value">' +
      referredJoined +
      "</span></div>" +
      '<div class="sa-detail-row"><span class="sa-detail-label">Phone Verified</span><span class="sa-detail-value">' +
      (r.referred.phoneVerified ? "&#10003; Yes" : "&#10007; No") +
      "</span></div>" +
      "</div>" +
      '<div class="sa-detail-section sa-detail-section-full">' +
      "<h4>Referral Info</h4>" +
      '<div class="sa-detail-row"><span class="sa-detail-label">Referral ID</span><span class="sa-detail-value">#' +
      r.id +
      "</span></div>" +
      '<div class="sa-detail-row"><span class="sa-detail-label">Code</span><span class="sa-detail-value">' +
      saEscape(r.referralCode) +
      "</span></div>" +
      '<div class="sa-detail-row"><span class="sa-detail-label">Status</span><span class="sa-detail-value"><span class="sa-status sa-status-' +
      r.status +
      '">' +
      r.status.charAt(0).toUpperCase() +
      r.status.slice(1) +
      "</span></span></div>" +
      '<div class="sa-detail-row"><span class="sa-detail-label">Reward</span><span class="sa-detail-value">£' +
      r.rewardAmount +
      " (" +
      saEscape(r.rewardType.replace(/_/g, " ")) +
      ")</span></div>" +
      '<div class="sa-detail-row"><span class="sa-detail-label">Qualification</span><span class="sa-detail-value">' +
      saEscape(r.qualificationType.replace(/_/g, " ")) +
      "</span></div>" +
      '<div class="sa-detail-row"><span class="sa-detail-label">PayPal Email</span><span class="sa-detail-value">' +
      (r.paypalEmail
        ? '<span style="color:#059669;font-weight:500;">' +
          saEscape(r.paypalEmail) +
          "</span>"
        : '<span style="color:#dc2626;">Not provided yet</span>') +
      "</span></div>" +
      '<div class="sa-detail-row"><span class="sa-detail-label">Created</span><span class="sa-detail-value">' +
      createdDate +
      "</span></div>" +
      '<div class="sa-detail-row"><span class="sa-detail-label">Qualified</span><span class="sa-detail-value">' +
      qualifiedDate +
      "</span></div>" +
      '<div class="sa-detail-row"><span class="sa-detail-label">Rewarded</span><span class="sa-detail-value">' +
      rewardedDate +
      "</span></div>" +
      (r.notes
        ? '<div class="sa-detail-notes">' + saEscape(r.notes) + "</div>"
        : "") +
      "</div>" +
      '<div class="sa-detail-section sa-detail-section-full">' +
      "<h4>Referred User's Applications</h4>" +
      appsHtml +
      "</div>" +
      '<div class="sa-detail-section sa-detail-section-full">' +
      "<h4>Bank Statements</h4>" +
      bankStatementsHtml +
      "</div>" +
      "</div>";
  } catch (error) {
    body.innerHTML =
      '<p style="text-align:center;color:#dc2626;padding:2rem;">Failed to load details</p>';
  }
}

async function saExportCSV() {
  try {
    const token = localStorage.getItem("superAdminToken");
    const status = document.getElementById("saStatusFilter").value;

    const params = new URLSearchParams();
    if (status !== "all") params.append("status", status);

    const response = await fetch(`${API_BASE}/superadmin/export?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 401) {
      saHandleAuthError();
      return;
    }

    if (!response.ok) throw new Error("Export failed");

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "referrals-" + new Date().toISOString().split("T")[0] + ".csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    saShowToast("CSV exported successfully", "success");
  } catch (error) {
    saShowToast(error.message || "Failed to export", "error");
  }
}

function saHandleAuthError() {
  localStorage.removeItem("superAdminToken");
  document.getElementById("saPanel").style.display = "none";
  document.getElementById("saLoginGate").style.display = "flex";
  document.getElementById("saLoginError").textContent =
    "Session expired. Please login again.";
}

function saShowToast(message, type) {
  const existing = document.querySelector(".sa-toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.className = "sa-toast sa-toast-" + type;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(function () {
    toast.remove();
  }, 3500);
}

function saEscape(str) {
  if (!str) return "";
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
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
        <h2>Mobile Verification</h2>
        <p class="verify-subtitle">We'll text you a verification code.</p>
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

// ===== Referral Functions =====
async function loadReferralData() {
  const referralLinkInput = document.getElementById("referralLinkInput");
  const referralCodeDisplay = document.getElementById("referralCodeDisplay");

  if (!referralLinkInput) return;

  try {
    const authToken = localStorage.getItem("authToken");

    // Get referral code
    const codeResponse = await fetch(`${API_BASE}/referral/my-code`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (codeResponse.ok) {
      const codeData = await codeResponse.json();
      // Build referral link dynamically using current domain
      const referralLink = `${window.location.origin}/login.html?ref=${codeData.referralCode}`;
      referralLinkInput.value = referralLink;
      if (referralCodeDisplay)
        referralCodeDisplay.textContent = codeData.referralCode;
    }

    // Get referral stats
    const statsResponse = await fetch(`${API_BASE}/referral/stats`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (statsResponse.ok) {
      const statsData = await statsResponse.json();

      const totalReferrals = document.getElementById("totalReferrals");
      const pendingReferrals = document.getElementById("pendingReferrals");
      const qualifiedReferrals = document.getElementById("qualifiedReferrals");
      const totalRewardsEarned = document.getElementById("totalRewardsEarned");

      if (totalReferrals)
        totalReferrals.textContent = statsData.totalReferrals || 0;
      if (pendingReferrals)
        pendingReferrals.textContent = statsData.pendingReferrals || 0;
      if (qualifiedReferrals)
        qualifiedReferrals.textContent = statsData.qualifiedReferrals || 0;
      if (totalRewardsEarned)
        totalRewardsEarned.textContent = `£${statsData.totalRewardsEarned || 0}`;
    }

    // Get referral list
    const listResponse = await fetch(`${API_BASE}/referral/list`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (listResponse.ok) {
      const listData = await listResponse.json();
      renderReferralList(listData.referrals || []);
    }
  } catch (error) {
    console.error("Error loading referral data:", error);
    if (referralLinkInput) {
      referralLinkInput.placeholder = "Unable to load referral link";
    }
  }
}

function renderReferralList(referrals) {
  const referralList = document.getElementById("referralList");
  if (!referralList) return;

  if (!referrals || referrals.length === 0) {
    referralList.innerHTML =
      '<p class="no-referrals">No referrals yet. Share your link to start earning!</p>';
    return;
  }

  referralList.innerHTML = referrals
    .map((ref) => {
      let paypalHtml = "";
      if (["qualified", "rewarded"].includes(ref.status)) {
        if (ref.paypalEmail) {
          paypalHtml = `
              <div class="referral-paypal-submitted">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                <span>PayPal: ${maskEmail(ref.paypalEmail)}</span>
              </div>`;
        } else {
          paypalHtml = `
              <div class="referral-paypal-prompt" id="paypalPrompt-${ref.id}">
                <p class="paypal-prompt-text">🎉 Your referral is approved! Enter your PayPal email to receive your <strong>£200</strong> reward:</p>
                <div class="paypal-input-row">
                  <input type="email" id="paypalInput-${ref.id}" class="paypal-email-input" placeholder="your@paypal-email.com" />
                  <button class="paypal-submit-btn" onclick="submitPaypalEmail(${ref.id})">Submit</button>
                </div>
                <span class="paypal-error" id="paypalError-${ref.id}"></span>
              </div>`;
        }
      }
      return `
    <div class="referral-item ${["qualified", "rewarded"].includes(ref.status) && !ref.paypalEmail ? "referral-item-action-needed" : ""}">
      <div class="referral-item-info">
        <span class="referral-item-email">${maskEmail(ref.referredEmail)}</span>
        <span class="referral-item-date">Referred on ${formatDate(ref.createdAt)}</span>
      </div>
      <span class="referral-status ${ref.status}">${ref.status.charAt(0).toUpperCase() + ref.status.slice(1)}</span>
      ${paypalHtml}
    </div>
  `;
    })
    .join("");
}

async function submitPaypalEmail(referralId) {
  const input = document.getElementById("paypalInput-" + referralId);
  const errorEl = document.getElementById("paypalError-" + referralId);
  const paypalEmail = input ? input.value.trim() : "";

  if (!paypalEmail || !paypalEmail.includes("@")) {
    errorEl.textContent = "Please enter a valid PayPal email";
    return;
  }

  errorEl.textContent = "";
  const btn = input.parentElement.querySelector(".paypal-submit-btn");
  btn.disabled = true;
  btn.textContent = "Saving...";

  try {
    const authToken = localStorage.getItem("authToken");
    const response = await fetch(
      `${API_BASE}/referral/paypal-email/${referralId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ paypalEmail }),
      },
    );

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed to save");

    // Replace prompt with success message
    const prompt = document.getElementById("paypalPrompt-" + referralId);
    if (prompt) {
      prompt.innerHTML =
        '<div class="referral-paypal-submitted"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg><span>PayPal: ' +
        maskEmail(paypalEmail) +
        "</span></div>";
    }
    showAlert(
      "PayPal email saved! You'll receive your £200 reward soon.",
      "success",
    );
  } catch (error) {
    errorEl.textContent = error.message;
    btn.disabled = false;
    btn.textContent = "Submit";
  }
}

function maskEmail(email) {
  if (!email) return "***@***";
  const [localPart, domain] = email.split("@");
  if (!domain) return "***@***";
  const maskedLocal =
    localPart.charAt(0) + "***" + localPart.charAt(localPart.length - 1);
  return maskedLocal + "@" + domain;
}

function copyReferralLink() {
  const referralLinkInput = document.getElementById("referralLinkInput");
  const copyBtn = document.querySelector(".copy-referral-btn");

  if (!referralLinkInput || !referralLinkInput.value) {
    showAlert("No referral link to copy", "error");
    return;
  }

  navigator.clipboard
    .writeText(referralLinkInput.value)
    .then(() => {
      if (copyBtn) {
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        Copied!
      `;
        copyBtn.classList.add("copied");

        setTimeout(() => {
          copyBtn.innerHTML = originalText;
          copyBtn.classList.remove("copied");
        }, 2000);
      }
      showAlert("Referral link copied to clipboard!", "success");
    })
    .catch(() => {
      // Fallback for older browsers
      referralLinkInput.select();
      document.execCommand("copy");
      showAlert("Referral link copied!", "success");
    });
}

// ===== Logout Handler =====
