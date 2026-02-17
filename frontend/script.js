// ===== Form Step Navigation =====
let currentStep = 1;

function showStep(stepNumber) {
    // Hide all steps
    document.querySelectorAll('.form-step').forEach(step => {
        step.style.display = 'none';
    });
    
    // Show current step
    document.getElementById('step' + stepNumber).style.display = 'block';
    currentStep = stepNumber;
    updateProgressBars();
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
    const step1Continue = document.getElementById('step1Continue');
    const step2Back = document.getElementById('step2Back');
    const step2Continue = document.getElementById('step2Continue');
    const step3Back = document.getElementById('step3Back');
    const fundingForm = document.getElementById('fundingForm');
    
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
    
    // ===== Form Submission =====
    if (fundingForm) {
        fundingForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (validateStep3()) {
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
                showAlert('Your application has been submitted successfully!', 'success');
                
                setTimeout(() => {
                    // Redirect to results page
                    window.location.href = 'results.html';
                }, 1500);
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
        radio.addEventListener('change', toggleAssetTypeQuestion);
    });
    
    // Add event listeners to trading years radios
    document.querySelectorAll('input[name="tradingYears"]').forEach(radio => {
        radio.addEventListener('change', toggleTradingMonths);
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
`;
document.head.appendChild(style);
