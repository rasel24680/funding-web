// ===== Form Step Navigation =====
let currentStep = 1;
let isInitialLoad = true;

function showStep(stepNumber) {
    // Hide all steps
    document.querySelectorAll('.form-step').forEach(step => {
        step.style.display = 'none';
    });
    
    // Show current step
    const nextStep = document.getElementById('step' + stepNumber);
    nextStep.style.display = 'block';
    
    currentStep = stepNumber;
    updateProgressBars();
    
    // Smooth scroll to form (but not on initial load)
    if (!isInitialLoad) {
        setTimeout(() => {
            const formSection = document.querySelector('.funding-section');
            formSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
    }
}

// ===== Validate Step 1 =====
function validateStep1() {
    const fundingAmount = document.getElementById('fundingAmount').value;
    const fundingPurpose = document.querySelector('input[name="fundingPurpose"]:checked');
    const assetFinanceSelected = fundingPurpose && fundingPurpose.value === 'Asset Finance';
    const assetType = document.querySelector('input[name="assetType"]:checked');
    
    if (!fundingAmount) {
        showAlert('Please enter a funding amount', 'error');
        return false;
    }
    
    if (fundingAmount < 1000 || fundingAmount > 5000000) {
        showAlert('Amount must be between £1,000 and £5,000,000', 'error');
        return false;
    }
    
    if (!fundingPurpose) {
        showAlert('Please select a funding purpose', 'error');
        return false;
    }
    
    if (assetFinanceSelected && !assetType) {
        showAlert('Please select an asset type', 'error');
        return false;
    }
    
    return true;
}

// ===== Validate Step 2 =====
function validateStep2() {
    const importance = document.querySelector('input[name="importance"]:checked');
    
    if (!importance) {
        showAlert('Please select what is most important to you', 'error');
        return false;
    }
    
    return true;
}

// ===== Validate Step 3 =====
function validateStep3() {
    const annualTurnover = document.getElementById('annualTurnover').value;
    const tradingYears = document.querySelector('input[name="tradingYears"]:checked');
    const tradingYearsNo = document.querySelector('input[name="tradingYears"][value="No"]:checked');
    const tradingMonths = document.getElementById('tradingMonths').value;
    const homeowner = document.querySelector('input[name="homeowner"]:checked');
    
    if (!annualTurnover) {
        showAlert('Please enter your annual turnover', 'error');
        return false;
    }
    
    if (!tradingYears) {
        showAlert('Please select if you have been trading for 3+ years', 'error');
        return false;
    }
    
    if (tradingYearsNo && !tradingMonths) {
        showAlert('Please enter how many months you have been trading for', 'error');
        return false;
    }
    
    if (!homeowner) {
        showAlert('Please select if you are a homeowner in the UK', 'error');
        return false;
    }
    
    return true;
}

// ===== Button Event Listeners =====
document.addEventListener('DOMContentLoaded', function() {
    // Setup number input formatting
    setupNumberInputFormatting();
    
    // Add smooth transitions on page load
    const fundingForm = document.querySelector('.funding-form');
    if (fundingForm) {
        fundingForm.style.animation = 'fadeIn 0.6s ease-out';
    }
    
    const step1Continue = document.getElementById('step1Continue');
    const step2Back = document.getElementById('step2Back');
    const step2Continue = document.getElementById('step2Continue');
    const step3Back = document.getElementById('step3Back');
    
    if (step1Continue) {
        step1Continue.addEventListener('click', function() {
            if (validateStep1()) {
                showStep(2);
            }
        });
    }
    
    if (step2Back) {
        step2Back.addEventListener('click', function() {
            showStep(1);
        });
    }
    
    if (step2Continue) {
        step2Continue.addEventListener('click', function() {
            if (validateStep2()) {
                showStep(3);
            }
        });
    }
    
    if (step3Back) {
        step3Back.addEventListener('click', function() {
            showStep(2);
        });
    }
    
    // Get form reference
    const form = document.getElementById('fundingForm');
    
    // ===== Form Submission =====
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (validateStep3()) {
                // Add loading animation to button
                const submitBtn = form.querySelector('button[type="submit"]');
                const originalText = submitBtn.textContent;
                submitBtn.style.opacity = '0.7';
                submitBtn.style.pointerEvents = 'none';
                submitBtn.innerHTML = '⏳ Processing...';
                
                // Simulate processing
                setTimeout(() => {
                    // Collect all form data
                    const formData = {
                        fundingAmount: document.getElementById('fundingAmount').value,
                        fundingPurpose: document.querySelector('input[name="fundingPurpose"]:checked').value,
                        assetType: document.querySelector('input[name="assetType"]:checked')?.value || 'N/A',
                        importance: document.querySelector('input[name="importance"]:checked').value,
                        annualTurnover: document.getElementById('annualTurnover').value,
                        tradingYears: document.querySelector('input[name="tradingYears"]:checked').value,
                        tradingMonths: document.getElementById('tradingMonths').value || 'N/A',
                        homeowner: document.querySelector('input[name="homeowner"]:checked').value
                    };
                    
                    // Store data and show success
                    localStorage.setItem('fundingFormData', JSON.stringify(formData));
                    submitBtn.innerHTML = '✓ Submitted!';
                    showAlert('Your application has been submitted successfully!', 'success');
                    
                    setTimeout(() => {
                        // Redirect to results page
                        window.location.href = 'results.html';
                    }, 1500);
                }, 1000);
            }
        });
    }
    
    // ===== Show/Hide Asset Type Question =====
    function toggleAssetTypeQuestion() {
        const assetFinanceSelected = document.querySelector('input[name="fundingPurpose"][value="Asset Finance"]:checked');
        const assetTypeGroup = document.getElementById('assetTypeGroup');
        
        if (assetFinanceSelected) {
            assetTypeGroup.style.display = 'block';
        } else {
            assetTypeGroup.style.display = 'none';
            document.querySelectorAll('input[name="assetType"]').forEach(radio => {
                radio.checked = false;
            });
        }
    }
    
    // ===== Show/Hide Trading Months Input =====
    function toggleTradingMonths() {
        const tradingYearsNo = document.querySelector('input[name="tradingYears"][value="No"]:checked');
        const tradingMonthsGroup = document.getElementById('tradingMonthsGroup');
        
        if (tradingYearsNo) {
            tradingMonthsGroup.style.display = 'block';
        } else {
            tradingMonthsGroup.style.display = 'none';
            document.getElementById('tradingMonths').value = '';
        }
    }
    
    // Add event listeners to funding purpose radios
    document.querySelectorAll('input[name="fundingPurpose"]').forEach(radio => {
        radio.addEventListener('change', function() {
            toggleAssetTypeQuestion();
            // Add animation to selected item
            this.closest('.radio-item').style.animation = 'pulse 0.4s ease';
        });
    });
    
    // Add event listeners to trading years radios
    document.querySelectorAll('input[name="tradingYears"]').forEach(radio => {
        radio.addEventListener('change', function() {
            toggleTradingMonths();
            // Add animation to selected item
            this.closest('.radio-item').style.animation = 'pulse 0.4s ease';
        });
    });
    
    // ===== Load Saved Form Data =====
    function loadFormData() {
        const savedData = localStorage.getItem('fundingFormData');
        if (savedData) {
            try {
                const formData = JSON.parse(savedData);
                
                // Populate Step 1 fields
                if (formData.fundingAmount) {
                    document.getElementById('fundingAmount').value = formData.fundingAmount;
                }
                if (formData.fundingPurpose) {
                    const fundingRadio = document.querySelector(`input[name="fundingPurpose"][value="${formData.fundingPurpose}"]`);
                    if (fundingRadio) fundingRadio.checked = true;
                }
                if (formData.assetType && formData.assetType !== 'N/A') {
                    const assetRadio = document.querySelector(`input[name="assetType"][value="${formData.assetType}"]`);
                    if (assetRadio) assetRadio.checked = true;
                }
                
                // Populate Step 2 fields
                if (formData.importance) {
                    const importanceRadio = document.querySelector(`input[name="importance"][value="${formData.importance}"]`);
                    if (importanceRadio) importanceRadio.checked = true;
                }
                
                // Populate Step 3 fields
                if (formData.annualTurnover) {
                    document.getElementById('annualTurnover').value = formData.annualTurnover;
                }
                if (formData.tradingYears) {
                    const tradingRadio = document.querySelector(`input[name="tradingYears"][value="${formData.tradingYears}"]`);
                    if (tradingRadio) tradingRadio.checked = true;
                }
                if (formData.tradingMonths && formData.tradingMonths !== 'N/A') {
                    document.getElementById('tradingMonths').value = formData.tradingMonths;
                }
                if (formData.homeowner) {
                    const homeownerRadio = document.querySelector(`input[name="homeowner"][value="${formData.homeowner}"]`);
                    if (homeownerRadio) homeownerRadio.checked = true;
                }
                
                // Trigger conditional field toggles
                toggleAssetTypeQuestion();
                toggleTradingMonths();
                
            } catch (e) {
                console.error('Error loading form data:', e);
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
    const progressBar1 = document.getElementById('progressBar1').querySelector('.progress-fill');
    const progressBar2 = document.getElementById('progressBar2').querySelector('.progress-fill');
    const progressBar3 = document.getElementById('progressBar3').querySelector('.progress-fill');
    
    if (currentStep >= 1) {
        progressBar1.style.width = '100%';
    } else {
        progressBar1.style.width = '0%';
    }
    
    if (currentStep >= 2) {
        progressBar2.style.width = '100%';
    } else {
        progressBar2.style.width = '0%';
    }
    
    if (currentStep >= 3) {
        progressBar3.style.width = '100%';
    } else {
        progressBar3.style.width = '0%';
    }
}

// ===== Alert System =====
function showAlert(message, type = 'info') {
    const existingAlert = document.querySelector('.custom-alert');
    if (existingAlert) {
        existingAlert.remove();
    }
    
    const alert = document.createElement('div');
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
    
    if (type === 'error') {
        alert.style.backgroundColor = '#ff6b5a';
        alert.style.color = '#ffffff';
    } else if (type === 'success') {
        alert.style.backgroundColor = '#10b981';
        alert.style.color = '#ffffff';
    } else {
        alert.style.backgroundColor = '#3b82f6';
        alert.style.color = '#ffffff';
    }
    
    document.body.appendChild(alert);
    
    setTimeout(() => {
        alert.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => alert.remove(), 300);
    }, 3000);
}

// ===== Format Number with Commas =====
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// ===== Format Input Fields with Live Formatting =====
function setupNumberInputFormatting() {
    const numberInputs = document.querySelectorAll('input[type="number"]');
    
    numberInputs.forEach(input => {
        // Store original input value
        input.addEventListener('input', function() {
            // Keep the numeric value for form submission
            // Visual display will show formatted version via placeholder/label updates
            const value = this.value;
            
            if (value && this.id === 'fundingAmount') {
                this.dataset.formattedValue = formatNumber(value);
                // Update placeholder to show format
                const displayValue = formatNumber(value);
                if (this.value && this.value.length > 4) {
                    const event = new CustomEvent('formatted', { detail: { formatted: displayValue } });
                    this.dispatchEvent(event);
                }
            }
        });
        
        // Add focus effect
        input.addEventListener('focus', function() {
            this.parentElement.style.transform = 'scale(1.02)';
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.style.transform = 'scale(1)';
        });
    });
}

// ===== Add Animations =====
const style = document.createElement('style');
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
    const toggleButtons = document.querySelectorAll('.toggle-btn');
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const socialButtons = document.querySelectorAll('.social-btn');

    // Toggle between login and signup forms
    if (toggleButtons.length > 0) {
        toggleButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                const formType = this.getAttribute('data-toggle');
                
                // Hide all forms and toggle paragraphs
                document.querySelectorAll('.auth-form-new').forEach(form => {
                    form.classList.remove('active');
                });
                document.querySelectorAll('.auth-toggle p').forEach(p => {
                    p.style.display = 'none';
                });

                // Show selected form
                if (formType === 'signup') {
                    document.getElementById('signupForm').classList.add('active');
                    document.querySelectorAll('.auth-toggle p')[1].style.display = 'block';
                } else {
                    document.getElementById('loginForm').classList.add('active');
                    document.querySelectorAll('.auth-toggle p')[0].style.display = 'block';
                }

                // Clear messages
                const message = document.getElementById('authMessage');
                if (message) {
                    message.classList.remove('success', 'error');
                    message.textContent = '';
                }

                // Smooth scroll to top
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        });
    }

    // Social login buttons
    if (socialButtons.length > 0) {
        socialButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                const provider = this.classList.contains('twitter-btn') ? 'Twitter' : 'Facebook';
                showAuthMessage(`Redirecting to ${provider}...`, 'success', document.getElementById('authMessage'));
                // In real app, redirect to social login
                // window.location.href = `/auth/${provider.toLowerCase()}`;
            });
        });
    }

    // Password strength meter
    const signupPassword = document.getElementById('signupPassword');
    if (signupPassword) {
        signupPassword.addEventListener('input', function() {
            updatePasswordStrength(this.value);
        });
    }

    // Login form submission
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleLogin(this);
        });
    }

    // Sign up form submission
    if (signupForm) {
        signupForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleSignup(this);
        });
    }
}

