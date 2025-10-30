// controllers/seasonController.js
// Responsible for managing seasons (create, read, update, delete).

const pool = require('../config/db') // PostgreSQL pool for database queries
const Sentry = require('@sentry/node') // Error tracking & performance monitoring
const logger = require('../utils/logger') // Logger (Pino)

// ──────────────────────────────────────────────────────────────
// @desc    Get the currently active season
// @route   GET /api/seasons/active
// @access  Private (logged-in users)
// ──────────────────────────────────────────────────────────────
exports.getActiveSeason = async (req, res) => {
  try {
    const {rows} = await pool.query(
      'SELECT * FROM seasons WHERE is_active = true LIMIT 1'
    )
    const season = rows[0]

    if (!season) {
      logger.info({event: 'season.not_found' }, 'No active season found')
      return res.status(404).json({message: 'No active season found'})
    }

    logger.info({event: 'season.active_found', seasonId: season.id }, 'Active season fetched')
    return res.status(200).json(season)
  } catch (err) {
    logger.error({err}, 'Error fetching active season')
    Sentry.captureException(err)
    return res.status(500).json({message: 'Failed to fetch active season'})
  }
}

// ──────────────────────────────────────────────────────────────
// @desc    Get all seasons
// @route   GET /api/seasons
// @access  Private (logged-in users)
// ──────────────────────────────────────────────────────────────
exports.getAllSeasons = async (req, res) => {
  try {
    const {rows} = await pool.query(
      'SELECT id, name, year, start_date, end_date, is_active FROM seasons ORDER BY year DESC'
    )

    logger.info({event: 'season.list_fetched', count: rows.length}, 'All seasons fetched')
    return res.status(200).json(rows)
  } catch (err) {
    logger.error({err}, 'Error fetching all seasons')
    Sentry.captureException(err)
    return res.status(500).json({message: 'Failed to fetch seasons'})
  }
}

// ──────────────────────────────────────────────────────────────
// @desc    Create a new season (Admin only)
// @route   POST /api/seasons
// @access  Private (Admin only)
// ──────────────────────────────────────────────────────────────
exports.createSeason = async (req, res) => {
  const {name, year, start_date, end_date, is_active} = req.body

  // Simple validation
  if (!name || !year) {
    return res.status(400).json({message: 'Name and year are required.'})
  }

  try {
    const {rows} = await pool.query(
      `INSERT INTO seasons (name, year, start_date, end_date, is_active)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, year, start_date, end_date, is_active`,
      [name.trim(), year, start_date || null, end_date || null, is_active || false]
    )

    const season = rows[0]
    logger.info(
      {event: 'season.created', seasonId: season.id, user: req.user.id},
      'New season created by admin'
    )

    return res.status(201).json({
      message: 'Season created successfully',
      season,
    })
  } catch (err) {
    logger.error({err}, 'Error creating new season')
    Sentry.captureException(err)
    return res.status(500).json({message: 'Failed to create season'})
  }
}

// ──────────────────────────────────────────────────────────────
// @desc    Update a season (Admin only)
// @route   PUT /api/seasons/:id
// @access  Private (Admin only)
// ──────────────────────────────────────────────────────────────
exports.updateSeason = async (req, res) => {
  const {id} = req.params
  const {name, year, start_date, end_date, is_active} = req.body

  try {
    const {rows} = await pool.query(
      `UPDATE seasons
       SET name = COALESCE($1, name),
           year = COALESCE($2, year),
           start_date = COALESCE($3, start_date),
           end_date = COALESCE($4, end_date),
           is_active = COALESCE($5, is_active)
       WHERE id = $6
       RETURNING id, name, year, start_date, end_date, is_active`,
      [name, year, start_date, end_date, is_active, id]
    )

    if (rows.length === 0) {
      return res.status(404).json({message: 'Season not found.'})
    }

    const updated = rows[0]
    logger.info({event: 'season.updated', seasonId: id, user: req.user.id}, 'Season updated')
    return res.status(200).json({
      message: 'Season updated successfully',
      season: updated,
    })
  } catch (err) {
    logger.error({err}, 'Error updating season')
    Sentry.captureException(err)
    return res.status(500).json({message: 'Failed to update season'})
  }
}

// ──────────────────────────────────────────────────────────────
// @desc    Delete a season (Admin only)
// @route   DELETE /api/seasons/:id
// @access  Private (Admin only)
// ──────────────────────────────────────────────────────────────
exports.deleteSeason = async (req, res) => {
  const {id} = req.params

  try {
    const result = await pool.query('DELETE FROM seasons WHERE id = $1', [id])

    if (result.rowCount === 0) {
      return res.status(404).json({message: 'Season not found.'})
    }

    logger.info({event: 'season.deleted', seasonId: id, user: req.user.id}, 'Season deleted')
    return res.status(204).end()
  } catch (err) {
    logger.error({err}, 'Error deleting season')
    Sentry.captureException(err)
    return res.status(500).json({message: 'Failed to delete season'})
  }
}