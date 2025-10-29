// config/db.js

const {Pool} = require('pg')
const logger = require('../utils/logger')

// Create a new pool using DATABASE_URL from .env
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? {rejectUnauthorized: false}
    : false,
})

// Log successful connection
pool.on('connect', () => {
  logger.info('PostgreSQL database connected successfully')
})

// Log errors on the pool
pool.on('error', (err) => {
  logger.error({err}, 'PostgreSQL pool encountered an error')
})

module.exports = pool