// utils/email.js
// Helper for sending transactional emails via Resend

const { Resend } = require('resend')

const resend = new Resend(process.env.RESEND_API_KEY)

// sendEmail — sends an HTML email to a recipient via Resend
const sendEmail = async (to, subject, html) => {
  return resend.emails.send({
    from: 'Next Up Hoops <noreply@nextuphoops.ca>', // Update once domain is verified
    to,
    subject,
    html,
  })
}

module.exports = sendEmail