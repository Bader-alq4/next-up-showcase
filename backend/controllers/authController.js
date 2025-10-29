// controllers/authController -> responsible for everything related to user authentication and session handling

// controllers/authController.js
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const pool = require('../config/db')
const logger = require('../utils/logger')
const Sentry = require('@sentry/node')

// Helper functions for signing tokens
const signAccessToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES || '1h',
    algorithm: 'HS256',
  })

const signRefreshToken = (payload) =>
  jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_EXPIRES || '7d',
    algorithm: 'HS256',
  })

// ──────────────────────────────────────────────────────────────
// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
// ──────────────────────────────────────────────────────────────
exports.registerUser = async (req, res) => {
  const {name, email, password} = req.body

  if (!name || !email || !password) {
    return res.status(400).json({message: 'All fields are required.'})
  }

  try {
    // Check duplicate email
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email])
    if (existing.rowCount > 0) {
      return res.status(409).json({message: 'Email already in use.'})
    }
    // Hash password and create user
    const hashed = await bcrypt.hash(password, 10)
    const {rows} = await pool.query(
      `INSERT INTO users (name, email, password)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, is_admin`,
      [name.trim(), email.toLowerCase().trim(), hashed]
    )
    const user = rows[0]

    // Generate tokens
    const accessToken = signAccessToken({id: user.id, email: user.email, is_admin: user.is_admin})
    const refreshToken = signRefreshToken({id: user.id})

    logger.info({user: user.id}, 'User registered successfully')
    return res.status(201).json({
      message: 'Registration successful',
      user: {id: user.id, name: user.name, email: user.email},
      token: accessToken,
    })
  } catch (err) {
    Sentry.captureException(err)
    logger.error({err}, 'Registration error')
    res.status(500).json({message: 'Server error during registration.'})
  }
}

// ──────────────────────────────────────────────────────────────
// @desc    Login existing user
// @route   POST /api/auth/login
// @access  Public
// ──────────────────────────────────────────────────────────────
exports.loginUser = async (req, res) => {
  const {email, password} = req.body
  if (!email || !password) {
    return res.status(400).json({message: 'Email and password required.'})
  }

  try {
    const {rows} = await pool.query(
      'SELECT id, name, email, password, is_admin FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    )
    const user = rows[0]
    if (!user) {
      return res.status(401).json({message: 'Invalid credentials.'})
    } 

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return res.status(401).json({message: 'Invalid credentials.'})
    }

    const accessToken = signAccessToken({id: user.id, email: user.email, is_admin: user.is_admin})
    const refreshToken = signRefreshToken({id: user.id})

    res.cookie('refresh', refreshToken, {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })

    logger.info({user: user.id}, 'User logged in')
    res.json({
      message: 'Login successful',
      user: {id: user.id, name: user.name, email: user.email, is_admin: user.is_admin},
      token: accessToken,
    })
  } catch (err) {
    Sentry.captureException(err)
    logger.error({err}, 'Login error')
    res.status(500).json({message: 'Server error during login.'})
  }
}

// ──────────────────────────────────────────────────────────────
// @desc    Refresh access token using refresh cookie
// @route   POST /api/auth/refresh
// @access  Public
// ──────────────────────────────────────────────────────────────
exports.refreshToken = async (req, res) => {
  const token = req.cookies.refresh
  if (!token) {
    return res.status(401).json({message: 'No refresh token provided.'})
  }

  try {
    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET)
    const accessToken = signAccessToken({id: decoded.id})
    const newRefresh = signRefreshToken({id: decoded.id})

    res.cookie('refresh', newRefresh, {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })

    return res.json({token: accessToken})
  } catch (err) {
    Sentry.captureException(err)
    logger.error({err}, 'Token refresh error')
    res.status(403).json({message: 'Invalid or expired refresh token.'})
  }
}

// ──────────────────────────────────────────────────────────────
// @desc    Logout user (clear refresh token)
// @route   POST /api/auth/logout
// @access  Public
// ──────────────────────────────────────────────────────────────
exports.logoutUser = async (_req, res) => {
  try {
    res.clearCookie('refresh', {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
    })
    logger.info('User logged out')
    res.status(204).end()
  } catch (err) {
    logger.error({err}, 'Logout error')
    res.status(500).json({message: 'Server error during logout.'})
  }
}