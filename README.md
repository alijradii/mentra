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

### Development

| Command                  | Description                                                          |
| ------------------------ | -------------------------------------------------------------------- |
| `bun run dev:frontend`   | Start Next.js dev server (default: http://localhost:3021)            |
| `bun run dev:backend`    | Start Express dev server with watch (default: http://localhost:3020) |
| `bun run build`          | Build frontend and backend                                           |
| `bun run build:frontend` | Build Next.js app                                                    |
| `bun run build:backend`  | Build Express app                                                    |

### Production (PM2)

| Command                  | Description                                                          |
| ------------------------ | -------------------------------------------------------------------- |
| `bun run deploy`         | Full deployment: build and start apps with PM2                       |
| `bun run start`          | Start apps with PM2 (without rebuilding)                             |
| `bun run stop`           | Stop all PM2 processes                                               |
| `bun run restart`        | Restart all PM2 processes                                            |
| `bun run logs`           | View all application logs                                            |
| `bun run logs:backend`   | View backend logs only                                               |
| `bun run logs:frontend`  | View frontend logs only                                              |
| `bun run pm2:status`     | Show PM2 process status                                              |
| `bun run pm2:monit`      | Real-time monitoring dashboard                                       |

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete production deployment guide.

## Environment

- **Backend** (`apps/backend/.env`):
    - `PORT` – server port (default: 3020)
    - `MONGODB_URI` – MongoDB connection string (default: `mongodb://localhost:27017`)
    - `MONGODB_DB` – database name (default: `mentra`)
    - `JWT_SECRET` – JWT signing secret (required for auth)
    - `JWT_EXPIRES_IN` – token expiration (default: 7d)
    - `FRONTEND_URL` – frontend URL for CORS (default: http://localhost:3021)

- **Frontend** (`apps/frontend/.env.local`):
    - `NEXT_PUBLIC_API_URL` – backend API URL (default: http://localhost:3020)

## Shared package

- **Types**: `ApiResponse`, `PaginatedResponse`, `PaginationParams` in `shared/types`
- **Schemas**: Zod schemas in `shared/schemas` (e.g. `paginationSchema`, `idParamSchema`)
- **DTOs**: Request/response validation in `shared/dtos` (e.g. `createExampleSchema`, `CreateExampleDto`)

The shared package uses TypeScript source files directly (no build step required). Add new types, schemas, or DTOs in `packages/shared/src` and re-export from `packages/shared/src/index.ts`. Bun and Next.js will load the TypeScript files natively.

## Backend Architecture

The backend follows an **MVC (Model-View-Controller)** architecture for better organization and maintainability:

- **Controllers** (`/controllers`) - Handle HTTP requests and responses
- **Services** (`/services`) - Business logic and permission checks
- **Models** (`/models`) - Database operations and data access
- **Routes** (`/routes`) - API endpoint definitions
- **Middleware** (`/middleware`) - Authentication and request processing

See [Backend Architecture Documentation](apps/backend/ARCHITECTURE.md) for detailed information.

## API Documentation

- **Courses API**: See [COURSES_API.md](COURSES_API.md) for complete endpoint documentation
- **Authentication**: JWT-based authentication with email verification
