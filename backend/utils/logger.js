// utils/logger.js
// Pino logger

const pino = require('pino')

const logger = pino({
  transport: process.env.NODE_ENV === 'production' ? undefined : {
    target: 'pino-pretty',
    options: {colorize: true},
  },
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
})

module.exports = logger