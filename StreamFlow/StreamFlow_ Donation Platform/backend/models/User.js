const db = require('../config/database');

class User {
  static async findByEmailOrUsername(email, username) {
    const result = await db.query('SELECT * FROM users WHERE email = $1 OR username = $2', [email, username]);
    return result.rows;
  }



  static async findByLoginIdentifier(identifier) {
    const result = await db.query('SELECT * FROM users WHERE email = $1 OR username = $1', [identifier]);
    return result.rows[0];
  }

  static async findById(id) {
    const result = await db.query(
      'SELECT id, username, email, avatar, payment_info, first_name, last_name, national_id, social_media, display_name, phone, created_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async findPublicProfileByUsername(username) {
    const result = await db.query(
      'SELECT id, username, display_name, avatar, payment_info, phone FROM users WHERE LOWER(username) = LOWER($1)',
      [username]
    );
    return result.rows[0];
  }

  static async create(username, email, hashedPassword) {
    const result = await db.query(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email',
      [username, email, hashedPassword]
    );
    return result.rows[0];
  }

  static async updateProfile(id, data) {
    const fields = [];
    const values = [];
    let idx = 1;

    if (data.payment_info !== undefined) { fields.push(`payment_info = $${idx++}`); values.push(data.payment_info); }
    if (data.avatar !== undefined) { fields.push(`avatar = $${idx++}`); values.push(data.avatar); }
    if (data.first_name !== undefined) { fields.push(`first_name = $${idx++}`); values.push(data.first_name); }
    if (data.last_name !== undefined) { fields.push(`last_name = $${idx++}`); values.push(data.last_name); }
    if (data.national_id !== undefined) { fields.push(`national_id = $${idx++}`); values.push(data.national_id); }
    if (data.social_media !== undefined) { fields.push(`social_media = $${idx++}`); values.push(data.social_media); }
    if (data.display_name !== undefined) { fields.push(`display_name = $${idx++}`); values.push(data.display_name); }
    if (data.phone !== undefined) { fields.push(`phone = $${idx++}`); values.push(data.phone); }

    if (fields.length === 0) return await this.findById(id);

    values.push(id);
    const result = await db.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    return result.rows[0];
  }

  static async delete(id) {
    await db.query('DELETE FROM donations WHERE user_id = $1', [id]);
    const result = await db.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }

}

module.exports = User;
