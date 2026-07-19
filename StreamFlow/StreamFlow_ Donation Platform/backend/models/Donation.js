const db = require('../config/database');

class Donation {
  static async create(user_id, donor_name, message, amount, slip_url, trans_ref = null) {
    const result = await db.query(
      'INSERT INTO donations (user_id, donor_name, message, amount, slip_url, trans_ref) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [user_id, donor_name, message, amount, slip_url, trans_ref]
    );
    return result.rows[0];
  }

  static async findByTransRef(transRef) {
    const result = await db.query('SELECT * FROM donations WHERE trans_ref = $1 LIMIT 1', [transRef]);
    return result.rows[0] || null;
  }

  static async findByUserId(user_id) {
    const result = await db.query('SELECT * FROM donations WHERE user_id = $1 ORDER BY created_at DESC', [user_id]);
    return result.rows;
  }


}

module.exports = Donation;
