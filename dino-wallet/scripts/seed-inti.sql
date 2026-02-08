-- scripts/seed.sql

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS assets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE -- e.g., 'Gold Coins', 'Diamonds'
);

CREATE TABLE IF NOT EXISTS accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL, -- NULL for System Accounts
    name VARCHAR(50) NOT NULL, -- e.g., 'System Treasury', 'Rupesh Main'
    asset_id INT NOT NULL,
    balance DECIMAL(15, 2) DEFAULT 0.00,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (asset_id) REFERENCES assets(id),
    UNIQUE(user_id, asset_id) -- One account per asset per user
);

CREATE TABLE IF NOT EXISTS ledger_entries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id VARCHAR(36) NOT NULL UNIQUE, -- Idempotency Key
    debit_account_id INT NOT NULL,
    credit_account_id INT NOT NULL,
    amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (debit_account_id) REFERENCES accounts(id),
    FOREIGN KEY (credit_account_id) REFERENCES accounts(id)
);

-- SEED DATA

-- 1. Create Assets
INSERT INTO assets (name) VALUES ('Gold Coins'), ('Diamonds') ON DUPLICATE KEY UPDATE name=name;

-- 2. Create Users
INSERT INTO users (username) VALUES ('system_admin'), ('rupesh_klr'), ('vasu_dev') ON DUPLICATE KEY UPDATE username=username;

-- 3. Create Accounts
-- System Treasury (Source of funds)
INSERT INTO accounts (user_id, name, asset_id, balance) 
SELECT id, 'Treasury', (SELECT id FROM assets WHERE name='Gold Coins'), 1000000.00 
FROM users WHERE username='system_admin'
ON DUPLICATE KEY UPDATE balance=balance;

-- User Accounts (Initial Balance 0)
INSERT INTO accounts (user_id, name, asset_id, balance) 
SELECT id, 'Wallet', (SELECT id FROM assets WHERE name='Gold Coins'), 500.00 
FROM users WHERE username='rupesh_klr'
ON DUPLICATE KEY UPDATE balance=balance;

INSERT INTO accounts (user_id, name, asset_id, balance) 
SELECT id, 'Wallet', (SELECT id FROM assets WHERE name='Gold Coins'), 100.00 
FROM users WHERE username='vasu_dev'
ON DUPLICATE KEY UPDATE balance=balance;
