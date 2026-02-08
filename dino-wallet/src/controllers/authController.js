const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../config/db'); // Your DB Connection
const { TABLES, CURRENT_DB_TYPE, DB_TYPES } = require('../config/constant');
require('dotenv').config();

// --- CONFIGURATION ---
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_dino_key';
// keys for frontend-backend encryption (Must match frontend!)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '12345678901234567890123456789012'; // 32 chars
const IV = process.env.IV || '1234567890123456'; // 16 chars

// --- HELPER: Decrypt Password from Frontend ---
function decryptPayload(encryptedText) {
    try {
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), Buffer.from(IV));
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (error) {
        console.error("Decryption Failed:", error.message);
        return null;
    }
}

// --- CONTROLLER ---
exports.login = async (req, res) => {
    const { username, encryptedPassword } = req.body;

    if (!username || !encryptedPassword) {
        return res.status(400).json({ error: 'Username and Encrypted Password required' });
    }

    // 1. Decrypt the Password (from Frontend)
    const originalPassword = decryptPayload(encryptedPassword);
    
    // Fallback: If decryption fails (or for testing plain text), use the input as is
    const passwordToTest = originalPassword || encryptedPassword;

    try {
        // 2. Fetch User from DB
        let user;
        const sql = `SELECT * FROM ${TABLES.USERS} WHERE username = ?`;
        
        if (CURRENT_DB_TYPE === DB_TYPES.MYSQL) {
            const [rows] = await db.execute(sql, [username]);
            user = rows[0];
        } else {
            user = await db.get(sql, [username]); // SQLite syntax
        }

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials (User not found)' });
        }

        // 3. Compare Password with DB Hash
        // Note: Your seed data has 'hashed_secret_123'. Bcrypt will fail on that.
        // You must update the DB with a REAL bcrypt hash for this to work.
        const match = await bcrypt.compare(passwordToTest, user.password_hash);

        // ** Temporary Dev Fix **: If bcrypt fails, check simple string match for seed data
        const devMatch = (process.env.NODE_ENV === 'development' && user.password_hash === passwordToTest);

        if (!match && !devMatch) {
            return res.status(401).json({ error: 'Invalid credentials (Password mismatch)' });
        }

        // 4. Generate JWT Token
        const token = jwt.sign(
            { id: user.id, username: user.username, role: 'user' },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        // 5. Set Cookie
        res.cookie('auth_token', token, {
            httpOnly: true, // Prevents JS access (XSS protection)
            secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
            maxAge: 3600000 // 1 Hour
        });

        // 6. Send Success Response
        res.json({
            status: 'success',
            message: 'Authentication Successful',
            user: {
                id: user.id,
                username: user.username,
                last_active: user.last_active_on
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.logout = (req, res) => {
    res.clearCookie('auth_token');
    res.json({ status: 'success', message: 'Logged out successfully' });
};