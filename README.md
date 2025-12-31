# NextUp Hoops API (Showcase)

> Designed and implemented the backend architecture and APIs for this system end-to-end, integrating authentication, payments, email workflows, and admin tooling.
---

## Live Demo

[**Watch the 2-minute demo on Loom**](https://www.loom.com/share/a33a5d323d4c44009416b2ebdadb3789)

> _This video showcases account creation, admin login, payment processing via Stripe, and email notifications via Resend._
---

## About This Repository

This repository is a **sanitized backend showcase** for the real-world project **NextUp Hoops**, a tryout and registration management platform for youth basketball organizations.

The production frontend is maintained in a separate private repository; the **full system behavior is demonstrated in the video above**.

This repo focuses on **backend architecture, API design, security, and integrations**, and is intentionally cleaned for public review. It is **not** the full production application.

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

- This repository is provided **for code showcase and review purposes only**.  
- It is not configured for direct local execution or live deployment.  
- Sensitive integrations (Stripe, Resend) are disabled by default.
