// controllers/seasonController.js
// Responsible for managing seasons (create, read, update, delete).

const Sentry = require('@sentry/node') // Error tracking & performance monitoring
const logger = require('../utils/logger') // logger (Pino)
const Season = require('../models/season')

// ──────────────────────────────────────────────────────────────
// @desc    Get the currently active season
// @route   GET /api/seasons/active
// @access  Private (logged-in users)
// ──────────────────────────────────────────────────────────────
exports.getActiveSeason = async (req, res) => {
  try {
    const season = await Season.getActiveSeason()

    if (!season) {
      logger.info({event: 'season.not_found'}, 'No active season found')
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
    const seasons = await Season.getAllSeasons()

    logger.info({ event: 'season.list_fetched', count: seasons.length }, 'All seasons fetched')
    return res.status(200).json(seasons)
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
  const {name} = req.body

  if (!name) {
    return res.status(400).json({message: 'Name is required.'})
  }

  try {
    const season = await Season.create({ name })

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
    const updated = await Season.update(id, { name, year, start_date, end_date, is_active })

    if (!updated) {
      return res.status(404).json({message: 'Season not found.'})
    }

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
    const deleted = await Season.delete(id)

    if (!deleted) {
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