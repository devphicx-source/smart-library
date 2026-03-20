# SLMS — Smart Study-Library Management System

A production-ready MVP for desk tracking, student streaks, gamified leaderboards, fee management, and WhatsApp automation.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router) + Tailwind CSS |
| Backend | Node.js + Express |
| Database | MongoDB (Mongoose) |
| Auth | JWT + Phone OTP |
| Messaging | Twilio (WhatsApp) |

## Quick Start

### 1. Setup MongoDB

Ensure MongoDB is running locally on `mongodb://localhost:27017`.

### 2. Start Backend

```bash
cd server
cp .env.example .env    # Edit .env with your values
npm install
node src/seed.js        # Creates 30 desks, admin, sample students
npm run dev             # → http://localhost:5000
```

### 3. Start Frontend

```bash
cd client
npm install
npm run dev             # → http://localhost:3000
```

### 4. Login

- **Admin:** `+919999999999`
- **Students:** `+919876543210`, `+919876543211`, `+919876543212`
- OTP is logged to the server console in dev mode.

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/send-otp` | Public | Send OTP |
| POST | `/api/auth/verify-otp` | Public | Verify → JWT |
| GET | `/api/auth/me` | Auth | Profile |
| POST | `/api/sessions/check-in` | Student | Start session |
| POST | `/api/sessions/check-out` | Student | End session |
| GET | `/api/sessions/active` | Auth | Current session |
| GET | `/api/sessions/history` | Auth | Past sessions |
| GET | `/api/leaderboard` | Auth | Streak leaderboard |
| GET | `/api/stats/daily` | Auth | Today's stats |
| GET | `/api/stats/weekly` | Auth | 7-day trend |
| GET | `/api/fees/my` | Student | Own fees |
| GET | `/api/fees` | Admin | All fees |
| POST | `/api/fees` | Admin | Create fee |
| PATCH | `/api/fees/:id` | Admin | Update status |
| GET | `/api/admin/occupancy` | Admin | Desk grid |

## Architecture

```
client/                     server/
├── src/app/                ├── src/models/      (4 Mongoose schemas)
│   ├── page.js (login)     ├── src/controllers/ (4 controllers)
│   ├── dashboard/          ├── src/routes/      (4 route files)
│   └── admin/              ├── src/services/    (streak, leaderboard, whatsapp)
├── src/lib/                ├── src/middleware/   (JWT auth, RBAC, validation)
│   ├── api.js              ├── src/jobs/        (2 cron jobs)
│   ├── auth.js             └── server.js
│   └── utils.js
└── tailwind.config.js
```
