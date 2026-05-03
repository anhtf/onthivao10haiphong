# OnThiVao10HaiPhong 🎓

Nền tảng luyện thi trực tuyến vào lớp 10 Hải Phòng — Full-stack web application cho học sinh và giáo viên.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + TailwindCSS |
| Backend | Node.js + Express |
| Database | PostgreSQL 15 |
| ORM | Prisma |
| Auth | JWT (Access + Refresh tokens) |
| PDF Parsing | pdf-parse |
| Excel Parsing | SheetJS (xlsx) |
| Containerization | Docker + Docker Compose |

---

## 🚀 Quick Start (Docker — Recommended)

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) + [Docker Compose](https://docs.docker.com/compose/install/)

```bash
# 1. Clone the project
git clone <repo-url>
cd onthivao10haiphong

# 2. Copy and review environment variables (optional — defaults work)
cp .env.example backend/.env

# 3. Build and start all services
docker compose up --build

# 4. In a new terminal — run DB seed (creates admin account)
docker compose exec backend node prisma/seed.js
```

**Services:**
- 🌐 Frontend: http://localhost:5173
- 🔌 Backend API: http://localhost:3000
- 🐘 PostgreSQL: localhost:5432

**Default admin credentials:**
- Email: `admin@onthivao.edu.vn`
- Password: `Admin@123456`

---

## 💻 Local Development (without Docker)

### Prerequisites
- Node.js 20+
- PostgreSQL 15 running locally

### Backend setup

```bash
cd backend

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# Seed admin account
node prisma/seed.js

# Start development server
npm run dev
# → API running at http://localhost:3000
```

### Frontend setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
# → App running at http://localhost:5173
```

---

## 📁 Project Structure

```
onthivao10haiphong/
├── docker-compose.yml
├── .env.example
│
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma        # Database schema
│   │   └── seed.js              # Admin account seed
│   ├── src/
│   │   ├── index.js             # Entry point
│   │   ├── app.js               # Express setup
│   │   ├── config/database.js   # Prisma client
│   │   ├── middleware/
│   │   │   ├── auth.js          # JWT verification
│   │   │   ├── roleGuard.js     # Admin/Student guards
│   │   │   └── errorHandler.js
│   │   ├── modules/
│   │   │   ├── auth/            # Login, register, refresh
│   │   │   ├── users/           # Admin: manage students
│   │   │   ├── exams/           # CRUD + PDF/Excel upload
│   │   │   ├── questions/       # Question CRUD + bulk save
│   │   │   ├── sessions/        # Exam taking sessions
│   │   │   └── results/         # Scores + analytics
│   │   └── utils/
│   │       ├── excel.parser.js  # xlsx answer key parser
│   │       ├── cache.js         # In-memory cache
│   │       └── logger.js        # Winston logger
│   └── uploads/                 # PDF & Excel files
│
└── frontend/
    └── src/
        ├── api/                 # Axios API clients
        ├── components/
        │   ├── common/          # Button, Input, Modal, Navbar
        │   ├── exam/            # Timer, QuestionView, QuestionNav
        │   └── admin/           # QuestionEditor, StatsCard
        ├── pages/
        │   ├── auth/            # Login, Register
        │   ├── student/         # Dashboard, ExamPage, ResultPage
        │   └── admin/           # Dashboard, ExamEditorPage, Analytics
        ├── stores/              # Zustand state (auth, exam)
        ├── hooks/               # useTimer, useAuth
        └── utils/               # helpers, formatters
```

---

## 🔑 API Endpoints

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register student |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/auth/me` | Get current user |

### Exams (Admin)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/exams` | List exams |
| POST | `/api/exams` | Create exam |
| PUT | `/api/exams/:id` | Update exam |
| DELETE | `/api/exams/:id` | Delete exam |
| POST | `/api/exams/:id/upload-pdf` | Upload & parse PDF |
| POST | `/api/exams/:id/upload-answer-key` | Upload Excel answer key |
| PATCH | `/api/exams/:id/publish` | Publish exam |

### Sessions (Student)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/sessions` | Start exam session |
| GET | `/api/sessions/:id` | Get session + questions |
| POST | `/api/sessions/:id/submit` | Submit answers |

### Results
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/results/my` | Student's results |
| GET | `/api/results/session/:id` | Session detail review |
| GET | `/api/results/exam/:id` | Admin: all results for exam |
| GET | `/api/results/analytics/:id` | Admin: exam analytics |
| GET | `/api/results/analytics/overview` | Admin: platform overview |

---

## 📋 Excel Answer Key Format

The Excel file must have these columns (flexible naming):

| Question Number (Số câu) | Correct Answer (Đáp án) |
|---|---|
| 1 | A |
| 2 | C |
| 3 | B |

Valid answers: `A`, `B`, `C`, or `D` (case-insensitive)

---

## 🛡️ Anti-Cheat Features

1. **Tab switch detection** — `visibilitychange` event logged server-side, warning shown to student
2. **Copy-paste disabled** — CSS `user-select: none` + keyboard event prevention on exam page
3. **Right-click disabled** — `contextmenu` event prevented
4. **Server-side time validation** — Submission validated against `session.startedAt + timeLimitMinutes`
5. **Auto-submit on timer expiry** — Client triggers submit when countdown reaches 0

---

## 🏗️ Scalability Notes

- **PostgreSQL connection pooling** via Prisma (configurable via `DATABASE_URL` with `connection_limit`)
- **In-memory caching** for exam data (TTL: 2 min) reduces DB load
- **Stateless JWT auth** — no server-side session state, easily horizontally scalable
- For 1000+ concurrent users in production: add Redis cache + Nginx load balancer + S3 file storage

---

## 🔧 Environment Variables

See `.env.example` for all required variables.

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | — |
| `JWT_ACCESS_SECRET` | Access token signing secret | — |
| `JWT_REFRESH_SECRET` | Refresh token signing secret | — |
| `JWT_ACCESS_EXPIRES` | Access token TTL | `15m` |
| `JWT_REFRESH_EXPIRES` | Refresh token TTL | `7d` |
| `ADMIN_EMAIL` | Initial admin email | `admin@onthivao.edu.vn` |
| `ADMIN_PASSWORD` | Initial admin password | `Admin@123456` |
| `MAX_FILE_SIZE_MB` | Max upload size | `20` |
