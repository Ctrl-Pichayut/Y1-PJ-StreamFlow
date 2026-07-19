const express = require('express');
const router = express.Router();
const donationController = require('../controllers/donationController');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/', upload.single('slip'), donationController.submitDonation);

router.get('/', authMiddleware, donationController.getDonations);

module.exports = router;
