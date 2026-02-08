const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const walletController = require('../controllers/walletController');
// const publicController = require('../controllers/publicController');
const authMiddleware = require('../middleware/authMiddleware'); // 👈 Import here

// --- PUBLIC ROUTES (No Auth Middleware needed) ---
router.post('/auth', authController.login);
router.post('/logout', authController.logout);
// router.get('/directory', publicController.getDirectory);

// router.post('/transfer', walletController.transfer);
// router.get('/balance/:id', walletController.getBalance);
// === PROTECTED ROUTES (Apply Middleware here) ===
router.post('/transfer', authMiddleware, walletController.transfer);
router.get('/balance/:id', authMiddleware, walletController.getBalance);

router.get('/user-id/:userid', walletController.getUserByUUID);


module.exports = router;