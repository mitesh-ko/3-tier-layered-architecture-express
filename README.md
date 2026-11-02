# Express TypeScript Starter (3-Tier Layered Architecture)

A production-grade, extensible RESTful API starter built with **Node.js, Express, TypeScript, MongoDB, and Redis**, implementing a strict **3-Tier Layered Architecture** (Controllers → Services → Repositories).

---

## 🏗 Architecture Overview

```
HTTP Request
     │
     ▼
┌────────────────────────────────────────────────────────┐
│ Middlewares                                            │
│ • Helmet (Security Headers)                            │
│ • CORS (Dynamic Whitelist)                             │
│ • Request ID (`X-Request-Id` Correlation)              │
│ • Pino HTTP Logger                                     │
│ • MongoSanitize (NoSQL Injection Defense)              │
│ • Rate Limiter (Brute-Force & DoS Protection)          │
│ • Zod DTO Validation                                  │
│ • JWT Authentication & RBAC                            │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ 1. Controller Layer (HTTP Transport)                   │
│ • Extracts DTOs, query, and route parameters           │
│ • Delegates business decisions to Services             │
│ • Returns standardized `ApiResponse` envelopes        │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ 2. Service Layer (Domain & Business Logic)             │
│ • Enforces business invariants and workflow logic      │
│ • Password hashing & JWT access/refresh token rotation │
│ • Redis caching strategies (`getOrSet`, invalidation)  │
│ • Throws typed `AppError` subclasses                   │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ 3. Repository Layer (Data Access Abstraction)          │
│ • Generic `BaseRepository<T>` CRUD & lean pagination   │
│ • Domain-specific repositories (`UserRepository`)      │
│ • Mongoose ORM / MongoDB connection pooling            │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ Centralized Error Handler                              │
│ • Catches operational `AppError` and system exceptions │
│ • Normalizes MongoDB, JWT, and Zod errors              │
│ • Emits uniform JSON error response                    │
└────────────────────────────────────────────────────────┘
```

---

## 🛠 Tech Stack

| Category | Technology |
| :--- | :--- |
| **Language & Runtime** | TypeScript 5.8 (Strict Mode), Node.js (v22+), `tsx` (dev runtime), `tsup` (esbuild bundler) |
| **Web Framework** | Express 4.21 with typed Request/Response augmentations |
| **Database & ODM** | MongoDB 7.0 + Mongoose 8 (Connection pooling, auto-reconnect, health pings) |
| **Caching & In-Memory**| Redis 7.2 (ioredis client with exponential retry strategy and graceful fallback) |
| **Authentication** | JWT (Short-lived access token + rotating refresh token), bcryptjs |
| **Security** | Helmet, dynamic CORS, rate-limiting (`express-rate-limit`), NoSQL injection protection (`express-mongo-sanitize`) |
| **Validation** | Zod (Type inference, schema validation for body, query, and params) |
| **Logging** | Pino & Pino-HTTP (High-speed structured JSON, request correlation IDs, pino-pretty in dev) |
| **API Documentation**| OpenAPI 3.0 / Swagger UI (`/api-docs`) |
| **Testing** | Vitest (unit & integration tests), Supertest |
| **DevOps** | Multi-stage Dockerfile (Node 22 Alpine, non-root user), Docker Compose, GitHub Actions CI |

---

## 📁 Project Directory Structure

