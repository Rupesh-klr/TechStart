const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

// GET /api/v1/dino-wallet/directory
router.get('/directory', publicController.getDirectory);

module.exports = router;