const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const fs = require('fs');

async function seedSQLite() {
    console.log("📂 Opening SQLite Database (dino_wallet.db)...");

    // Open (or create) the database file
    const db = await open({
        filename: './dino_wallet.db',
        driver: sqlite3.Database
    });

    console.log("🧹 Cleaning up old tables...");
    // Drop in reverse order of dependencies
    await db.exec(`PRAGMA foreign_keys = OFF;`);
    await db.exec(`DROP TABLE IF EXISTS dinoWallet_ledger_entries`);
    await db.exec(`DROP TABLE IF EXISTS dinoWallet_accounts`);
    await db.exec(`DROP TABLE IF EXISTS dinoWallet_assets`);
    await db.exec(`DROP TABLE IF EXISTS dinoWallet_users`);
    await db.exec(`DROP TABLE IF EXISTS dinoWallet_status_types`);
    await db.exec(`PRAGMA foreign_keys = ON;`);

    console.log("🏗️ Creating Tables...");

    // 1. STATUS TYPES
    await db.exec(`
        CREATE TABLE dinoWallet_status_types (
            id INTEGER PRIMARY KEY, 
            name TEXT NOT NULL UNIQUE,
            description TEXT
        );
    `);

    // 2. USERS
    await db.exec(`
        CREATE TABLE dinoWallet_users (
            id TEXT PRIMARY KEY,
            username TEXT NOT NULL UNIQUE,
            user_email TEXT UNIQUE,
            password_hash TEXT NOT NULL,
            user_bio TEXT,
            user_status_message TEXT,
            user_phoneNumber TEXT,
            user_date_of_birth TEXT,
            is_allowed_login INTEGER DEFAULT 1,
            last_active_on TEXT,
            is_deleted INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            created_by TEXT DEFAULT 'system_init',
            modified_at TEXT DEFAULT CURRENT_TIMESTAMP,
            modified_by TEXT,
            FOREIGN KEY (is_deleted) REFERENCES dinoWallet_status_types(id)
        );
    `);

    // 3. ASSETS
    await db.exec(`
        CREATE TABLE dinoWallet_assets (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            description TEXT,
            conversion_rate_real_money_percent REAL DEFAULT 1.00,
            min_purchase_cart_value REAL DEFAULT 0.00,
            offer_percentage REAL DEFAULT 0.00,
            sample_package_list_json TEXT, 
            is_deleted INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            created_by TEXT DEFAULT 'system_init',
            modified_at TEXT DEFAULT CURRENT_TIMESTAMP,
            modified_by TEXT,
            FOREIGN KEY (is_deleted) REFERENCES dinoWallet_status_types(id)
        );
    `);

    // 4. ACCOUNTS
    await db.exec(`
        CREATE TABLE dinoWallet_accounts (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            asset_id TEXT NOT NULL,
            name TEXT NOT NULL,
            balance REAL DEFAULT 0.00,
            last_interaction_asset_id TEXT,
            is_deleted INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            created_by TEXT DEFAULT 'system_admin',
            modified_at TEXT DEFAULT CURRENT_TIMESTAMP,
            modified_by TEXT,
            FOREIGN KEY (user_id) REFERENCES dinoWallet_users(id),
            FOREIGN KEY (asset_id) REFERENCES dinoWallet_assets(id),
            FOREIGN KEY (is_deleted) REFERENCES dinoWallet_status_types(id),
            UNIQUE(user_id, asset_id)
        );
    `);

    // 5. LEDGER
    await db.exec(`
        CREATE TABLE dinoWallet_ledger_entries (
            id TEXT PRIMARY KEY,
            transaction_id TEXT NOT NULL UNIQUE,
            debit_account_id TEXT NOT NULL,
            credit_account_id TEXT NOT NULL,
            amount REAL NOT NULL CHECK (amount > 0),
            asset_name_snapshot TEXT NOT NULL,
            description TEXT,
            is_deleted INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            created_by TEXT DEFAULT 'system',
            modified_at TEXT DEFAULT CURRENT_TIMESTAMP,
            modified_by TEXT,
            FOREIGN KEY (debit_account_id) REFERENCES dinoWallet_accounts(id),
            FOREIGN KEY (credit_account_id) REFERENCES dinoWallet_accounts(id),
            FOREIGN KEY (is_deleted) REFERENCES dinoWallet_status_types(id)
        );
    `);

    console.log("🌱 Seeding Data...");

    // Insert Status Types
    await db.run(`INSERT INTO dinoWallet_status_types (id, name, description) VALUES 
        (0, 'Active', 'Record is active'),
        (1, 'Soft-Deleted', 'Record is hidden'),
        (2, 'Permanently-Deleted', 'Record is removed')`);

    // Insert Users
    await db.run(`INSERT INTO dinoWallet_users (id, username, user_email, password_hash, user_bio) VALUES 
        ('39bf2b49-016b-43a3-b2ad-408815d80657', 'system_admin', 'admin@dino.com', 'hashed_secret_123', 'The System Super User'),
        ('10b216bc-32a7-47bf-8db8-ab88b4eaa1c8', 'rupesh_klr', 'rupesh@klr.com', 'hashed_secret_456', 'Lead Developer'),
        ('5feffa09-dd40-4ab8-a094-c95efc3f5014', 'vasu_deva', 'vasu@dev.com', 'hashed_secret_789', 'Beta Tester')`);

    // Insert Assets
    await db.run(`INSERT INTO dinoWallet_assets (id, name, description, sample_package_list_json) VALUES 
        ('02a9a562-a092-49bb-bc3d-14cca6875edf', 'Gold Coins', 'Standard Game Currency', '[{"qty": 50, "price": 10}, {"qty": 105, "price": 20}]'),
        ('4e51f22c-b4c4-4ef3-b9d3-58208b520cfa', 'Diamonds', 'Premium Currency', '[{"qty": 10, "price": 100}]'),
        ('6f13dc3b-d1ab-45f6-a46a-caa15a6bf75b', 'Crystals', 'Rare Item', '[{"qty": 5, "price": 500}]'),
        ('uuid-loyalty-points', 'Loyalty Points', 'Earned via login', NULL)`);

    // Insert Accounts (Treasury & Users)
    const adminId = '39bf2b49-016b-43a3-b2ad-408815d80657';
    const rupeshId = '10b216bc-32a7-47bf-8db8-ab88b4eaa1c8';
    const vasuId = '5feffa09-dd40-4ab8-a094-c95efc3f5014';
    
    const goldId = '02a9a562-a092-49bb-bc3d-14cca6875edf';
    const diamondId = '4e51f22c-b4c4-4ef3-b9d3-58208b520cfa';
    const crystalId = '6f13dc3b-d1ab-45f6-a46a-caa15a6bf75b';

    // Helper to generate UUIDs in Node (simple version for seed script)
    const uuid = () => require('crypto').randomUUID();

    // -- Treasury Accounts
    const adminGoldAccId = uuid();
    await db.run(`INSERT INTO dinoWallet_accounts (id, user_id, asset_id, name, balance) VALUES (?, ?, ?, ?, ?)`, 
        [adminGoldAccId, adminId, goldId, 'Treasury - Gold', 1000000.00]);
    
    await db.run(`INSERT INTO dinoWallet_accounts (id, user_id, asset_id, name, balance) VALUES (?, ?, ?, ?, ?)`, 
        [uuid(), adminId, diamondId, 'Treasury - Diamonds', 1000000.00]);

    await db.run(`INSERT INTO dinoWallet_accounts (id, user_id, asset_id, name, balance) VALUES (?, ?, ?, ?, ?)`, 
        [uuid(), adminId, crystalId, 'Treasury - Crystals', 1000000.00]);

    // -- Rupesh Accounts
    const rupeshGoldAccId = uuid();
    await db.run(`INSERT INTO dinoWallet_accounts (id, user_id, asset_id, name, balance) VALUES (?, ?, ?, ?, ?)`, 
        [rupeshGoldAccId, rupeshId, goldId, 'Rupesh Gold Wallet', 500.00]);
        
    await db.run(`INSERT INTO dinoWallet_accounts (id, user_id, asset_id, name, balance) VALUES (?, ?, ?, ?, ?)`, 
        [uuid(), rupeshId, diamondId, 'Rupesh Diamond Wallet', 10.00]);

    await db.run(`INSERT INTO dinoWallet_accounts (id, user_id, asset_id, name, balance) VALUES (?, ?, ?, ?, ?)`, 
        [uuid(), rupeshId, crystalId, 'Rupesh Crystal Wallet', 3.00]);

    // -- Vasu Accounts
    await db.run(`INSERT INTO dinoWallet_accounts (id, user_id, asset_id, name, balance) VALUES (?, ?, ?, ?, ?)`, 
        [uuid(), vasuId, goldId, 'Vasu Gold Wallet', 500.00]);

    // Insert Ledger Entry (Initial Bonus)
    await db.run(`INSERT INTO dinoWallet_ledger_entries (id, transaction_id, debit_account_id, credit_account_id, amount, asset_name_snapshot, description) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [uuid(), 'INIT-GOLD-RUPESH', adminGoldAccId, rupeshGoldAccId, 500.00, 'Gold Coins', 'Welcome Bonus']);

    console.log("✅ Database 'dino_wallet.db' created successfully!");
    await db.close();
}

seedSQLite().catch(console.error);