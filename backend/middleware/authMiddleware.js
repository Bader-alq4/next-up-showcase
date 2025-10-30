// middlewares/authMiddleware.js
// Purpose: Protect private routes and enforce role-based access (admin only)

const jwt = require('jsonwebtoken')
const logger = require('../utils/logger')

// ──────────────────────────────────────────────────────────────
// @desc  Require user to be logged in (any role). Used on any private route
// ──────────────────────────────────────────────────────────────
exports.protect = (req, res, next) => {
  let token

  // Access token can come from Authorization header: "Bearer <token>"
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1]
  }

  // No token -> unauthorized
  if (!token) {
    return res.status(401).json({ message: 'Not authorized. No token provided.' })
  }

  try {
    // Verify token using JWT_SECRET
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded // attach decoded payload (id, email, role, etc.) to request
    next()
  } catch (err) {
    logger.warn({ err }, 'Invalid or expired token')
    return res.status(403).json({ message: 'Token invalid or expired.' })
  }
}

// ──────────────────────────────────────────────────────────────
// @desc     Restrict access to admin users only. Makes sure the user is an admin
// Example:  router.post('/admin/create-season', protect, requireAdmin, seasonController.createSeason)
// ──────────────────────────────────────────────────────────────
exports.requireAdmin = (req, res, next) => {
  if (!req.user || !req.user.is_admin) {
    return res.status(403).json({ message: 'Admin privileges required.' })
  }
  next()
}