// Update password strength indicator
function updatePasswordStrength(password) {
    const strengthBar = document.getElementById('strengthBar');
    let strength = 0;

    if (!password) {
        strengthBar.style.width = '0%';
        return;
    }

    // Check password criteria
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/\d/.test(password) && /[!@#$%^&*]/.test(password)) strength += 25;

    strengthBar.style.width = strength + '%';

    // Change color based on strength
    if (strength <= 25) {
        strengthBar.style.background = 'linear-gradient(90deg, #ff6b5a, #ff6b5a)';
    } else if (strength <= 50) {
        strengthBar.style.background = 'linear-gradient(90deg, #ff8c42, #ff8c42)';
    } else if (strength <= 75) {
        strengthBar.style.background = 'linear-gradient(90deg, #ffc857, #ffc857)';
    } else {
        strengthBar.style.background = 'linear-gradient(90deg, #2ecc71, #2ecc71)';
    }
}

// Handle login
function handleLogin(form) {
    const email = form.querySelector('#loginEmail').value.trim();
    const password = form.querySelector('#loginPassword').value;
    const messageEl = document.getElementById('authMessage');

    // Validate inputs
    if (!email || !password) {
        showAuthMessage('Please fill in all fields', 'error', messageEl);
        return;
    }

    if (!isValidEmail(email)) {
        showAuthMessage('Please enter a valid email address', 'error', messageEl);
        return;
    }

    if (password.length < 6) {
        showAuthMessage('Password must be at least 6 characters', 'error', messageEl);
        return;
    }

    // Simulate API call
    setTimeout(() => {
        // Get company name from stored user data if available
        let companyName = 'User';
        const userData = localStorage.getItem('userData');
        if (userData) {
            const parsedData = JSON.parse(userData);
            if (parsedData.companyName) {
                companyName = parsedData.companyName;
            }
        }
        
        // Store user session (in real app, this would be a server call)
        localStorage.setItem('userEmail', email);
        localStorage.setItem('userCompanyName', companyName);
        localStorage.setItem('isLoggedIn', 'true');
        
        showAuthMessage('Login successful! Redirecting...', 'success', messageEl);
        
        setTimeout(() => {
            window.location.href = 'funding-form.html';
        }, 1500);
    }, 500);
}

// Handle sign up
function handleSignup(form) {
    const firstName = form.querySelector('#firstName').value.trim();
    const lastName = form.querySelector('#lastName').value.trim();
    const email = form.querySelector('#signupEmail').value.trim();
    const password = form.querySelector('#signupPassword').value;
    const confirmPassword = form.querySelector('#confirmPassword').value;
    const companyName = form.querySelector('#companyName').value.trim();
    const agreeTerms = form.querySelector('#agreeTerms').checked;
    const messageEl = document.getElementById('authMessage');

    // Validate inputs
    if (!firstName || !lastName || !email || !password || !confirmPassword || !companyName) {
        showAuthMessage('Please fill in all fields', 'error', messageEl);
        return;
    }

    if (!isValidEmail(email)) {
        showAuthMessage('Please enter a valid email address', 'error', messageEl);
        return;
    }

    if (password.length < 8) {
        showAuthMessage('Password must be at least 8 characters', 'error', messageEl);
        return;
    }

    if (password !== confirmPassword) {
        showAuthMessage('Passwords do not match', 'error', messageEl);
        return;
    }

    if (!agreeTerms) {
        showAuthMessage('You must agree to the Terms of Service', 'error', messageEl);
        return;
    }

    // Simulate API call
    setTimeout(() => {
        // Store user data (in real app, this would be a server call)
        const userData = {
            firstName,
            lastName,
            email,
            companyName,
            createdAt: new Date().toISOString()
        };
        localStorage.setItem('userData', JSON.stringify(userData));
        localStorage.setItem('userCompanyName', companyName);
        
        showAuthMessage('Account created successfully! Redirecting to login...', 'success', messageEl);
        
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
    }, 500);
}

// Show authentication message
function showAuthMessage(message, type, messageEl) {
    if (messageEl) {
        messageEl.textContent = message;
        messageEl.classList.remove('success', 'error');
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
    const email = document.getElementById('loginEmail').value.trim();
    const messageEl = document.getElementById('authMessage');
    
    if (!email) {
        showAuthMessage('Please enter your email address first', 'error', messageEl);
        return;
    }
    
    if (!isValidEmail(email)) {
        showAuthMessage('Please enter a valid email address', 'error', messageEl);
        return;
    }
    
    // Simulate sending reset email
    showAuthMessage('Sending password reset email...', 'success', messageEl);
    setTimeout(() => {
        showAuthMessage('Password reset link sent to ' + email + '. Check your inbox!', 'success', messageEl);
    }, 1000);
}

// Initialize auth page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize user navbar on all pages
    initializeUserNavbar();
    
    // Initialize admin page if on admin page
    if (document.querySelector('.admin-section')) {
        initializeAdminPage();
    }
    
    // Initialize documents page if on documents page
    if (document.querySelector('.documents-section')) {
        initializeDocumentsPage();
    }
    
    // Initialize search results if on search results page
    if (document.querySelector('.search-results-section')) {
        initializeSearchResults();
    }
    
    // Initialize dashboard if on dashboard page
    if (document.querySelector('.dashboard-container')) {
        initializeDashboard();
    }
    
    // Only initialize if on auth page
    if (document.querySelector('.auth-section-new')) {
        initializeAuthPage();
        
        // Add forgot password handler
        const forgotPasswordLink = document.querySelector('.forgot-password-link');
        if (forgotPasswordLink) {
            forgotPasswordLink.addEventListener('click', handleForgotPassword);
        }
    }
});

