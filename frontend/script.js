// ===== API Configuration =====
const API_BASE = "http://localhost:3000/api";

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
            // Guest users go to results (blurred), logged-in users go to dashboard
            const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
            window.location.href = isLoggedIn
              ? "dashboard.html"
              : "results.html";
          }, 1000);
        } catch (error) {
          console.error("Submission error:", error);
          // Still redirect even if API fails (offline mode)
          submitBtn.innerHTML = "✓ Submitted!";
          showAlert("Application saved! Redirecting...", "success");

          setTimeout(() => {
            const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
            window.location.href = isLoggedIn
              ? "dashboard.html"
              : "results.html";
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

    // Store auth token and user data
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
    // Redirect logged-in users away from login page
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    if (isLoggedIn) {
      window.location.href = "dashboard.html";
      return;
    }

    initializeAuthPage();

    // Add forgot password handler
    const forgotPasswordLink = document.querySelector(".forgot-password-link");
    if (forgotPasswordLink) {
      forgotPasswordLink.addEventListener("click", handleForgotPassword);
    }
  }
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

  if (dashboardLink) {
    dashboardLink.addEventListener("click", function (e) {
      e.preventDefault();
      window.location.href = "dashboard.html";
    });
  }

  if (documentsLink) {
    documentsLink.addEventListener("click", function (e) {
      e.preventDefault();
      window.location.href = "documents.html";
    });
  }

  if (searchLink) {
    searchLink.addEventListener("click", function (e) {
      e.preventDefault();
      window.location.href = "search-results.html";
    });
  }

  if (adminLink) {
    adminLink.addEventListener("click", function (e) {
      e.preventDefault();
      window.location.href = "admin.html";
    });
  }

  if (connectedAppsLink) {
    connectedAppsLink.addEventListener("click", function (e) {
      e.preventDefault();
      window.location.href = "dashboard.html#connected-apps";
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

  sidebarItems.forEach((item) => {
    item.addEventListener("click", function (e) {
      // Check if this is an external page link
      const href = this.getAttribute("href");
      if (href && href.endsWith(".html")) {
        // Allow navigation to external pages
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
    const targetSidebarItem = document.querySelector(
      `.sidebar-item[data-section="${hash}"]`,
    );
    if (targetSidebarItem) {
      // Remove active from all sidebar items and sections
      sidebarItems.forEach((i) => i.classList.remove("active"));
      dashboardSections.forEach((s) => (s.style.display = "none"));

      // Activate the target
      targetSidebarItem.classList.add("active");
      const targetSection = document.getElementById(`section-${hash}`);
      if (targetSection) {
        targetSection.style.display = "block";
      }
    }
  }
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

const _fundersData = [
  {
    id: 1,
    name: "Fast Capital",
    loanAmount: "£50,000",
    interestRate: "4.5%",
    term: "36 months",
    apprTime: "2-3 days",
    personalTouch: 7,
    acceptsImpairedCredit: false,
    description: "Fast Capital specialises in rapid unsecured business loans for UK SMEs. With a streamlined digital application process, they focus on getting funds to businesses quickly without requiring property as security.",
    features: ["No early repayment fees", "Dedicated account manager", "Fixed monthly repayments", "No security required"],
    requirements: ["Minimum 2 years trading", "Annual turnover £100k+", "UK registered business"],
    fundingTypes: ["Unsecured Business Loan"],
    minAmount: "£10,000",
    maxAmount: "£50,000",
  },
  {
    id: 2,
    name: "Prime Lenders",
    loanAmount: "£100,000",
    interestRate: "5.2%",
    term: "48 months",
    apprTime: "5-7 days",
    personalTouch: 9,
    acceptsImpairedCredit: false,
    description: "Prime Lenders is a premium funding provider offering competitive rates for established businesses. Known for their personal approach, each client is assigned a senior relationship manager who guides them through the entire process.",
    features: ["Senior relationship manager", "Flexible repayment schedules", "Rate match guarantee", "Same-day decision in principle"],
    requirements: ["Minimum 3 years trading", "Annual turnover £250k+", "Clean credit history", "UK registered limited company"],
    fundingTypes: ["Secured Business Loan", "Commercial Mortgage"],
    minAmount: "£50,000",
    maxAmount: "£500,000",
  },
  {
    id: 3,
    name: "Growth Finance",
    loanAmount: "£75,000",
    interestRate: "4.8%",
    term: "42 months",
    apprTime: "3-4 days",
    personalTouch: 8,
    acceptsImpairedCredit: true,
    description: "Growth Finance works with businesses at all stages, including those with impaired credit. They take a holistic view of your business rather than relying solely on credit scores, making them ideal for growing companies.",
    features: ["Accepts impaired credit", "Revenue-based assessment", "No arrangement fees", "Top-up facility available"],
    requirements: ["Minimum 1 year trading", "Annual turnover £75k+", "Positive business trajectory"],
    fundingTypes: ["Unsecured Business Loan", "Revenue-Based Finance"],
    minAmount: "£25,000",
    maxAmount: "£150,000",
  },
  {
    id: 4,
    name: "Business Capital",
    loanAmount: "£60,000",
    interestRate: "5.5%",
    term: "36 months",
    apprTime: "4-5 days",
    personalTouch: 6,
    acceptsImpairedCredit: true,
    description: "Business Capital provides flexible funding solutions tailored to small and medium enterprises. They specialise in working with businesses that may have been declined elsewhere, offering second-chance lending with fair terms.",
    features: ["Second-chance lending", "Flexible terms", "No hidden charges", "Online portal for account management"],
    requirements: ["Minimum 6 months trading", "Annual turnover £50k+", "UK registered business"],
    fundingTypes: ["Unsecured Business Loan", "Merchant Cash Advance"],
    minAmount: "£5,000",
    maxAmount: "£100,000",
  },
  {
    id: 5,
    name: "Enterprise Loans",
    loanAmount: "£150,000",
    interestRate: "4.2%",
    term: "60 months",
    apprTime: "7-10 days",
    personalTouch: 10,
    acceptsImpairedCredit: false,
    description: "Enterprise Loans is a boutique lender offering premium funding packages for established businesses. Their white-glove service includes a full financial review, bespoke structuring, and ongoing support throughout the loan term.",
    features: ["Bespoke loan structuring", "Full financial review included", "Capital repayment holidays available", "Ongoing business support", "Priority processing"],
    requirements: ["Minimum 3 years trading", "Annual turnover £500k+", "Strong credit profile", "Audited accounts preferred"],
    fundingTypes: ["Secured Business Loan", "Asset Finance", "Commercial Mortgage"],
    minAmount: "£75,000",
    maxAmount: "£1,000,000",
  },
  {
    id: 6,
    name: "Quick Finance",
    loanAmount: "£45,000",
    interestRate: "6.0%",
    term: "24 months",
    apprTime: "1-2 days",
    personalTouch: 4,
    acceptsImpairedCredit: true,
    description: "Quick Finance is the fastest lender on our panel, offering same-day decisions and next-day funding. They use automated underwriting technology to assess applications rapidly, ideal for businesses that need capital urgently.",
    features: ["Same-day decisions", "Next-day funding", "Accepts impaired credit", "Simple online application", "No paperwork required"],
    requirements: ["Minimum 6 months trading", "Minimum monthly revenue £5k", "UK business bank account"],
    fundingTypes: ["Short-Term Business Loan", "Merchant Cash Advance"],
    minAmount: "£5,000",
    maxAmount: "£100,000",
  },
  {
    id: 7,
    name: "Smart Funding",
    loanAmount: "£80,000",
    interestRate: "5.0%",
    term: "48 months",
    apprTime: "3-4 days",
    personalTouch: 8,
    acceptsImpairedCredit: false,
    description: "Smart Funding combines technology with personal service to deliver an exceptional borrowing experience. Their AI-powered platform matches you with the best product while their team ensures everything runs smoothly.",
    features: ["AI-powered matching", "Dedicated support team", "Competitive rates", "Transparent fee structure", "Early repayment options"],
    requirements: ["Minimum 2 years trading", "Annual turnover £150k+", "Good credit history", "UK registered company"],
    fundingTypes: ["Unsecured Business Loan", "Invoice Finance"],
    minAmount: "£20,000",
    maxAmount: "£250,000",
  },
  {
    id: 8,
    name: "Venture Capital",
    loanAmount: "£200,000",
    interestRate: "3.8%",
    term: "72 months",
    apprTime: "10-14 days",
    personalTouch: 9,
    acceptsImpairedCredit: false,
    description: "Venture Capital offers the most competitive rates on our panel for larger loans. They work closely with ambitious businesses looking for significant growth capital, providing not just funding but strategic advice.",
    features: ["Lowest rates available", "Strategic business advice", "Flexible drawdown facility", "Long-term partnerships", "Board-level advisory access"],
    requirements: ["Minimum 5 years trading", "Annual turnover £1m+", "Strong credit profile", "Business plan required", "Security may be required"],
    fundingTypes: ["Secured Business Loan", "Growth Capital", "Commercial Mortgage"],
    minAmount: "£100,000",
    maxAmount: "£2,000,000",
  },
  {
    id: 9,
    name: "Credit Solutions",
    loanAmount: "£55,000",
    interestRate: "5.7%",
    term: "36 months",
    apprTime: "2-3 days",
    personalTouch: 5,
    acceptsImpairedCredit: true,
    description: "Credit Solutions is a specialist lender designed for businesses with less-than-perfect credit. They use alternative data points like bank statements and revenue trends to make fair lending decisions.",
    features: ["Specialist impaired credit lender", "Bank statement-based assessment", "No personal guarantees on smaller loans", "Rapid turnaround"],
    requirements: ["Minimum 1 year trading", "Monthly revenue £3k+", "UK business bank account", "3 months bank statements"],
    fundingTypes: ["Unsecured Business Loan", "Revolving Credit Facility"],
    minAmount: "£5,000",
    maxAmount: "£75,000",
  },
  {
    id: 10,
    name: "Rapid Lenders",
    loanAmount: "£70,000",
    interestRate: "5.3%",
    term: "42 months",
    apprTime: "3-5 days",
    personalTouch: 7,
    acceptsImpairedCredit: true,
    description: "Rapid Lenders bridge the gap between speed and affordability, offering quick decisions without excessive interest rates. They accept businesses with minor credit issues and provide a balanced lending solution.",
    features: ["Quick decisions", "Accepts minor credit issues", "Competitive rates for impaired credit", "Flexible repayment dates", "No broker fees"],
    requirements: ["Minimum 1 year trading", "Annual turnover £80k+", "UK registered business", "No active CCJs over £5k"],
    fundingTypes: ["Unsecured Business Loan", "Asset Finance"],
    minAmount: "£10,000",
    maxAmount: "£150,000",
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
        <div class="funding-card">
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
                <button class="apply-btn" data-funder-id="${funder.id}">Apply Now</button>
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

  // Attach More Details button handlers
  document.querySelectorAll(".more-details-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const funderId = parseInt(this.getAttribute("data-funder-id"));
      const funder = _fundersData.find((f) => f.id === funderId);
      if (funder) showFunderDetailsModal(funder);
    });
  });

  // Attach Apply Now button handlers
  document.querySelectorAll(".apply-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const funderId = parseInt(this.getAttribute("data-funder-id"));
      const funder = _fundersData.find((f) => f.id === funderId);
      if (funder) showApplyModal(funder);
    });
  });
}

// ===== Funder Details Modal =====
function showFunderDetailsModal(funder) {
  // Remove existing modal if any
  const existing = document.getElementById("funderDetailsModal");
  if (existing) existing.remove();

  const modal = document.createElement("div");
  modal.id = "funderDetailsModal";
  modal.className = "funder-modal-overlay";
  modal.innerHTML = `
    <div class="funder-modal-card">
      <button class="funder-modal-close" id="closeFunderDetails">&times;</button>
      <div class="funder-modal-header">
        <h2>${funder.name}</h2>
        <span class="funder-badge">Verified</span>
      </div>
      <p class="funder-modal-desc">${funder.description}</p>

      <div class="funder-modal-grid">
        <div class="funder-modal-stat">
          <span class="stat-label">Loan Amount</span>
          <span class="stat-value highlight">${funder.loanAmount}</span>
        </div>
        <div class="funder-modal-stat">
          <span class="stat-label">Interest Rate</span>
          <span class="stat-value">${funder.interestRate}</span>
        </div>
        <div class="funder-modal-stat">
          <span class="stat-label">Loan Term</span>
          <span class="stat-value">${funder.term}</span>
        </div>
        <div class="funder-modal-stat">
          <span class="stat-label">Approval Time</span>
          <span class="stat-value">${funder.apprTime}</span>
        </div>
        <div class="funder-modal-stat">
          <span class="stat-label">Min Amount</span>
          <span class="stat-value">${funder.minAmount}</span>
        </div>
        <div class="funder-modal-stat">
          <span class="stat-label">Max Amount</span>
          <span class="stat-value">${funder.maxAmount}</span>
        </div>
      </div>

      <div class="funder-modal-section">
        <h3>Funding Types</h3>
        <div class="funder-tags">
          ${funder.fundingTypes.map((t) => `<span class="funder-tag">${t}</span>`).join("")}
        </div>
      </div>

      <div class="funder-modal-section">
        <h3>Key Features</h3>
        <ul class="funder-feature-list">
          ${funder.features.map((f) => `<li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>${f}</li>`).join("")}
        </ul>
      </div>

      <div class="funder-modal-section">
        <h3>Requirements</h3>
        <ul class="funder-req-list">
          ${funder.requirements.map((r) => `<li><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>${r}</li>`).join("")}
        </ul>
      </div>

      <div class="funder-modal-section">
        <h3>Personal Touch Score</h3>
        <div class="personal-touch-bar">
          <div class="touch-fill" style="width: ${funder.personalTouch * 10}%"></div>
        </div>
        <span class="touch-score">${funder.personalTouch}/10</span>
      </div>

      <div class="funder-modal-actions">
        <button class="funder-modal-apply-btn" id="detailsApplyBtn">Apply Now</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // Close modal
  document.getElementById("closeFunderDetails").addEventListener("click", () => {
    modal.remove();
  });
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.remove();
  });

  // Apply button inside details modal
  document.getElementById("detailsApplyBtn").addEventListener("click", () => {
    modal.remove();
    showApplyModal(funder);
  });
}

// ===== Apply Now Modal =====
function showApplyModal(funder) {
  // Remove existing modal if any
  const existing = document.getElementById("applyModal");
  if (existing) existing.remove();

  // Pre-fill from localStorage if available
  const userData = JSON.parse(localStorage.getItem("userData") || "{}");
  const formData = JSON.parse(localStorage.getItem("fundingFormData") || "{}");

  const modal = document.createElement("div");
  modal.id = "applyModal";
  modal.className = "funder-modal-overlay";
  modal.innerHTML = `
    <div class="funder-modal-card apply-modal-card">
      <button class="funder-modal-close" id="closeApplyModal">&times;</button>
      <div class="funder-modal-header">
        <h2>Apply to ${funder.name}</h2>
      </div>
      <p class="funder-modal-desc">Complete the form below to submit your application. We'll connect you with ${funder.name} to discuss your funding needs.</p>

      <div class="apply-summary">
        <div class="apply-summary-item">
          <span>Amount up to</span>
          <strong>${funder.loanAmount}</strong>
        </div>
        <div class="apply-summary-item">
          <span>Rate from</span>
          <strong>${funder.interestRate}</strong>
        </div>
        <div class="apply-summary-item">
          <span>Term</span>
          <strong>${funder.term}</strong>
        </div>
      </div>

      <form id="applyForm" class="apply-form">
        <div class="apply-form-row">
          <div class="apply-form-group">
            <label for="applyFullName">Full Name</label>
            <input type="text" id="applyFullName" placeholder="John Smith" value="${(userData.firstName || '') + (userData.lastName ? ' ' + userData.lastName : '')}" required>
          </div>
          <div class="apply-form-group">
            <label for="applyEmail">Email Address</label>
            <input type="email" id="applyEmail" placeholder="john@company.com" value="${userData.email || ''}" required>
          </div>
        </div>
        <div class="apply-form-row">
          <div class="apply-form-group">
            <label for="applyPhone">Phone Number</label>
            <input type="tel" id="applyPhone" placeholder="07123 456789" value="${userData.phone || ''}" required>
          </div>
          <div class="apply-form-group">
            <label for="applyCompany">Business Name</label>
            <input type="text" id="applyCompany" placeholder="My Company Ltd" value="${userData.companyName || ''}" required>
          </div>
        </div>
        <div class="apply-form-row">
          <div class="apply-form-group">
            <label for="applyAmount">Amount Required (£)</label>
            <input type="text" id="applyAmount" placeholder="e.g. 50000" value="${formData.fundingAmount || ''}" required>
          </div>
          <div class="apply-form-group">
            <label for="applyPurpose">Funding Purpose</label>
            <select id="applyPurpose" required>
              <option value="" disabled ${!formData.fundingPurpose ? 'selected' : ''}>Select purpose</option>
              <option value="Working Capital" ${formData.fundingPurpose === 'Working Capital' ? 'selected' : ''}>Working Capital</option>
              <option value="Equipment Purchase" ${formData.fundingPurpose === 'Equipment Purchase' ? 'selected' : ''}>Equipment Purchase</option>
              <option value="Expansion" ${formData.fundingPurpose === 'Expansion' ? 'selected' : ''}>Expansion</option>
              <option value="Property" ${formData.fundingPurpose === 'Property' ? 'selected' : ''}>Property</option>
              <option value="Refinancing" ${formData.fundingPurpose === 'Refinancing' ? 'selected' : ''}>Refinancing</option>
              <option value="Stock Purchase" ${formData.fundingPurpose === 'Stock Purchase' ? 'selected' : ''}>Stock Purchase</option>
              <option value="Other" ${formData.fundingPurpose === 'Other' ? 'selected' : ''}>Other</option>
            </select>
          </div>
        </div>
        <div class="apply-form-group full-width">
          <label for="applyMessage">Additional Information (optional)</label>
          <textarea id="applyMessage" rows="3" placeholder="Tell us more about your funding needs..."></textarea>
        </div>
        <div class="apply-form-message" id="applyFormMessage"></div>
        <div class="apply-form-actions">
          <button type="button" class="apply-cancel-btn" id="cancelApplyBtn">Cancel</button>
          <button type="submit" class="apply-submit-btn" id="submitApplyBtn">Submit Application</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(modal);

  // Close modal
  document.getElementById("closeApplyModal").addEventListener("click", () => modal.remove());
  document.getElementById("cancelApplyBtn").addEventListener("click", () => modal.remove());
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.remove();
  });

  // Form submission
  document.getElementById("applyForm").addEventListener("submit", function (e) {
    e.preventDefault();
    const msgEl = document.getElementById("applyFormMessage");
    const submitBtn = document.getElementById("submitApplyBtn");

    const fullName = document.getElementById("applyFullName").value.trim();
    const email = document.getElementById("applyEmail").value.trim();
    const phone = document.getElementById("applyPhone").value.trim();
    const company = document.getElementById("applyCompany").value.trim();
    const amount = document.getElementById("applyAmount").value.trim();
    const purpose = document.getElementById("applyPurpose").value;

    if (!fullName || !email || !phone || !company || !amount || !purpose) {
      msgEl.textContent = "Please fill in all required fields.";
      msgEl.className = "apply-form-message error";
      return;
    }

    // Show loading
    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting...";
    msgEl.textContent = "";
    msgEl.className = "apply-form-message";

    // Simulate submission (replace with real API call)
    setTimeout(() => {
      // Store application locally
      const applications = JSON.parse(localStorage.getItem("funderApplications") || "[]");
      applications.push({
        funderId: funder.id,
        funderName: funder.name,
        fullName,
        email,
        phone,
        company,
        amount,
        purpose,
        message: document.getElementById("applyMessage").value.trim(),
        date: new Date().toISOString(),
        status: "Pending Review",
      });
      localStorage.setItem("funderApplications", JSON.stringify(applications));

      msgEl.textContent = "Application submitted successfully! " + funder.name + " will be in touch shortly.";
      msgEl.className = "apply-form-message success";
      submitBtn.textContent = "Submitted ✓";

      setTimeout(() => modal.remove(), 2500);
    }, 1500);
  });
}

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
      numEl.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><path d="M20 6L9 17l-5-5"/></svg>';
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
    const sections = ["bank-statements", "financial-accounts", "applicant-info"];
    const completed = sections.filter((s) => docs[s] && docs[s].length > 0).length;
    const total = sections.length;
    const pct = Math.round((completed / total) * 100);

    const progressBar = document.getElementById("docsProgressBar");
    const progressText = document.getElementById("docsProgressText");
    if (progressBar) progressBar.style.width = pct + "%";
    if (progressText) progressText.textContent = completed + " of " + total + " sections completed";

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
      if (docs[sectionId].some((d) => d.name === file.name && d.size === file.size)) {
        errors.push(file.name + ": already uploaded");
        continue;
      }

      docs[sectionId].push({
        name: file.name,
        size: file.size,
        type: file.type,
        date: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
      });
    }

    saveDocs(docs);
    renderFileList(sectionId);
    updateProgress();

    if (errors.length > 0) {
      showDocAlert(errors.join("\\n"), "error");
    } else {
      showDocAlert(fileList.length + " file" + (fileList.length > 1 ? "s" : "") + " uploaded successfully!", "success");
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
      fileInput.accept = ".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.xls,.xlsx,.csv";
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

      document.getElementById("closeOBModal").addEventListener("click", () => modal.remove());
      modal.addEventListener("click", (ev) => { if (ev.target === modal) modal.remove(); });

      // Bank selection handler
      modal.querySelectorAll(".ob-bank-btn").forEach((bankBtn) => {
        bankBtn.addEventListener("click", function () {
          const bank = this.getAttribute("data-bank");
          const statusEl = document.getElementById("obStatus");

          // Disable all bank buttons
          modal.querySelectorAll(".ob-bank-btn").forEach((b) => { b.disabled = true; });
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
                      date: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
                      source: "Open Banking - " + bank,
                    });
                  }
                });

                saveDocs(docs);
                renderFileList("bank-statements");
                updateProgress();

                statusEl.innerHTML = '<span style="color:#10b981; font-weight:600;">&#10003; Connected successfully! 6 statements imported from ' + bank + '.</span>';

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
function loadUserApplication() {
  const myApplicationsList = document.getElementById("my-applications");
  if (!myApplicationsList) return;

  const formData = localStorage.getItem("fundingFormData");

  if (formData) {
    try {
      const data = JSON.parse(formData);
      const applicationId =
        localStorage.getItem("applicationId") ||
        "APP-" + Date.now().toString(36).toUpperCase();

      myApplicationsList.innerHTML = `
        <div class="application-card">
          <div class="application-header">
            <div class="application-info">
              <h3>Funding Application</h3>
              <span class="application-id">#${applicationId}</span>
            </div>
            <span class="application-status status-pending">Pending Review</span>
          </div>
          <div class="application-details">
            <div class="detail-row">
              <span class="detail-label">Amount Requested</span>
              <span class="detail-value">£${Number(data.fundingAmount || 0).toLocaleString()}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Purpose</span>
              <span class="detail-value">${data.fundingPurpose || "Not specified"}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Annual Turnover</span>
              <span class="detail-value">£${Number(data.annualTurnover || 0).toLocaleString()}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Trading Experience</span>
              <span class="detail-value">${data.tradingYears === "Yes" ? "3+ years" : data.tradingMonths ? data.tradingMonths + " months" : "Less than 3 years"}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Priority</span>
              <span class="detail-value">${data.importance || "Not specified"}</span>
            </div>
          </div>
          <div class="application-actions">
            <button class="btn-view-results" id="btnViewResults">
              View Matched Funders →
            </button>
            <button class="btn-edit-application" id="btnEditApplication">
              Edit Application
            </button>
          </div>
        </div>
      `;

      // Attach event listeners after injecting HTML
      const viewResultsBtn = document.getElementById("btnViewResults");
      if (viewResultsBtn) {
        viewResultsBtn.addEventListener("click", function () {
          window.location.href = "search-results.html";
        });
      }
      const editAppBtn = document.getElementById("btnEditApplication");
      if (editAppBtn) {
        editAppBtn.addEventListener("click", function () {
          window.location.href = "funding-form.html";
        });
      }
    } catch (e) {
      console.error("Error parsing form data:", e);
    }
  } else {
    myApplicationsList.innerHTML = `
      <div class="no-applications-card">
        <div class="no-app-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
            <polyline points="13 2 13 9 20 9"/>
          </svg>
        </div>
        <h3>No Applications Yet</h3>
        <p>Start your funding journey by submitting an application.</p>
        <button class="btn-start-application" id="btnStartApplication">
          Start Application →
        </button>
      </div>
    `;

    const startAppBtn = document.getElementById("btnStartApplication");
    if (startAppBtn) {
      startAppBtn.addEventListener("click", function () {
        window.location.href = "funding-form.html";
      });
    }
  }
}

// ===== Logout Handler =====
