require('dotenv').config();

// Database Type Enums
const DB_TYPES = {
    SQLITE: 0,   // Local file-based SQL
    MYSQL: 1,    // Hostinger / Local MySQL
    POSTGRES: 2, // AWS RDS / Heroku
    MONGO: 3,    // MongoDB Atlas
    MSSQL: 4     // Azure SQL
};

// Centralized Table Configuration
const TABLES = {
    USERS: 'dinoWallet_users',
    ASSETS: 'dinoWallet_assets',
    ACCOUNTS: 'dinoWallet_accounts',
    LEDGER: 'dinoWallet_ledger_entries',
    STATUS_TYPES: 'dinoWallet_status_types'
};

// Get selected DB from .env (Default to MySQL if missing)
const CURRENT_DB_TYPE = process.env.DB_TYPE ? parseInt(process.env.DB_TYPE) : DB_TYPES.MYSQL;

module.exports = {
    TABLES,
    DB_TYPES,
    CURRENT_DB_TYPE
};