// ===== User Navbar Functions =====
function initializeUserNavbar() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const userEmail = localStorage.getItem('userEmail');
    const companyName = localStorage.getItem('userCompanyName') || 'User';
    
    const userProfileDropdown = document.getElementById('userProfileDropdown');
    const companyNameDisplay = document.getElementById('companyNameDisplay');
    const userProfileHeader = document.querySelector('.user-profile-header');
    const userDropdownMenu = document.getElementById('userDropdownMenu');
    
    // Show user profile dropdown
    if (userProfileDropdown) {
        userProfileDropdown.style.display = 'block';
        if (companyNameDisplay) {
            companyNameDisplay.textContent = companyName;
        }
    }
    
    // Toggle dropdown on header click
    if (userProfileHeader) {
        userProfileHeader.addEventListener('click', function(e) {
            e.stopPropagation();
            this.classList.toggle('active');
            if (userDropdownMenu) {
                userDropdownMenu.style.display = 
                    userDropdownMenu.style.display === 'block' ? 'none' : 'block';
            }
        });
    }
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (userProfileDropdown && !userProfileDropdown.contains(e.target)) {
            if (userProfileHeader) {
                userProfileHeader.classList.remove('active');
            }
            if (userDropdownMenu) {
                userDropdownMenu.style.display = 'none';
            }
        }
    });
    
    // Handle logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            handleLogout();
        });
    }
    
    // Handle dropdown links
    const dashboardLink = document.querySelector('.dashboard-link');
    const documentsLink = document.querySelector('.documents-link');
    const searchLink = document.querySelector('.search-link');
    const adminLink = document.querySelector('.admin-link');
    
    if (dashboardLink) {
        dashboardLink.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'dashboard.html';
        });
    }
    
    if (documentsLink) {
        documentsLink.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'documents.html';
        });
    }
    
    if (searchLink) {
        searchLink.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'search-results.html';
        });
    }
    
    if (adminLink) {
        adminLink.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'admin.html';
        });
    }
}

