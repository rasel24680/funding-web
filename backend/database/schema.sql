-- =============================================
-- Pellopay Database Schema
-- JWT Authentication + Phone Verification
-- =============================================

-- Use the database (change based on environment)
-- For Hostinger: USE u683316176_pellopay;
-- For local: USE pellopay;
USE pellopay1;


-- =============================================
-- Users Table (JWT Authentication)
-- =============================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    business_type ENUM('Limited company', 'Limited partnership', 'Partnership', 'Sole trader', 'Other') DEFAULT NULL,
    business_name VARCHAR(255),
    phone VARCHAR(50),
    referral_code VARCHAR(20) UNIQUE,
    referred_by INT,
    phone_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    role ENUM('user', 'admin') DEFAULT 'user',
    last_login DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_phone_verified (phone_verified),
    INDEX idx_role (role),
    INDEX idx_referral_code (referral_code),
    INDEX idx_referred_by (referred_by),
    FOREIGN KEY (referred_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Phone Verifications Table
-- =============================================
CREATE TABLE IF NOT EXISTS phone_verifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    phone VARCHAR(50) NOT NULL,
    code VARCHAR(6) NOT NULL,
    attempts INT DEFAULT 0,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Funding Applications Table (Stores form data)
-- user_id is nullable for guest applications
-- =============================================
CREATE TABLE IF NOT EXISTS funding_applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT DEFAULT NULL,
    session_id VARCHAR(255),
    
    -- Step 1: Funding Details
    funding_amount DECIMAL(15, 2) NOT NULL,
    funding_purpose ENUM('Growth', 'Cashflow', 'Refinancing', 'Asset Finance', 'Other') NOT NULL,
    asset_type VARCHAR(100),
    
    -- Step 2: Priorities
    importance ENUM('Fast approval', 'Low cost', 'Personalised support', 'Low credit options'),
    
    -- Step 3: Business Info
    annual_turnover DECIMAL(15, 2),
    trading_years ENUM('Yes', 'No'),
    trading_months INT,
    homeowner ENUM('Yes', 'No'),
    
    -- Step 4: Contact Info (collected during signup or from form)
    contact_first_name VARCHAR(100),
    contact_last_name VARCHAR(100),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    business_type ENUM('Limited company', 'Limited partnership', 'Partnership', 'Sole trader', 'Other'),
    business_name VARCHAR(255),
    
    -- Status
    status ENUM('pending', 'reviewing', 'approved', 'rejected', 'completed', 'submitted_to_lenders') DEFAULT 'pending',
    admin_notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_session_id (session_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Contact Inquiries Table
-- =============================================
CREATE TABLE IF NOT EXISTS contact_inquiries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    business_name VARCHAR(255),
    subject VARCHAR(255),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_by INT,
    resolved_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Password Reset Tokens Table
-- =============================================
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(255) NOT NULL,
    expires_at DATETIME NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Lender Submissions Table (tracks submissions to external lenders)
-- =============================================
CREATE TABLE IF NOT EXISTS lender_submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_id INT NOT NULL,
    lender_name VARCHAR(100) NOT NULL,
    lender_lead_id VARCHAR(255),
    lender_deal_id VARCHAR(255),
    status ENUM('pending', 'submitted', 'approved', 'declined', 'funded', 'error') DEFAULT 'pending',
    response_data JSON,
    error_message TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (application_id) REFERENCES funding_applications(id) ON DELETE CASCADE,
    INDEX idx_application_id (application_id),
    INDEX idx_lender_name (lender_name),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Session Logs Table (for analytics)
-- =============================================
CREATE TABLE IF NOT EXISTS session_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    details JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Funders/Products Table
-- =============================================
CREATE TABLE IF NOT EXISTS funders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    logo_url VARCHAR(255),
    base_rate DECIMAL(5, 2),
    min_amount DECIMAL(15, 2),
    max_amount DECIMAL(15, 2),
    approval_speed VARCHAR(100),
    key_feature VARCHAR(255),
    description TEXT,
    accepts_impaired_credit BOOLEAN DEFAULT FALSE,
    requires_homeowner BOOLEAN DEFAULT FALSE,
    min_trading_years INT DEFAULT 0,
    funding_purposes JSON,
    asset_types JSON,
    contact_email VARCHAR(255),
    website VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_is_active (is_active),
    INDEX idx_min_amount (min_amount),
    INDEX idx_max_amount (max_amount)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample funders
INSERT IGNORE INTO funders (name, base_rate, min_amount, max_amount, approval_speed, key_feature, description, accepts_impaired_credit, requires_homeowner, min_trading_years, funding_purposes, asset_types, contact_email, website, is_active) VALUES
('Bank of England', 3.75, 5000, 5000000, '5-7 business days', 'Best Rates', 'Leading UK bank offering competitive rates', FALSE, FALSE, 3, '["Growth", "Cashflow", "Refinancing"]', '[]', 'business@boe.co.uk', 'https://www.boe.co.uk', TRUE),
('Rapid Finance UK', 5.50, 2000, 1000000, '24-48 hours', 'Fastest Approval', 'Quick approval for businesses', TRUE, TRUE, 0, '["Growth", "Cashflow"]', '[]', 'info@rapidfinanceuk.co.uk', 'https://www.rapidfinanceuk.co.uk', TRUE),
('Asset Finance Plus', 4.25, 10000, 500000, '3-5 business days', 'Asset Finance Specialist', 'Specialized in asset financing', FALSE, FALSE, 1, '["Asset Finance"]', '["Vehicles", "Equipment", "Machinery"]', 'sales@assetfinanceplus.co.uk', 'https://www.assetfinanceplus.co.uk', TRUE),
('Growth Capital Partners', 5.99, 25000, 2000000, '1-2 weeks', 'Personal Support', 'Dedicated relationship managers', FALSE, TRUE, 3, '["Growth"]', '[]', 'hello@growthcapital.co.uk', 'https://www.growthcapital.co.uk', TRUE),
('SME Funding Direct', 6.50, 5000, 750000, '3-4 business days', 'Low Credit Options', 'Flexible lending for impaired credit', TRUE, FALSE, 0, '["Growth", "Cashflow"]', '[]', 'support@smefundingdirect.co.uk', 'https://www.smefundingdirect.co.uk', TRUE);

-- =============================================
-- Referral System Tables
-- =============================================

-- If users table already exists, run these ALTER statements:
-- ALTER TABLE users ADD COLUMN referral_code VARCHAR(20) UNIQUE AFTER phone;
-- ALTER TABLE users ADD COLUMN referred_by INT AFTER referral_code;
-- ALTER TABLE users ADD INDEX idx_referral_code (referral_code);
-- ALTER TABLE users ADD INDEX idx_referred_by (referred_by);
-- ALTER TABLE users ADD CONSTRAINT fk_referred_by FOREIGN KEY (referred_by) REFERENCES users(id) ON DELETE SET NULL;

-- Referrals Table (tracks all referral relationships and rewards)
CREATE TABLE IF NOT EXISTS referrals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    referrer_id INT NOT NULL,
    referred_id INT NOT NULL,
    referral_code VARCHAR(20) NOT NULL,
    status ENUM('pending', 'qualified', 'rewarded', 'expired') DEFAULT 'pending',
    reward_amount DECIMAL(10, 2) DEFAULT 75.00,
    reward_type ENUM('amazon_voucher', 'cash', 'credit') DEFAULT 'amazon_voucher',
    qualification_type ENUM('signup', 'open_banking', 'funded') DEFAULT 'open_banking',
    qualified_at DATETIME,
    rewarded_at DATETIME,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (referrer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (referred_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_referrer_id (referrer_id),
    INDEX idx_referred_id (referred_id),
    INDEX idx_referral_code (referral_code),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Referral Rewards Table (tracks reward payouts)
CREATE TABLE IF NOT EXISTS referral_rewards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    referral_id INT NOT NULL,
    user_id INT NOT NULL,
    reward_type ENUM('amazon_voucher', 'cash', 'credit') NOT NULL,
    reward_amount DECIMAL(10, 2) NOT NULL,
    voucher_code VARCHAR(100),
    status ENUM('pending', 'sent', 'claimed', 'expired') DEFAULT 'pending',
    sent_at DATETIME,
    claimed_at DATETIME,
    expires_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (referral_id) REFERENCES referrals(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_referral_id (referral_id),
    INDEX idx_user_id (user_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
