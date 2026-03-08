-- =============================================
-- Migration: Add User Documents Table
-- Run this on existing databases
-- =============================================

-- Use the correct database
-- For Hostinger: USE u683316176_pellopay;
-- For local: 
USE pellopay1;

-- Create user_documents table if not exists
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
    INDEX idx_user_id (user_id),
    INDEX idx_category (category),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verify
SELECT 'user_documents table created!' AS status;
DESCRIBE user_documents;