function handleLogout() {
    // Clear user data
    localStorage.removeItem('userEmail');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('fundingFormData');
    
    // Redirect to login page
    window.location.href = 'login.html';
}

// ===== Dashboard Functions =====
function initializeDashboard() {
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (!isLoggedIn) {
        window.location.href = 'login.html';
        return;
    }
    
    // Get user data from localStorage
    const userData = localStorage.getItem('userData');
    const userEmail = localStorage.getItem('userEmail');
    
    if (userData) {
        const parsedData = JSON.parse(userData);
        const userFullNameSidebar = document.getElementById('userFullNameSidebar');
        const userCompanyInfoSidebar = document.getElementById('userCompanyInfoSidebar');
        
        if (userFullNameSidebar) {
            userFullNameSidebar.textContent = `${parsedData.firstName} ${parsedData.lastName}`;
        }
        if (userCompanyInfoSidebar) {
            userCompanyInfoSidebar.textContent = parsedData.companyName || 'Company';
        }
    }
    
    // Initialize sidebar navigation
    const sidebarItems = document.querySelectorAll('.sidebar-item');
    const dashboardSections = document.querySelectorAll('.dashboard-section');
    
    sidebarItems.forEach(item => {
        item.addEventListener('click', function(e) {
            // Check if this is an external page link
            const href = this.getAttribute('href');
            if (href && href.endsWith('.html')) {
                // Allow navigation to external pages
                return;
            }
            
            e.preventDefault();
            
            // Remove active class from all items
            sidebarItems.forEach(i => i.classList.remove('active'));
            // Add active class to clicked item
            this.classList.add('active');
            
            // Hide all sections
            dashboardSections.forEach(section => {
                section.style.display = 'none';
            });
            
            // Show corresponding section
            const sectionId = `section-${this.dataset.section}`;
            const targetSection = document.getElementById(sectionId);
            if (targetSection) {
                targetSection.style.display = 'block';
            }
        });
    });
    
    // Initialize tab switching
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            
            // Remove active class from all tabs
            tabButtons.forEach(b => b.classList.remove('active'));
            // Add active class to clicked tab
            this.classList.add('active');
            
            // Hide all tab contents
            const tabContents = document.querySelectorAll('.applications-list');
            tabContents.forEach(content => {
                content.style.display = 'none';
            });
            
            // Show selected tab content
            const targetContent = document.getElementById(tabName);
            if (targetContent) {
                targetContent.style.display = 'block';
            }
        });
    });
}

