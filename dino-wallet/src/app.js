const express = require('express');
const http = require('http'); 
const { Server } = require('socket.io');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const walletRoutes = require('./routes/walletRoutes');
const publicRoutes = require('./routes/publicRoutes');
// const authMiddleware = require('./middleware/authMiddleware'); // ❌ REMOVE FROM HERE (Move to routes)
require('dotenv').config();
const authMiddleware = require('./middleware/authMiddleware'); // Import Auth

const app = express();
const server = http.createServer(app); 

// --- 1. GLOBAL VARIABLES (For Stats) ---
let serverRequestCount = 0; // Simple in-memory counter

// --- 2. SOCKET.IO SETUP ---
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

app.use((req, res, next) => {
    req.io = io;
    next();
});

// --- 3. MIDDLEWARE SETUP ---
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// --- 4. REQUEST INTERCEPTOR (The "Request Filter") ---
// Tracks count and start time for every request
app.use((req, res, next) => {
    serverRequestCount++;
    req.requestStartTime = Date.now(); // Start timer
    req.currentRequestNumber = serverRequestCount;
    console.log(`📥 Req #${serverRequestCount}: ${req.method} ${req.url}`);
    next();
});

// --- 5. RESPONSE INTERCEPTOR (The "Res Editor") ---
// Wraps every response with metadata (Time, Count, Auth Status)
app.use((req, res, next) => {
    const originalJson = res.json;
    
    res.json = function (data) {
        const enhancedResponse = {
            meta: {
                success: res.statusCode >= 200 && res.statusCode < 300,
                timestamp: new Date().toISOString(),
                path: req.originalUrl,
                method: req.method,
                req_id: req.currentRequestNumber,
                server_node: process.env.HOSTNAME || 'dino-node-1',
                execution_time_ms: Date.now() - req.requestStartTime, // ⏱️ Calc duration
                auth_status: req.user ? 'Authenticated' : 'Guest'
            },
            data: data 
        };
        
        return originalJson.call(this, enhancedResponse);
    };
    next();
});

// --- 6. ROUTES ---
// ✅ FIX: Don't force authMiddleware here. Let walletRoutes.js decide what needs Auth.
// Apply Auth Middleware globally (or you can apply it per route)
// app.use('/api/v1/wallet', authMiddleware, walletRoutes);
app.use('/api/v1/wallet', walletRoutes);
app.use('/api/v1/dino-wallet', publicRoutes);

// --- 7. SOCKET EVENTS ---
io.on('connection', (socket) => {
    // console.log(`⚡ Client Connected: ${socket.id}`);
    socket.on('disconnect', () => {
        // console.log(`❌ Client Disconnected: ${socket.id}`);
    });
});

// --- 8. START SERVER ---
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🦖 Dino Wallet running on port ${PORT}`);
    console.log(`📊 Request Counter Started at: 0`);
});



// const express = require('express');
// const walletRoutes = require('./routes/walletRoutes');
// require('dotenv').config();

// const app = express();
// app.use(express.json());

// app.use('/api/v1/wallet', walletRoutes);

// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//     console.log(`Dino Wallet running on port ${PORT}`);
// });