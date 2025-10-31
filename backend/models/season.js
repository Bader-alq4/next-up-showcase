// models/season.js
// Handles database operations for Seasons (events)

const pool = require('../config/db')

class Season {
  // Fetch the currently active season
  static async getActiveSeason() {
    const result = await pool.query(
      `SELECT id, name, is_active, created_at
         FROM seasons
        WHERE is_active = true
        LIMIT 1`
    )
    return result.rows[0]
  }

  // Fetch all seasons
  static async getAllSeasons() {
    const result = await pool.query(
      `SELECT id, name, is_active, created_at
         FROM seasons
        ORDER BY created_at DESC`
    )
    return result.rows
  }

  // Create a new season
  static async create({name}) {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      // Deactivate any currently active seasons (only one active at a time)
      await client.query(`UPDATE seasons SET is_active = false WHERE is_active = true`)

      // Insert a new active season
      const {rows} = await client.query(
        `INSERT INTO seasons (name, is_active)
         VALUES ($1, true)
         RETURNING id, name, is_active, created_at`,
        [name.trim()]
      )

      await client.query('COMMIT')
      return rows[0]
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  }
}

module.exports = Season
