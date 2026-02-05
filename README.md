# Mentra

An **AI-powered learning platform** for creating, sharing, and completing courses with a gamified experience.

**Creating learning material** — Authors can build courses with custom roadmaps, write and structure content, pull in resources from the web, and add quizzes and challenges.

**Learning & engagement** — Learners discover and follow courses, set weekly goals, earn levels and rewards, and progress through a structured, gamified flow.

---

## Tech stack

Monorepo: **Next.js** (frontend), **Express** (backend), **shared** package (types, DTOs, Zod). **Bun** runtime, **TypeScript** throughout.

## Structure

```
mentra/
├── apps/
│   ├── frontend/     # Next.js 16.1.6, Tailwind, shadcn/ui
│   └── backend/      # Express 5.2.1, MongoDB
├── packages/
│   └── shared/       # Shared types, DTOs, Zod schemas
├── package.json      # Workspace root
└── tsconfig.json
```

## Prerequisites

- [Bun](https://bun.sh) installed
- MongoDB running locally (or set `MONGODB_URI`)

## Setup

```bash
bun install
```

## Scripts

| Command | Description |
|--------|-------------|
| `bun run dev:frontend` | Start Next.js dev server (default: http://localhost:3011) |
| `bun run dev:backend`  | Start Express dev server with watch (default: http://localhost:3010) |
| `bun run build`        | Build frontend and backend |
| `bun run build:frontend` | Build Next.js app |
| `bun run build:backend`  | Build Express app |

## Environment

- **Backend** (`apps/backend/.env`):
  - `PORT` – server port (default: 3010)
  - `MONGODB_URI` – MongoDB connection string (default: `mongodb://localhost:27017`)
  - `MONGODB_DB` – database name (default: `mentra`)
  - `JWT_SECRET` – JWT signing secret (required for auth)
  - `JWT_EXPIRES_IN` – token expiration (default: 7d)
  - `FRONTEND_URL` – frontend URL for CORS (default: http://localhost:3011)

- **Frontend** (`apps/frontend/.env.local`):
  - `NEXT_PUBLIC_API_URL` – backend API URL (default: http://localhost:3010)

## Shared package

- **Types**: `ApiResponse`, `PaginatedResponse`, `PaginationParams` in `shared/types`
- **Schemas**: Zod schemas in `shared/schemas` (e.g. `paginationSchema`, `idParamSchema`)
- **DTOs**: Request/response validation in `shared/dtos` (e.g. `createExampleSchema`, `CreateExampleDto`)

The shared package uses TypeScript source files directly (no build step required). Add new types, schemas, or DTOs in `packages/shared/src` and re-export from `packages/shared/src/index.ts`. Bun and Next.js will load the TypeScript files natively.

## Authentication System

This project includes a complete authentication system with:

- 🔐 User registration and login
- ✉️ Email verification with tokens
- 🔒 JWT-based authentication
- 🛡️ Protected routes and middleware
- 🎨 Beautiful UI pages (landing, signup, login, dashboard)

### Getting Started with Auth

1. **Initialize the database**:
   ```bash
   cd apps/backend
   bun run init-auth-db
   ```

2. **Create environment files** (see templates in `.env.example` and `.env.local.example`)

3. **Start both servers**:
   ```bash
   bun run dev
   ```

4. **Visit the app** at http://localhost:3011

5. **Register an account** - the verification URL will be logged to the backend console

For detailed authentication documentation, see [AUTH_SETUP.md](./AUTH_SETUP.md).

### Authentication Pages

- `/` - Landing page
- `/signup` - User registration
- `/login` - User login
- `/dashboard` - Protected dashboard (requires auth)
- `/verify-email` - Email verification handler

### Authentication API

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)
- `POST /api/auth/verify-email` - Verify email with token
- `POST /api/auth/resend-verification` - Resend verification email
