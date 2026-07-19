const Donation = require('../models/Donation');
const User = require('../models/User');

const slipVerifier = require('../utils/slipVerifier');
const fs = require('fs');

exports.submitDonation = async (req, res) => {
  try {
    const { user_id, donor_name, message } = req.body;
    const slipFile = req.file;

    if (!slipFile) {
      return res.status(400).json({ success: false, message: 'กรุณาแนบรูปสลิปโอนเงิน' });
    }

    const filePath = slipFile.path;


    const result = await slipVerifier.verifySlip(filePath, { checkDuplicate: true });
    console.log('[Donation] Thunder API Result:', JSON.stringify(result, null, 2));

    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    if (!result || !result.success) {
      let errMsg = result?.error?.message || 'สลิปไม่ถูกต้องหรือไม่สามารถอ่าน QR Code ได้';
      if (typeof errMsg === 'string' && (errMsg.toLowerCase().includes('invalid slip') || errMsg.toLowerCase().includes('unable to read qr code'))) {
        errMsg = 'สลิปไม่ถูกต้องหรือไม่สามารถอ่าน QR Code ได้';
      }
      console.error('[Donation] Verification failed:', errMsg);
      return res.status(400).json({ success: false, message: errMsg });
    }

    if (result.data.isDuplicate) {
      console.warn('[Donation] Duplicate slip detected by Thunder API');
      return res.status(400).json({ success: false, message: 'สลิปนี้ถูกใช้งานไปแล้ว (สลิปซ้ำ)' });
    }

    const transRef = result.data.rawSlip?.transRef;
    if (transRef) {
      const existingDonation = await Donation.findByTransRef(transRef);
      if (existingDonation) {
        console.warn(`[Donation] Duplicate transRef found in DB: ${transRef}`);
        return res.status(400).json({ success: false, message: 'สลิปนี้ถูกใช้งานไปแล้ว (สลิปซ้ำ)' });
      }
    }

    const slipAmount = result.data.rawSlip.amount.amount;
    const senderName = result.data.rawSlip.sender?.account?.name?.th || 'Unknown';
    console.log(`[Donation] Slip verified! Amount: ${slipAmount}, Sender: ${senderName}`);

    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'ไม่พบสตรีมเมอร์' });
    }

    const slip_url = `/uploads/${slipFile.filename}`;
    const newDonation = await Donation.create(user_id, donor_name, message, slipAmount, slip_url, transRef);

    if (global.io) {
      global.io.to(user.username).emit('donation', {
        donor_name: donor_name || 'Anonymous',
        amount: slipAmount,
        message: message || '',
      });
      console.log(`[Donation] Alert emitted to room: ${user.username}`);
    }

    console.log(`[Donation] Saved: ${donor_name || 'Anonymous'} donated ${slipAmount} THB to ${user.username}`);

    res.status(200).json({ success: true, message: 'Success!', data: newDonation });

  } catch (error) {
    console.error('Submit Donation Error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์' });
  }
};

exports.getDonations = async (req, res) => {
  try {
    const donations = await Donation.findByUserId(req.user.id);
    res.status(200).json({ success: true, data: donations });
  } catch (error) {
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลโดเนท' });
  }
};

