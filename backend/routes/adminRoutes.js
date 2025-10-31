// routes/adminRoutes.js
// Admin-only endpoints for managing users and high level data.

const express = require('express')
const router = express.Router()
const {protect, requireAdmin} = require('../middlewares/authMiddleware')
const pool = require('../config/db')
const logger = require('../utils/logger')
const Sentry = require('@sentry/node')

// ──────────────────────────────────────────────────────────────
// @desc    Get list of all users
// @route   GET /api/admin/users
// @access  Private (Admin only)
// ──────────────────────────────────────────────────────────────
router.get('/users', protect, requireAdmin, async (req, res) => {
  try {
    const {rows} = await pool.query(
      'SELECT id, name, email, is_admin, created_at FROM users ORDER BY created_at DESC'
    )

    logger.info({event: 'admin.users.list', count: rows.length, adminId: req.user.id},
      'Admin fetched all users')
    res.status(200).json(rows)
  } catch (err) {
    logger.error({err}, 'Error fetching users')
    Sentry.captureException(err)
    res.status(500).json({message: 'Server error fetching users.'})
  }
})

// ──────────────────────────────────────────────────────────────
// @desc    Promote a user to admin
// @route   PATCH /api/admin/users/:id/promote
// @access  Private (Admin only)
// ──────────────────────────────────────────────────────────────
router.patch('/users/:id/promote', protect, requireAdmin, async (req, res) => {
  const {id} = req.params

  try {
    const {rows} = await pool.query(
      `UPDATE users
         SET is_admin = true
       WHERE id = $1
       RETURNING id, name, email, is_admin`,
      [id]
    )

    if (rows.length === 0) {
      return res.status(404).json({message: 'User not found.'})
    }

    const promoted = rows[0]
    logger.info({event: 'admin.user.promoted', targetId: id, adminId: req.user.id},
      'User promoted to admin')
    res.status(200).json({
      message: `${promoted.email} promoted to admin.`,
      user: promoted,
    })
  } catch (err) {
    logger.error({err}, 'Error promoting user')
    Sentry.captureException(err)
    res.status(500).json({message: 'Server error promoting user.'})
  }
})

// ──────────────────────────────────────────────────────────────
// @desc    Delete a user
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin only)
// ──────────────────────────────────────────────────────────────
router.delete('/users/:id', protect, requireAdmin, async (req, res) => {
  const {id} = req.params

  try {
    const result = await pool.query('DELETE FROM users WHERE id = $1', [id])

    if (result.rowCount === 0) {
      return res.status(404).json({message: 'User not found.'})
    }

    logger.info({event: 'admin.user.deleted', targetId: id, adminId: req.user.id},
      'Admin deleted a user')
    res.status(204).end()
  } catch (err) {
    logger.error({err}, 'Error deleting user')
    Sentry.captureException(err)
    res.status(500).json({message: 'Server error deleting user.'})
  }
})

// ──────────────────────────────────────────────────────────────
// @desc    Get quick stats
// @route   GET /api/admin/stats
// @access  Private (Admin only)
// ──────────────────────────────────────────────────────────────
router.get('/stats', protect, requireAdmin, async (req, res) => {
  try {
    const [{rows: users}] = await Promise.all([
      pool.query('SELECT COUNT(*) AS total_users FROM users'),
    ])

    logger.info({event: 'admin.stats.viewed', adminId: req.user.id},
      'Admin viewed platform stats')
    res.status(200).json({
      total_users: parseInt(users[0].total_users, 10),
      message: 'Admin stats fetched successfully.',
    })
  } catch (err) {
    logger.error({err}, 'Error fetching admin stats')
    Sentry.captureException(err)
    res.status(500).json({message: 'Server error fetching stats.'})
  }
})

module.exports = router