// ===== Search Results Functions =====
function initializeSearchResults() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (!isLoggedIn) {
        window.location.href = 'login.html';
        return;
    }
    
    // Check if phone is verified
    const isPhoneVerified = localStorage.getItem('isPhoneVerified') === 'true';
    const phoneVerificationModal = document.getElementById('phoneVerificationModal');
    const fundingCardsContainer = document.getElementById('fundingCardsContainer');
    
    // Show/hide modal and blur cards
    if (isPhoneVerified) {
        if (phoneVerificationModal) {
            phoneVerificationModal.style.display = 'none';
        }
        if (fundingCardsContainer) {
            fundingCardsContainer.classList.remove('blurred');
        }
    } else {
        if (phoneVerificationModal) {
            phoneVerificationModal.style.display = 'flex';
        }
        if (fundingCardsContainer) {
            fundingCardsContainer.classList.add('blurred');
        }
    }
    
    // Generate funding cards
    generateFundingCards();
    
    // Initialize modal handlers
    initializePhoneVerificationModal();
    
    // Initialize edit search button
    const editSearchBtn = document.getElementById('editSearchBtn');
    if (editSearchBtn) {
        editSearchBtn.addEventListener('click', function() {
            window.location.href = 'funding-form.html';
        });
    }
}

function generateFundingCards() {
    const fundingCardsContainer = document.getElementById('fundingCardsContainer');
    
    const funders = [
        {
            id: 1,
            name: 'Fast Capital',
            loanAmount: '£50,000',
            interestRate: '4.5%',
            term: '36 months',
            apprTime: '2-3 days'
        },
        {
            id: 2,
            name: 'Prime Lenders',
            loanAmount: '£100,000',
            interestRate: '5.2%',
            term: '48 months',
            apprTime: '5-7 days'
        },
        {
            id: 3,
            name: 'Growth Finance',
            loanAmount: '£75,000',
            interestRate: '4.8%',
            term: '42 months',
            apprTime: '3-4 days'
        },
        {
            id: 4,
            name: 'Business Capital',
            loanAmount: '£60,000',
            interestRate: '5.5%',
            term: '36 months',
            apprTime: '4-5 days'
        },
        {
            id: 5,
            name: 'Enterprise Loans',
            loanAmount: '£150,000',
            interestRate: '4.2%',
            term: '60 months',
            apprTime: '7-10 days'
        },
        {
            id: 6,
            name: 'Quick Finance',
            loanAmount: '£45,000',
            interestRate: '6.0%',
            term: '24 months',
            apprTime: '1-2 days'
        },
        {
            id: 7,
            name: 'Smart Funding',
            loanAmount: '£80,000',
            interestRate: '5.0%',
            term: '48 months',
            apprTime: '3-4 days'
        },
        {
            id: 8,
            name: 'Venture Capital',
            loanAmount: '£200,000',
            interestRate: '3.8%',
            term: '72 months',
            apprTime: '10-14 days'
        },
        {
            id: 9,
            name: 'Credit Solutions',
            loanAmount: '£55,000',
            interestRate: '5.7%',
            term: '36 months',
            apprTime: '2-3 days'
        },
        {
            id: 10,
            name: 'Rapid Lenders',
            loanAmount: '£70,000',
            interestRate: '5.3%',
            term: '42 months',
            apprTime: '3-5 days'
        }
    ];
    
    fundingCardsContainer.innerHTML = funders.map(funder => `
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
                <button class="more-details-btn">
                    More details
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M19 12H5M12 19l-7-7 7-7"/>
                    </svg>
                </button>
                <button class="apply-btn">Apply Now</button>
            </div>
        </div>
    `).join('');
}

