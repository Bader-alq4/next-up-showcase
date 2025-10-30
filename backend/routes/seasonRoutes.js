// routes/seasonRoutes.js
// Handles all endpoints related to Seasons (listing, creating, updating, deleting).

const express = require('express')
const router = express.Router()
const seasonController = require('../controllers/seasonController')
const { protect, requireAdmin } = require('../middlewares/authMiddleware')

// ──────────────────────────────────────────────────────────────
// @desc    Get the currently active season
// @route   GET /api/seasons/active
// @access  Private (Logged-in users)
// ──────────────────────────────────────────────────────────────
router.get('/active', protect, seasonController.getActiveSeason)

// ──────────────────────────────────────────────────────────────
// @desc    Get all seasons
// @route   GET /api/seasons
// @access  Private (Admin only)
// ──────────────────────────────────────────────────────────────
router.get('/', protect, requireAdmin, seasonController.getAllSeasons)

// ──────────────────────────────────────────────────────────────
// @desc    Create a new season
// @route   POST /api/seasons
// @access  Private (Admin only)
// ──────────────────────────────────────────────────────────────
router.post('/', protect, requireAdmin, seasonController.createSeason)

// ──────────────────────────────────────────────────────────────
// @desc    Update a season
// @route   PUT /api/seasons/:id
// @access  Private (Admin only)
// ──────────────────────────────────────────────────────────────
router.put('/:id', protect, requireAdmin, seasonController.updateSeason)

// ──────────────────────────────────────────────────────────────
// @desc    Delete a season
// @route   DELETE /api/seasons/:id
// @access  Private (Admin only)
// ──────────────────────────────────────────────────────────────
router.delete('/:id', protect, requireAdmin, seasonController.deleteSeason)

module.exports = router