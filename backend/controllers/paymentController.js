// controllers/paymentController.js
// Handles Stripe webhooks and payment confirmations for tryout registration

const Stripe = require('stripe')
const Sentry = require('@sentry/node')
const logger = require('../utils/logger')
const pool = require('../config/db')

const stripe = Stripe(process.env.STRIPE_SECRET_KEY)
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET

if (!endpointSecret) {
  throw new Error('Missing env var: STRIPE_WEBHOOK_SECRET')
}

// ──────────────────────────────────────────────────────────────
// @desc   Handle Stripe webhook events
// @route  POST /api/payments/webhook
// @access Public (Stripe only)
// ──────────────────────────────────────────────────────────────
exports.handleStripeWebhook = async (req, res) => {
  let event

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      req.headers['stripe-signature'],
      endpointSecret
    )
    logger.info({id: event.id, type: event.type }, 'Stripe webhook verified')
  } catch (err) {
    logger.error({message: err.message}, 'Webhook signature verification failed')
    Sentry.captureException(err)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const {client_reference_id, payment_status} = session

      if (payment_status !== 'paid') {
        logger.warn({id: event.id}, 'Payment not completed; ignoring')
        return res.json({received: true})
      }

      // Parse reference: userId|seasonId
      if (!client_reference_id || !client_reference_id.includes('|')) {
        logger.warn('Malformed client_reference_id')
        return res.json({received: true})
      }

      const [userId, seasonId] = client_reference_id.split('|')

      // Verify user and season exist
      const userExists = (await pool.query('SELECT 1 FROM users WHERE id=$1', [userId])).rowCount
      const seasonExists = (await pool.query('SELECT 1 FROM seasons WHERE id=$1', [seasonId])).rowCount
      if (!userExists || !seasonExists) {
        logger.warn({userId, seasonId}, 'Invalid user or season ID')
        return res.json({received: true})
      }

      // Insert payment record (simplified)
      await pool.query(
        `INSERT INTO tryouts (user_id, season_id, payment_status, created_at)
         VALUES ($1, $2, 'paid', NOW())
         ON CONFLICT (user_id, season_id) DO NOTHING`,
        [userId, seasonId]
      )

      logger.info({userId, seasonId}, 'Payment recorded successfully')
    } else {
      logger.info({type: event.type}, 'Unhandled Stripe event type')
    }

    res.json({received: true})
  } catch (err) {
    logger.error({err}, 'Error processing Stripe event')
    Sentry.captureException(err)
    res.status(500).json({received: false})
  }
}

// ──────────────────────────────────────────────────────────────
// @desc   Confirm checkout session manually (client redirect)
// @route  GET /api/payments/confirm
// @access Private (protected route)
// ──────────────────────────────────────────────────────────────
exports.confirmCheckout = async (req, res) => {
  try {
    const sessionId = req.query.session_id
    if (!sessionId) return res.status(400).json({message: 'session_id required'})

    const session = await stripe.checkout.sessions.retrieve(sessionId)
    if (!session || session.payment_status !== 'paid') {
      return res.json({recorded: false, reason: 'not_paid'})
    }

    const [userId, seasonId] = (session.client_reference_id || '').split('|')
    if (!userId || !seasonId) {
      return res.json({recorded: false, reason: 'bad_ref'})
    }

    await pool.query(
      `INSERT INTO tryouts (user_id, season_id, payment_status, created_at)
       VALUES ($1, $2, 'paid', NOW())
       ON CONFLICT (user_id, season_id) DO NOTHING`,
      [userId, seasonId]
    )

    logger.info({userId, seasonId}, 'Tryout inserted via confirm endpoint')
    res.json({recorded: true})
  } catch (err) {
    logger.error({err}, 'Error confirming checkout')
    Sentry.captureException(err)
    res.status(500).json({recorded: false})
  }
}