function initializePhoneVerificationModal() {
    const phoneVerificationModal = document.getElementById('phoneVerificationModal');
    const modalOverlay = document.getElementById('modalOverlay');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const skipVerificationBtn = document.getElementById('skipVerificationBtn');
    const verifyPhoneBtn = document.getElementById('verifyPhoneBtn');
    const phoneInput = document.getElementById('phoneNumber');
    const verificationMessage = document.getElementById('verificationMessage');
    
    // Close modal on close button
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', function() {
            // Don't close the modal, just show skip option
        });
    }
    
    // Skip verification
    if (skipVerificationBtn) {
        skipVerificationBtn.addEventListener('click', function() {
            // Just close the modal but keep cards blurred
            if (phoneVerificationModal) {
                phoneVerificationModal.style.display = 'none';
            }
            // Cards remain blurred
        });
    }
    
    // Verify phone
    if (verifyPhoneBtn) {
        verifyPhoneBtn.addEventListener('click', function() {
            const phoneNumber = phoneInput.value.trim();
            
            if (!phoneNumber) {
                showVerificationMessage('Please enter your phone number', 'error', verificationMessage);
                return;
            }
            
            if (!/^\d{10,15}$/.test(phoneNumber.replace(/\D/g, ''))) {
                showVerificationMessage('Please enter a valid phone number', 'error', verificationMessage);
                return;
            }
            
            // Simulate verification
            verifyPhoneBtn.disabled = true;
            verifyPhoneBtn.textContent = 'Verifying...';
            
            setTimeout(() => {
                // Simulate successful verification
                showVerificationMessage('Phone number verified successfully!', 'success', verificationMessage);
                
                setTimeout(() => {
                    // Save verification
                    localStorage.setItem('isPhoneVerified', 'true');
                    localStorage.setItem('userPhone', '+44' + phoneNumber);
                    
                    // Update UI
                    const fundingCardsContainer = document.getElementById('fundingCardsContainer');
                    if (fundingCardsContainer) {
                        fundingCardsContainer.classList.remove('blurred');
                    }
                    if (phoneVerificationModal) {
                        phoneVerificationModal.style.display = 'none';
                    }
                }, 1500);
            }, 1000);
        });
    }
    
    // Allow only numbers in phone input
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            this.value = this.value.replace(/\D/g, '').slice(0, 15);
        });
        
        phoneInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                verifyPhoneBtn.click();
            }
        });
    }
}

