// routes/authRoutes.js
// Handles all authentication-related endpoints (register, login, refresh, logout)

const express = require('express')
const router = express.Router()
const authController = require('../controllers/authController')

// ──────────────────────────────────────────────────────────────
// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
// ──────────────────────────────────────────────────────────────
router.post('/register', authController.registerUser)

// ──────────────────────────────────────────────────────────────
// @desc    Login existing user
// @route   POST /api/auth/login
// @access  Public
// ──────────────────────────────────────────────────────────────
router.post('/login', authController.loginUser)

// ──────────────────────────────────────────────────────────────
// @desc    Refresh expired access token (using refresh cookie)
// @route   POST /api/auth/refresh
// @access  Public
// ──────────────────────────────────────────────────────────────
router.post('/refresh', authController.refreshToken)

// ──────────────────────────────────────────────────────────────
// @desc    Logout user (clear refresh cookie)
// @route   POST /api/auth/logout
// @access  Public
// ──────────────────────────────────────────────────────────────
router.post('/logout', authController.logoutUser)

module.exports = router