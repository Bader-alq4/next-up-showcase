# NextUp Hoops API (Showcase)

---

## Live Demo

[**Watch the 2-minute demo on Loom**](https://www.loom.com/share/a33a5d323d4c44009416b2ebdadb3789)

> _This video showcases account creation, admin login, payment processing via Stripe, and email notifications via Resend._

---

This repository is a **backend showcase** for the real-world project **NextUp Hoops**, a tryout and registration management platform for youth basketball organizations.

This repo is not the full production app; it’s a **cleaned, secure, and documented showcase** of how I structure and write backend code for professional APIs.

---

## Overview

The **NextUp API (Showcase)** demonstrates:
- Authentication and JWT-based session handling
- Role-based access control (users, admins)
- Payments via **Stripe**
- Transactional emails via **Resend**
- Secure middleware setup (CORS, Helmet, Rate Limiting)
- Sentry logging and error handling
- MVC project structure using **Express** and **PostgreSQL**

All sensitive keys have been replaced with placeholders. See `.env.example` for structure.

---

## Tech Stack

- **Runtime:** Node.js + Express  
- **Database:** PostgreSQL (pg library)  
- **Payments:** Stripe API (webhooks + checkout)  
- **Email:** Resend API  
- **Logging:** Pino logger  
- **Monitoring:** Sentry  
- **Auth:** JWT (Access + Refresh Tokens)  
- **Security:** Helmet, Rate Limiting, CORS, Cookie-based refresh tokens  

---

## Features Included in This Showcase

| Category | Features |
|-----------|-----------|
| **Authentication** | Register, login, refresh, logout (JWT + bcrypt) |
| **Admin Control** | Manage users, seasons, and tryouts |
| **Payments** | Stripe checkout + webhook handling |
| **Email Service** | Send transactional emails via Resend |
| **Security** | Rate limiting, CORS, Helmet, environment validation |
| **Error Tracking** | Full Sentry integration |
| **Logging** | Centralized Pino logger for consistent output |

---

## Security & Architecture Highlights

- Environment validation before startup  
- Secure cookie handling for refresh tokens  
- HTTPS redirect enforcement in production  
- Per-route rate limiting (login brute-force protection)  
- CORS whitelist for frontend origins  
- Centralized error handling + Sentry integration  

---

## Notes

- This repository is for **code showcase and review purposes only**.  
  It is not configured for local execution or live deployment.

- This repo is for **showcase purposes only**. Sensitive integrations like Stripe and Resend are disabled by default.  
