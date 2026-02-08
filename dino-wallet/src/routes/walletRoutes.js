const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');

router.post('/transfer', walletController.transfer);
router.get('/balance/:id', walletController.getBalance);

module.exports = router;