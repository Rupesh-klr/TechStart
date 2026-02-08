-- scripts/seed.sql
-- /Users/apple/Library/DBeaverData/workspace6/General/Scripts/dino_wallet_Script.sql
-- 1. Create Users Table

CREATE TABLE IF NOT EXISTS dinoWallet_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create Assets Table
CREATE TABLE IF NOT EXISTS dinoWallet_assets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

-- 3. Create Accounts Table
CREATE TABLE IF NOT EXISTS dinoWallet_accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    name VARCHAR(50) NOT NULL,
    asset_id INT NOT NULL,
    balance DECIMAL(15, 2) DEFAULT 0.00,
    FOREIGN KEY (user_id) REFERENCES dinoWallet_users(id),
    FOREIGN KEY (asset_id) REFERENCES dinoWallet_assets(id),
    UNIQUE(user_id, asset_id)
);

-- 4. Create Ledger Entries Table
CREATE TABLE IF NOT EXISTS dinoWallet_ledger_entries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id VARCHAR(36) NOT NULL UNIQUE,
    debit_account_id INT NOT NULL,
    credit_account_id INT NOT NULL,
    amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (debit_account_id) REFERENCES dinoWallet_accounts(id),
    FOREIGN KEY (credit_account_id) REFERENCES dinoWallet_accounts(id)
);

-- SEED DATA

-- Insert Assets
INSERT INTO dinoWallet_assets (name) VALUES ('Gold Coins'), ('Diamonds') 
ON DUPLICATE KEY UPDATE name=name;

-- Insert Users
INSERT INTO dinoWallet_users (username) VALUES ('system_admin'), ('rupesh_klr'), ('vasu_dev') 
ON DUPLICATE KEY UPDATE username=username;

-- Insert System Treasury
INSERT INTO dinoWallet_accounts (user_id, name, asset_id, balance) 
SELECT id, 'Treasury', (SELECT id FROM dinoWallet_assets WHERE name='Gold Coins'), 1000000.00 
FROM dinoWallet_users WHERE username='system_admin'
ON DUPLICATE KEY UPDATE balance=balance;

-- Insert User Wallets
INSERT INTO dinoWallet_accounts (user_id, name, asset_id, balance) 
SELECT id, 'Wallet', (SELECT id FROM dinoWallet_assets WHERE name='Gold Coins'), 500.00 
FROM dinoWallet_users WHERE username='rupesh_klr'
ON DUPLICATE KEY UPDATE balance=balance;

INSERT INTO dinoWallet_accounts (user_id, name, asset_id, balance) 
SELECT id, 'Wallet', (SELECT id FROM dinoWallet_assets WHERE name='Gold Coins'), 100.00 
FROM dinoWallet_users WHERE username='vasu_dev'
ON DUPLICATE KEY UPDATE balance=balance;



-- scripts/seed.sql

-- ==========================================================
-- 0. CLEANUP (Drop in Reverse Dependency Order)
-- ==========================================================
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS dinoWallet_ledger_entries;
DROP TABLE IF EXISTS dinoWallet_accounts;
DROP TABLE IF EXISTS dinoWallet_assets;
DROP TABLE IF EXISTS dinoWallet_users;
DROP TABLE IF EXISTS dinoWallet_status_types;
SET FOREIGN_KEY_CHECKS = 1;
COMMIT; -- Ensure cleanup is finalized

-- ==========================================================
-- 1. CREATE LOOKUP TABLE (Status Types)
--    This must exist BEFORE other tables use it.
-- ==========================================================
CREATE TABLE dinoWallet_status_types (
    id INT PRIMARY KEY, -- 0, 1, 2 (Fixed Integers)
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255)
);

-- Insert the fixed definitions immediately
INSERT INTO dinoWallet_status_types (id, name, description) VALUES 
(0, 'Active', 'Record is active and visible'),
(1, 'Soft-Deleted', 'Record is hidden (Trash bin)'),
(2, 'Permanently-Deleted', 'Record is removed for compliance/audit only');

COMMIT; -- Commit status types so they are available for FK checks

