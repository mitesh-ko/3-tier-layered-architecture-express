---
name: backend-3tier-architecture
description: >-
  Use this skill when designing, creating, refactoring, or extending backend feature modules, routes,
  controllers, services, repositories, or schemas. Enforces clean 3-tier layered separation of concerns,
  Zod DTO validation, subpath imports, and dependency injection.
---

# 3-Tier Layered Backend Architecture Guide

This skill governs the construction and modification of feature modules in the backend codebase (`backend/src/modules/`). Every module must follow the **Controller -> Service -> Repository** pattern.

---

## Module Folder Structure

Every domain feature resides in its own isolated directory under `src/modules/<feature-name>/`:

```text
src/modules/<feature-name>/
├── <feature-name>.controller.ts   # HTTP transport, query/body extraction, response wrapping
├── <feature-name>.service.ts      # Business rules, domain validation, caching, errors
├── <feature-name>.repository.ts   # Database queries extending BaseRepository<T>
├── <feature-name>.model.ts        # Mongoose schema, document interface, and indexes
├── <feature-name>.schema.ts       # Zod validation schemas and inferred DTO types
└── <feature-name>.route.ts        # Express router, authentication, RBAC, and validation
```

---

## Architectural Rules for Each Layer

### 1. Route Layer (`*.route.ts`)
- Mount middlewares in strict order:
  1. Authentication (`authenticate`) if protected.
  2. Authorization (`authorize('admin', ...)`) for role restrictions.
  3. Validation (`validate({ body, query, params })`) with Zod schemas.
  4. Controller action wrapped in `asyncHandler(controller.action)`.
- Export default `router`.
- Register the router in `src/routes/index.ts` under `/api/v1/<feature-name>`.

### 2. Controller Layer (`*.controller.ts`)
- Class-based with dependency-injected Service (defaulting to singleton instance).
- Extracts typed parameters from `req.body`, `req.query`, `req.params`, and `req.user`.
- Calls Service methods asynchronously.
- Returns standardized responses via `ApiResponse.success(res, message, data, statusCode, meta)`.
- Never catches errors manually unless transforming them; let `asyncHandler` pass errors to global error middleware.
- **Intent-Driven Documentation**: Document intent, HTTP method/route contract, and business effect. Never restate static types (avoid boilerplate `@param req / @param res`).

### 3. Service Layer (`*.service.ts`)
- Pure business logic. Absolutely zero Express imports (`Request`, `Response`, `NextFunction`).
- Document complex business invariants, cryptographic algorithms, or cache-invalidation rules.
- Throws typed `AppError` subclasses:
  - `NotFoundError` (resource does not exist)
  - `ForbiddenError` (user lacks ownership or permission)
  - `ConflictError` (duplicate unique field, e.g. email, SKU)
  - `BadRequestError` / `UnprocessableEntityError` (business rule invariant broken)
- Manages caching with `CacheService`:
  - Cache-aside for reads with deterministic key (`${domain}:${id}`).
  - Invalidate cache on mutations (`del`).

### 4. Repository Layer (`*.repository.ts`)
- Inherits from `BaseRepository<TDocument>`.
- Provides custom domain queries (e.g. `findBySlug`, `existsBySku`).
- Keeps Mongoose query complexity out of the Service layer.

### 5. Schema & DTO Layer (`*.schema.ts`)
- Define Zod schemas for `Params`, `Query`, and `Body`.
- Export inferred types: `export type CreateFeatureDto = z.infer<typeof CreateFeatureSchema>;`.

---

## Supporting References

- [Detailed Tier Responsibilities & Rules](./references/tier-responsibilities.md)
- [DTO Validation Patterns with Zod](./references/dto-and-validation.md)
- [Complete Module Scaffolding Template](./examples/module-scaffolding-template.ts)
