const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User');


const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

const otps = new Map();

exports.register = async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const userExists = await User.findByEmailOrUsername(email, username);
    if (userExists.length > 0) {
      return res.status(400).json({ error: 'Username or Email already taken' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otps.set(email, { otp, username, password });

    try {
      await transporter.sendMail({
        from: '"Donation Platform" <' + process.env.GMAIL_USER + '>',
        to: email,
        subject: 'Your Donation Platform Registration OTP',
        html: `<p>Your One-Time Password for registration is: <br/><br/><strong>${otp}</strong></p>`
      });
      console.log(`[EMAIL SENT] OTP sent to: ${email}`);
      res.json({ message: 'OTP sent to email' });
    } catch (emailError) {
      console.error('Error sending email via Nodemailer:', emailError);
      return res.status(500).json({ error: 'Failed to send OTP email. Please try again.' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.verifyOTP = async (req, res) => {
  const { email, otp } = req.body;
  try {
    const data = otps.get(email);
    if (!data || data.otp !== otp) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.password, salt);

    const user = await User.create(data.username, email, hashedPassword);


    otps.delete(email);

    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });

    res.json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findByLoginIdentifier(email);

    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
    res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
