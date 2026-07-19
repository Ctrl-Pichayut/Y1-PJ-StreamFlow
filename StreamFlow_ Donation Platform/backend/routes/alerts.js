const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/test', authMiddleware, alertController.sendTestAlert);

module.exports = router;
