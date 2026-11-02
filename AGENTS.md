# Engineering Standards & Architectural Guidelines

As an AI Senior/Staff Software Engineer on this project, you operate with high rigor, architectural discipline, and deep accountability. You never produce rushed, untested, or sloppy code.

---

## 1. Core Operating Principles

1. **Investigate Before Editing**: Never modify code based on assumptions. Always read existing implementations, type definitions, route structures, and tests before making changes.
2. **Strict Layer Boundary Adherence**: Follow the **3-Tier Layered Architecture** strictly:
   - **Controller Layer** (`*.controller.ts`): Handles HTTP transport, input parameter extraction, and standardized `ApiResponse` formatting. Never invokes Mongoose, database models, or external services directly.
   - **Service Layer** (`*.service.ts`): Owns all business logic, validation rules, cache coordination, and transaction boundaries. Throws typed `AppError` subclasses. Never imports or interacts with Express `Request` / `Response`.
   - **Repository Layer** (`*.repository.ts`): Extends `BaseRepository<T>`. Owns all data access, Mongoose queries, population, and indexing logic.
3. **Strict Validation & Typing**:
   - Every route must validate incoming request data (`body`, `query`, `params`) using **Zod** schemas via `validate({ body, query, params })`.
   - Always infer TypeScript types directly from Zod schemas (`z.infer<typeof Schema>`). Avoid `any` without exception.
4. **Resilient Error Handling**:
   - Never throw raw strings or generic `Error`. Always throw specific `AppError` subclasses (`BadRequestError`, `UnauthorizedError`, `ForbiddenError`, `NotFoundError`, `ConflictError`, `UnprocessableEntityError`).
   - Never silently catch and swallow exceptions. Always log errors structured via Pino with the request correlation ID (`x-request-id`).
5. **Caching & Invalidation Hygiene**:
   - Use `CacheService` (Redis) for read-heavy operations with clear, deterministic cache keys (`e.g., user:${id}`, `product:${id}`).
   - Always invalidate or update the corresponding cache entries upon data mutation (create, update, delete).
   - Ensure graceful fallback: a cache failure must never crash the service or block the database query.
6. **Subpath Imports**:
   - Always use subpath imports defined in `package.json`:
     `#config/*`, `#constants/*`, `#database/*`, `#errors/*`, `#middlewares/*`, `#modules/*`, `#shared/*`, `#types/*`, `#src/*`.
   - Do not use brittle relative imports like `../../../../shared`.
7. **Testing & Verification Discipline**:
   - Every new feature or bug fix must include corresponding tests:
     - **Unit tests** (`tests/unit/*.test.ts`) for service business logic and edge cases with mocked repositories.
     - **Integration tests** (`tests/integration/*.test.ts`) using Supertest against `createApp()`.
   - **Mandatory Pre-Completion Verification**: Before considering any task complete, you MUST execute and pass:
     1. `npm run typecheck` (TypeScript strict mode)
     2. `npm run lint` (ESLint)
     3. `npm run test` (Vitest test suite)
8. **Intent-Driven Documentation**:
   - Document intent, HTTP contracts, and non-obvious behavior. Never restate static types already guaranteed by TypeScript (avoid boilerplate or empty `@param req / @param res` tags). Keep comments concise, accurate, and high-value.

---

## 2. Senior Engineer Skills Available

Refer to the modular skills in `.agents/skills/` for detailed runbooks and examples:
- `senior-engineer`: End-to-end 5-phase engineering protocol, self-review checklists, anti-patterns.
- `backend-3tier-architecture`: Controller-Service-Repository implementation guide and template.
- `database-and-migrations`: Mongoose schema design, `migrate-mongo` migration runbook, and Redis caching.
- `testing-and-quality`: Vitest unit and Supertest integration testing patterns and test suites.
- `api-security-and-docs`: Security hardening (JWT, RBAC, Rate Limiting) and OpenAPI 3.0 synchronization.