-- ==========================================================
-- 2. CREATE USERS TABLE
-- ==========================================================
CREATE TABLE dinoWallet_users (
    id CHAR(36) PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    user_email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    
    -- Profile Details
    user_bio TEXT,
    user_status_message VARCHAR(255),
    user_phoneNumber VARCHAR(20),
    user_date_of_birth DATE,
    is_allowed_login TINYINT DEFAULT 1,
    last_active_on TIMESTAMP NULL,

    -- Audit Columns (is_deleted is now a Foreign Key)
    is_deleted INT DEFAULT 0, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(250) DEFAULT 'system_init',
    modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    modified_by VARCHAR(250),

    FOREIGN KEY (is_deleted) REFERENCES dinoWallet_status_types(id)
);

COMMIT; -- Commit Users Table

-- ==========================================================
-- 3. CREATE ASSETS TABLE
-- ==========================================================
CREATE TABLE dinoWallet_assets (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    
    -- Economy Logic
    conversion_rate_real_money_percent DECIMAL(10, 2) DEFAULT 1.00,
    min_purchase_cart_value DECIMAL(10, 2) DEFAULT 0.00,
    offer_percentage DECIMAL(5, 2) DEFAULT 0.00,
    sample_package_list_json JSON, 

    -- Audit Columns
    is_deleted INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(250) DEFAULT 'system_init',
    modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    modified_by VARCHAR(250),

    FOREIGN KEY (is_deleted) REFERENCES dinoWallet_status_types(id)
);

COMMIT; -- Commit Assets Table

-- ==========================================================
-- 4. CREATE ACCOUNTS TABLE (Wallets)
-- ==========================================================
CREATE TABLE dinoWallet_accounts (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    asset_id CHAR(36) NOT NULL,
    
    name VARCHAR(50) NOT NULL,
    balance DECIMAL(15, 2) DEFAULT 0.00,
    last_interaction_asset_id CHAR(36), 

    -- Audit Columns
    is_deleted INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(250) DEFAULT 'system_admin',
    modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    modified_by VARCHAR(250),

    FOREIGN KEY (user_id) REFERENCES dinoWallet_users(id),
    FOREIGN KEY (asset_id) REFERENCES dinoWallet_assets(id),
    FOREIGN KEY (is_deleted) REFERENCES dinoWallet_status_types(id),
    UNIQUE(user_id, asset_id) 
);

COMMIT; -- Commit Accounts Table

-- ==========================================================
-- 5. CREATE LEDGER TABLE (Transactions)
-- ==========================================================
CREATE TABLE dinoWallet_ledger_entries (
    id CHAR(36) PRIMARY KEY,
    transaction_id VARCHAR(255) NOT NULL UNIQUE,
    
    debit_account_id CHAR(36) NOT NULL,
    credit_account_id CHAR(36) NOT NULL,
    
    amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
    asset_name_snapshot VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    
    -- Audit Columns
    is_deleted INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(250) DEFAULT 'system',
    modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    modified_by VARCHAR(250),

    FOREIGN KEY (debit_account_id) REFERENCES dinoWallet_accounts(id),
    FOREIGN KEY (credit_account_id) REFERENCES dinoWallet_accounts(id),
    FOREIGN KEY (is_deleted) REFERENCES dinoWallet_status_types(id)
);

COMMIT; -- Commit Ledger Table

-- ==========================================================
-- 6. SEED DATA INJECTION
-- ==========================================================

-- INSERT USERS
INSERT INTO dinoWallet_users (id, username, user_email, password_hash, user_bio, created_by) VALUES 
('39bf2b49-016b-43a3-b2ad-408815d80657', 'system_admin', 'admin@dino.com', 'hashed_secret_123', 'The System Super User', 'INIT_SCRIPT'),
('10b216bc-32a7-47bf-8db8-ab88b4eaa1c8', 'rupesh_klr', 'rupesh@klr.com', 'hashed_secret_456', 'Lead Developer', 'INIT_SCRIPT'),
('5feffa09-dd40-4ab8-a094-c95efc3f5014', 'vasu_deva', 'vasu@dev.com', 'hashed_secret_789', 'Beta Tester', 'INIT_SCRIPT');

