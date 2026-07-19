const User = require('../models/User');

exports.getPublicProfile = async (req, res) => {
  try {
    const user = await User.findPublicProfileByUsername(req.params.username);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getOwnProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const user = await User.updateProfile(req.user.id, req.body);
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.uploadAvatar = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  
  const avatarUrl = `/uploads/${req.file.filename}`;
  try {
    const user = await User.updateProfile(req.user.id, { avatar: avatarUrl });
    res.json({ avatar: avatarUrl, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.deleteAvatar = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user && user.avatar && user.avatar.startsWith('/uploads')) {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(__dirname, '..', user.avatar);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    const updatedUser = await User.updateProfile(req.user.id, { avatar: null });
    res.json({ message: 'Avatar deleted', user: updatedUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const deletedUser = await User.delete(req.user.id);
    if (!deletedUser) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
