const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `avatar-${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage: storage });

router.get('/profile/:username', userController.getPublicProfile);

router.get('/me', authMiddleware, userController.getOwnProfile);

router.put('/me', authMiddleware, userController.updateProfile);

router.post('/me/avatar', authMiddleware, upload.single('avatar'), userController.uploadAvatar);

router.delete('/me/avatar', authMiddleware, userController.deleteAvatar);

router.delete('/me', authMiddleware, userController.deleteAccount);

module.exports = router;
