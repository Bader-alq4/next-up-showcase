// server.js – single entry point for NextUp API showcase

// 1) Load .env in non-prod
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
  }
  
// 2) Validate required environment variables
const required = [
  'DATABASE_URL', 
  'JWT_SECRET', 
  'REFRESH_TOKEN_SECRET', 
  'STRIPE_SECRET_KEY', 
  'STRIPE_WEBHOOK_SECRET', 
  'FRONTEND_URL', 
  'RESEND_API_KEY', 
  'SENTRY_DSN', 
  'ADMIN_NOTICES_EMAIL'
];
  
required.forEach((k) => {
  if (!process.env[k]) {
    console.error(`Missing required env: ${k}`);
    process.exit(1);
  }
});
  
const Sentry = require('@sentry/node');
const logger = require('./utils/logger');
const app = require('./app');
  
// 3) Force HTTPS in production (behind proxy). 'trust proxy` is set in app.js. (safe for stripe webhooks)
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => (req.secure ? next() :
    res.redirect(301, `https://${req.headers.host}${req.url}`)));
}
  
// 4) Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  logger.info({port: PORT, env: process.env.NODE_ENV || 'development'}, 'API listening');
});
  
// 5) Process guards and graceful shutdown
const shutdown = async (code = 0) => {
  try {
    logger.info('Shutting down');
    await new Promise((r) => server.close(r));
    if (process.env.SENTRY_DSN) await Sentry.flush(2000);
  } catch (err) {
    logger.error({err}, 'Error during shutdown');
  } finally {
    logger.info('Server closed.');
    process.exit(code);
  }
};
  
process.on('SIGTERM', () => shutdown(0));
process.on('SIGINT', () => shutdown(0));
  
process.on('unhandledRejection', async (err) => {
  logger.error({err}, 'Unhandled Rejection');
  if (process.env.SENTRY_DSN) await Sentry.captureException(err);
  shutdown(1);
});
  
process.on('uncaughtException', async (err) => {
  logger.fatal({err}, 'Uncaught Exception');
  if (process.env.SENTRY_DSN) await Sentry.captureException(err);
  shutdown(1);
});  