function showVerificationMessage(message, type, element) {
    if (element) {
        element.textContent = message;
        element.classList.remove('success', 'error');
        element.classList.add(type);
    }
}

// ===== Documents Page Functions =====
function initializeDocumentsPage() {
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (!isLoggedIn) {
        window.location.href = 'login.html';
        return;
    }
    
    // Initialize section toggles
    const sectionHeaders = document.querySelectorAll('.section-header');
    
    sectionHeaders.forEach(header => {
        header.addEventListener('click', function() {
            const sectionId = this.getAttribute('data-section');
            const sectionContent = document.getElementById(`section-${sectionId}`);
            const toggleIcon = this.querySelector('.section-toggle');
            
            if (sectionContent) {
                sectionContent.classList.toggle('active');
                toggleIcon.classList.toggle('rotated');
            }
        });
    });
    
    // Initialize upload buttons
    const uploadButtons = document.querySelectorAll('.upload-button');
    uploadButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            if (this.classList.contains('upload-files-btn')) {
                // Trigger file upload
                console.log('Opening file upload...');
                // In a real app, this would open a file chooser
            } else if (this.classList.contains('connect-banking-btn')) {
                // Connect to open banking
                console.log('Connecting to open banking...');
                // In a real app, this would connect to a banking API
            }
        });
    });
}