-- INSERT ASSETS
INSERT INTO dinoWallet_assets (id, name, description, sample_package_list_json, created_by) VALUES 
('02a9a562-a092-49bb-bc3d-14cca6875edf', 'Gold Coins', 'Standard Game Currency', '[{"qty": 50, "price": 10}, {"qty": 105, "price": 20}]', 'INIT_SCRIPT'),
('4e51f22c-b4c4-4ef3-b9d3-58208b520cfa', 'Diamonds', 'Premium Currency', '[{"qty": 10, "price": 100}]', 'INIT_SCRIPT'),
('6f13dc3b-d1ab-45f6-a46a-caa15a6bf75b', 'Crystals', 'Rare Item', '[{"qty": 5, "price": 500}]', 'INIT_SCRIPT'),
(UUID(), 'Loyalty Points', 'Earned via login', NULL, 'INIT_SCRIPT');

-- INSERT ACCOUNTS (Wallets)

-- A. System Admin Treasury
INSERT INTO dinoWallet_accounts (id, user_id, asset_id, name, balance) VALUES 
(UUID(), '39bf2b49-016b-43a3-b2ad-408815d80657', '02a9a562-a092-49bb-bc3d-14cca6875edf', 'Treasury - Gold', 1000000.00),
(UUID(), '39bf2b49-016b-43a3-b2ad-408815d80657', '4e51f22c-b4c4-4ef3-b9d3-58208b520cfa', 'Treasury - Diamonds', 1000000.00),
(UUID(), '39bf2b49-016b-43a3-b2ad-408815d80657', '6f13dc3b-d1ab-45f6-a46a-caa15a6bf75b', 'Treasury - Crystals', 1000000.00);

-- B. Rupesh Wallets
INSERT INTO dinoWallet_accounts (id, user_id, asset_id, name, balance, last_interaction_asset_id) VALUES 
(UUID(), '10b216bc-32a7-47bf-8db8-ab88b4eaa1c8', '02a9a562-a092-49bb-bc3d-14cca6875edf', 'Rupesh Gold Wallet', 500.00, '02a9a562-a092-49bb-bc3d-14cca6875edf'),
(UUID(), '10b216bc-32a7-47bf-8db8-ab88b4eaa1c8', '4e51f22c-b4c4-4ef3-b9d3-58208b520cfa', 'Rupesh Diamond Wallet', 10.00, '4e51f22c-b4c4-4ef3-b9d3-58208b520cfa'),
(UUID(), '10b216bc-32a7-47bf-8db8-ab88b4eaa1c8', '6f13dc3b-d1ab-45f6-a46a-caa15a6bf75b', 'Rupesh Crystal Wallet', 3.00, '6f13dc3b-d1ab-45f6-a46a-caa15a6bf75b');

-- C. Vasu Wallets
INSERT INTO dinoWallet_accounts (id, user_id, asset_id, name, balance) VALUES 
(UUID(), '5feffa09-dd40-4ab8-a094-c95efc3f5014', '02a9a562-a092-49bb-bc3d-14cca6875edf', 'Vasu Gold Wallet', 500.00);

-- CREATE LEDGER ENTRIES FOR INITIAL DROPS
INSERT INTO dinoWallet_ledger_entries (id, transaction_id, debit_account_id, credit_account_id, amount, asset_name_snapshot, description)
SELECT 
    UUID(), 
    CONCAT('INIT-GOLD-', user_id), 
    (SELECT id FROM dinoWallet_accounts WHERE user_id='39bf2b49-016b-43a3-b2ad-408815d80657' AND asset_id='02a9a562-a092-49bb-bc3d-14cca6875edf'), -- From Admin
    id, -- To User Wallet
    500.00, 
    'Gold Coins', 
    'Welcome Bonus' 
FROM dinoWallet_accounts WHERE user_id IN ('10b216bc-32a7-47bf-8db8-ab88b4eaa1c8', '5feffa09-dd40-4ab8-a094-c95efc3f5014') AND name LIKE '%Gold%';

COMMIT; -- Final Commit