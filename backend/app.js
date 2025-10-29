// app.js

require('dotenv').config()

const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const helmet = require('helmet')
const cookieParser = require('cookie-parser')
const rateLimit = require('express-rate-limit')

const Sentry = require('@sentry/node')
const Tracing = require('@sentry/tracing')

// Controllers / Middleware
const paymentController = require('./controllers/paymentController')
const {protect} = require('./middleware/authMiddleware')

/* -------------------- Routers --------------------------- */
const authRoutes = require('./routes/authRoutes')
const seasonRoutes = require('./routes/seasonRoutes')
const adminRoutes = require('./routes/adminRoutes')

const app = express()
app.disable('x-powered-by')
app.set('trust proxy', 1)

/* ─────────────────── Sentry ─────────────────── */
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    integrations: [
      new Sentry.Integrations.Http({tracing: true}),
      new Tracing.Integrations.Express({app}),
    ],
    tracesSampleRate: 1.0,
  })
  app.use(Sentry.Handlers.requestHandler())
  app.use(Sentry.Handlers.tracingHandler())
}

/* ─────────────────────────── Logging & Core middleware ─────────────────────────── */
app.use(process.env.NODE_ENV === 'production' ? morgan('combined') : morgan('dev'))
app.use(cookieParser())

/* --------------------------- CORS Configuration ----------------------------------- */
if (process.env.NODE_ENV === 'production') {
  app.use(cors({
    origin: process.env.FRONTEND_URL, // only allow the deployed frontend
    credentials: true, // allow cookies and auth headers
  }))
} else {
  app.use(cors({
    origin: 'http://localhost:5173', // allow local frontend during development
    credentials: true,
  }))
}

/* -------------------Secuirty Headers (Helmet) ---------------------- */
app.use(helmet({contentSecurityPolicy: false}))
app.use(helmet.frameguard({action: 'deny'}))
app.use(helmet.noSniff())
app.use(helmet.referrerPolicy({policy: 'no-referrer'}))
if (process.env.NODE_ENV === 'production') {
  app.use(helmet.hsts({maxAge: 31536000, includeSubDomains: true, preload: true}))
}

/* ───────────────────── Stripe webhook (BEFORE json parser and use express.raw or signature verification fails) ──────────*/
app.post(
  '/api/payments/webhook',
  express.raw({type: 'application/json'}),
  paymentController.handleStripeWebhook
)

/* ------------------ Body parsers (after webhook) --------------*/
app.use(express.json({limit: '10kb'}))
app.use(express.urlencoded({extended: true, limit: '10kb'}))

/* ─────────────────────── Rate limiting ─────────────────────── */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {message: 'Too many requests. Try again later.'},
})
// Exempt Stripe webhook from rate-limits (handles retries)
app.use((req, res, next) => {
  if (req.originalUrl.startsWith('/api/payments/webhook')) return next()
  return apiLimiter(req, res, next)
})

/* ------------- Additional per-route auth rate limits ----------------- */
app.use('/api/auth/login', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  message: {message: 'Too many failed logins. Try again in 15 minutes.'},
}))

/* ───────────────────── Health & payments confirm ───────────────────── */
app.get('/', (_req, res) => res.send('NextUp API (showcase) running'))
app.get('/api/health', (_req, res) => res.status(200).json({status: 'ok'}))
app.get('/api/payments/confirm', protect, paymentController.confirmCheckout)

/* ─────────────────────────── Routers ─────────────────────────── */
app.use('/api/auth', authRoutes)
app.use('/api/seasons', seasonRoutes)
app.use('/api/admin', adminRoutes)

/* ───────────────────── 404 & error handling ───────────────────── */
app.use((req, res) => {
  res.status(404).json({message: 'Route not found.'})
})

if (process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.errorHandler())
}

app.use((err, req, res, _next) => {
  console.error(err?.stack || err)
  res.status(err.status || 500).json({
    message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
  })
})

module.exports = app