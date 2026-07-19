exports.sendTestAlert = async (req, res) => {
  try {
    const io = req.app.get('io');
    const user = req.user;

    if (io) {
      io.to(user.username).emit('donation', {
        donor_name: 'Test Donor',
        amount: '100.00',
        message: 'ทดสอบระบบ alert!',
      });

      res.json({ message: 'Test alert sent!' });
    } else {
      res.status(500).json({ error: 'Socket.io not initialized' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
