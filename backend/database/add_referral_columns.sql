-- =============================================
-- Migration: Add Referral System Columns
-- Run this on existing databases to add referral functionality
-- =============================================

-- Use the correct database
-- For Hostinger: USE u683316176_pellopay;
-- For local: 
USE pellopay;

-- Add referral_code column to users table (ignore error if already exists)
ALTER TABLE users ADD COLUMN referral_code VARCHAR(20) UNIQUE AFTER phone;

-- Add referred_by column to users table (ignore error if already exists)
ALTER TABLE users ADD COLUMN referred_by INT AFTER referral_code;

-- Add indexes (run separately, ignore errors if they already exist)
-- ALTER TABLE users ADD INDEX idx_referral_code (referral_code);
-- ALTER TABLE users ADD INDEX idx_referred_by (referred_by);

-- Create referrals table if not exists
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

CREATE TABLE IF NOT EXISTS user_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    category ENUM('bank-statements', 'financial-accounts', 'applicant-info') NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
);

-- Create referral_rewards table if not exists
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

-- Verify the columns were added
SELECT 'Migration complete!' AS status;
DESCRIBE users;