// ===== Admin Page Functions =====
function initializeAdminPage() {
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (!isLoggedIn) {
        window.location.href = 'login.html';
        return;
    }
    
    // Get user data from localStorage
    const userData = localStorage.getItem('userData');
    
    if (userData) {
        const parsedData = JSON.parse(userData);
        const userFullNameSidebar = document.getElementById('userFullNameSidebar');
        const userCompanyInfoSidebar = document.getElementById('userCompanyInfoSidebar');
        
        if (userFullNameSidebar) {
            userFullNameSidebar.textContent = `${parsedData.firstName} ${parsedData.lastName}`;
        }
        if (userCompanyInfoSidebar) {
            userCompanyInfoSidebar.textContent = parsedData.companyName || 'Company';
        }
    }
    
    // Initialize sidebar navigation
    const sidebarItems = document.querySelectorAll('.sidebar-item');
    
    sidebarItems.forEach(item => {
        item.addEventListener('click', function(e) {
            // Check if this is an external page link
            const href = this.getAttribute('href');
            if (href && href.endsWith('.html')) {
                // Allow navigation to external pages
                return;
            }
            
            e.preventDefault();
        });
    });
    
    // Initialize copy link button
    const copyLinkBtn = document.getElementById('copyLinkBtn');
    if (copyLinkBtn) {
        copyLinkBtn.addEventListener('click', function() {
            const referralLink = document.getElementById('referralLink');
            
            // Copy to clipboard
            referralLink.select();
            document.execCommand('copy');
            
            // Show feedback
            const originalText = this.textContent;
            this.textContent = 'Copied!';
            this.classList.add('copied');
            
            setTimeout(() => {
                this.textContent = originalText;
                this.classList.remove('copied');
            }, 2000);
        });
    }
}

// ===== Logout Handler =====
