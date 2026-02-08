const jwt = require('jsonwebtoken');
require('dotenv').config();

const authMiddleware = (req, res, next) => {
    // 1. Check if Auth is disabled in .env (Feature Flag)
    if (process.env.ENABLE_AUTH !== 'true') {
        req.user = { id: 'no-auth-user', role: 'admin' }; // Mock user
        return next();
    }

    // 2. Get Token from Cookie or Header
    const token = req.cookies?.auth_token || req.headers['authorization']?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    // 3. Verify Token
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Forbidden: Invalid token' });
    }
};

module.exports = authMiddleware;