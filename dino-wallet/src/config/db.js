const { DB_TYPES, CURRENT_DB_TYPE } = require('./constant');
require('dotenv').config();

let dbConnection;

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'dino_wallet',
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

console.log(`🔌 Initializing Database Connection... [Type: ${CURRENT_DB_TYPE}]`);

switch (CURRENT_DB_TYPE) {
    case DB_TYPES.MYSQL:
        const mysql = require('mysql2/promise');
        dbConnection = mysql.createPool({
            ...dbConfig,
            port: process.env.DB_PORT || 3306
        });
        console.log("✅ MySQL Pool Created");
        break;

    case DB_TYPES.POSTGRES:
        const { Pool } = require('pg');
        dbConnection = new Pool({
            ...dbConfig,
            port: process.env.DB_PORT || 5432
        });
        console.log("✅ PostgreSQL Pool Created");
        break;

    case DB_TYPES.MSSQL:
        const mssql = require('mssql');
        const sqlConfig = {
            user: dbConfig.user,
            password: dbConfig.password,
            database: dbConfig.database,
            server: dbConfig.host,
            pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
            options: { encrypt: true, trustServerCertificate: true } // For Azure/Local Dev
        };
        // MSSQL requires an async connect, dealing with this via a promise wrapper usually recommended
        dbConnection = new mssql.ConnectionPool(sqlConfig).connect(); 
        console.log("✅ MSSQL Pool Created");
        break;

    case DB_TYPES.SQLITE:
        const sqlite3 = require('sqlite3').verbose();
        const { open } = require('sqlite');
        // Opens a local file named 'dino_wallet.db'
        dbConnection = open({
            filename: '../../dino_wallet.db',
            driver: sqlite3.Database
        });
        console.log("✅ SQLite File DB Connected");
        break;

    case DB_TYPES.MONGO:
        const mongoose = require('mongoose');
        const uri = process.env.MONGO_URI || `mongodb://${dbConfig.host}:${process.env.DB_PORT || 27017}/${dbConfig.database}`;
        mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
            .then(() => console.log("✅ MongoDB Connected"))
            .catch(err => console.error("❌ Mongo Connection Error:", err));
        dbConnection = mongoose.connection; 
        break;

    default:
        console.error("❌ Unknown DB_TYPE selected in .env");
        process.exit(1);
}
console.error("✅ DB Connected");
module.exports = dbConnection;