```
backend/
├── .github/workflows/ci.yml       # GitHub Actions CI pipeline
├── tests/                         # Automated test suite (unit & integration)
│   ├── integration/               # Supertest HTTP integration tests
│   └── unit/                      # Isolated service unit tests
├── src/
│   ├── @types/                    # Express Request & JWT type augmentations
│   ├── config/                    # Validated configs (Zod env, DB, Redis, CORS, Logger)
│   ├── constants/                 # HTTP status codes & system constants
│   ├── docs/                      # Swagger OpenAPI 3.0 configuration
│   ├── errors/                    # Custom AppError hierarchy (400, 401, 403, 404, 409, 422, 500)
│   ├── middlewares/               # RequestId, Logger, Auth, RBAC, Validate, RateLimiter, ErrorHandler
│   ├── modules/                   # 3-Tier Feature Modules
│   │   ├── auth/                  # Auth Controller, Service, Zod Schemas, Routes
│   │   ├── health/                # Health, Liveness, and Readiness endpoints
│   │   └── user/                  # User Controller, Service, Repository, Model, Schemas, Routes
│   ├── routes/                    # Versioned API Router (`/api/v1/`)
│   ├── shared/                    # Generic BaseRepository, CacheService, TokenService, ApiResponse
│   ├── app.ts                     # Express application middleware pipeline setup
│   └── server.ts                  # Server bootstrap & graceful shutdown hooks (SIGTERM/SIGINT)
├── Dockerfile                     # Multi-stage production container build
├── docker-compose.yml             # Local orchestrated stack (API + MongoDB + Redis)
├── tsconfig.json                  # Strict TypeScript configuration
└── vitest.config.ts               # Vitest test runner configuration
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v20+ (v22 recommended)
- **MongoDB** running locally or in Docker
- **Redis** (optional; server gracefully operates without cache if disabled)

### 1. Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
```

### 2. Run in Development Mode

```bash
# Starts development server with live reload via tsx
npm run dev
```

Server starts on `http://localhost:4000`:
- **API Base:** `http://localhost:4000/api/v1`
- **Swagger Docs:** `http://localhost:4000/api-docs`
- **Health Check:** `http://localhost:4000/healthz`
- **Readiness Check:** `http://localhost:4000/readyz`

### 3. Run with Docker Compose

Launch the entire stack (API, MongoDB, Redis) in one command:

```bash
docker compose up -d --build
```

---

## 🧪 Testing & Code Quality

```bash
# Run all tests (Vitest)
npm run test

# Run tests in watch mode
npm run test:watch

# Generate code coverage
npm run test:coverage

# TypeScript compile-time typecheck
npm run typecheck

# Production build
npm run build
```

---

## 📡 API Endpoints Reference

### Health Endpoints
| Method | Route | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/healthz` | System health check (MongoDB, Redis, memory, uptime) | No |
| `GET` | `/livez` | Kubernetes liveness probe | No |
| `GET` | `/readyz` | Kubernetes readiness probe | No |

### Authentication (`/api/v1/auth`)
| Method | Route | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Register new user account | No (Rate-limited) |
| `POST` | `/api/v1/auth/login` | Login with credentials and receive access & refresh tokens | No (Rate-limited) |
| `POST` | `/api/v1/auth/refresh` | Rotate tokens using a valid refresh token | No |
| `GET` | `/api/v1/auth/me` | Get profile of currently logged-in user | Bearer Token |

### Users (`/api/v1/users`)
| Method | Route | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/users` | List paginated users with optional search/status filters | Admin Only |
| `GET` | `/api/v1/users/:id` | Get user details by ID | Bearer Token |
| `PUT` | `/api/v1/users/:id` | Update user profile | Self or Admin |
| `DELETE` | `/api/v1/users/:id` | Delete user account | Self or Admin |

---

## 🔒 Security & Standard Response Format

All responses follow a consistent envelope:

### Successful Response
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Users retrieved successfully",
  "data": [ ... ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "timestamp": "2026-10-25T00:00:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "statusCode": 422,
  "message": "Request validation failed",
  "errorCode": "VALIDATION_ERROR",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email address"
    }
  ],
  "timestamp": "2026-10-25T00:00:00.000Z"
}
```

---

## 🤝 Community & Code of Conduct

Please review our [Code of Conduct](./CODE_OF_CONDUCT.md) before contributing to ensure an open, welcoming, diverse, and harassment-free community environment.

