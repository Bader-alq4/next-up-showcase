// models/user.js
// Database helper for users: creation, lookup, and updates

const pool = require('../config/db')
const bcrypt = require('bcryptjs')

class User {
  // Create new user with hashed password
  static async createUser(name, email, password, is_admin = false) {
    const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10)
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)

    const result = await pool.query(
      `INSERT INTO users (name, email, password, is_admin)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, is_admin`,
      [name.trim(), email.toLowerCase(), hashedPassword, is_admin]
    )
    return result.rows[0]
  }

  // Find user by email
  static async findUserByEmail(email) {
    const result = await pool.query(
      `SELECT id, name, email, password, is_admin
         FROM users
        WHERE email = $1`,
      [email.toLowerCase()]
    )
    return result.rows[0]
  }

  // Find user by id
  static async findUserById(id) {
    const result = await pool.query(
      `SELECT id, name, email, is_admin
         FROM users
        WHERE id = $1`,
      [id]
    )
    return result.rows[0]
  }

  // Update password (rehash)
  static async updatePassword(id, newPassword) {
    const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10)
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS)

    const result = await pool.query(
      `UPDATE users
          SET password = $1
        WHERE id = $2
        RETURNING id, email, is_admin`,
      [hashedPassword, id]
    )
    return result.rows[0]
  }

  // Update basic profile info
  static async updateProfile(id, name, email) {
    const result = await pool.query(
      `UPDATE users
          SET name = COALESCE($2, name),
              email = COALESCE($3, email)
        WHERE id = $1
        RETURNING id, name, email, is_admin`,
      [id, name?.trim(), email?.toLowerCase()]
    )
    return result.rows[0]
  }
}

module.exports = User